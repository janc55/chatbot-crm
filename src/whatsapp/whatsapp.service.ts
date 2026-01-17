import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { BaileysService } from './baileys.service';
import { LeadsService } from '../leads/leads.service';
import { InteractionsService } from '../interactions/interactions.service';
import { TemplatesService } from '../templates/templates.service';
import { OpenaiService } from '../openai/openai.service';
import { LogsService } from '../logs/logs.service';
import { ChatGateway } from '../chat/chat.gateway';
import { SettingsService } from '../settings/settings.service';
import { LeadStatus, Direction, MessageType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class WhatsappService {
    private readonly logger = new Logger(WhatsappService.name);

    private processedMessages = new Set<string>();
    private handoverTimeouts = new Map<string, NodeJS.Timeout>(); // leadId -> timeout
    private messageBuffers = new Map<string, {
        messages: { text: string, messageId: string }[],
        timeout: NodeJS.Timeout,
        name: string,
        phoneNumber: string
    }>();

    constructor(
        @Inject(forwardRef(() => BaileysService))
        private baileysService: BaileysService,
        private leadsService: LeadsService,
        private interactionsService: InteractionsService,
        private templatesService: TemplatesService,
        private openaiService: OpenaiService,
        private logsService: LogsService,
        @Inject(forwardRef(() => ChatGateway))
        private chatGateway: ChatGateway,
        private settingsService: SettingsService,
    ) {
        this.logger.log('[DEBUG] WhatsappService constructor called');
        this.logger.log('[DEBUG] BaileysService injected:', !!this.baileysService);
        this.logger.log('[DEBUG] LeadsService injected:', !!this.leadsService);
        this.logger.log('[DEBUG] TemplatesService injected:', !!this.templatesService);
        this.logger.log('[DEBUG] OpenAIService injected:', !!this.openaiService);
    }

    async sendFollowUp(lead: any, template: any) {
        // Convertir el número de teléfono a JID completo para enviar mensajes
        const remoteJid = lead.phone.includes('@') ? lead.phone : `${lead.phone}@s.whatsapp.net`;
        await this.sendResponse(remoteJid, {
            text: template.content,
            templateKey: template.key,
            attachments: template.attachments ? JSON.parse(template.attachments) : null
        }, lead);
    }

    async processMessage(data: { remoteJid: string; phoneNumber?: string; text: string; name?: string; messageId: string }) {
        const { remoteJid, phoneNumber: phoneNumberFromData, text, name, messageId } = data;

        this.logger.log(`[DEBUG] processMessage called with data:`, { remoteJid, phoneNumberFromData, text: text.substring(0, 50), messageId });

        // Deduplication Logic
        if (this.processedMessages.has(messageId)) {
            this.logger.warn(`Ignoring duplicate message ID: ${messageId}`);
            return;
        }
        this.processedMessages.add(messageId);
        // Clean up cache after 15 seconds
        setTimeout(() => this.processedMessages.delete(messageId), 15000);

        // Get grouping settings
        const settings = await this.settingsService.getChatbotSettings();

        if (settings.messageGroupingEnabled) {
            this.logger.log(`[GROUPING] Adding message to buffer for ${remoteJid}: ${text}`);

            let buffer = this.messageBuffers.get(remoteJid);

            if (buffer) {
                clearTimeout(buffer.timeout);
                buffer.messages.push({ text, messageId });
            } else {
                buffer = {
                    messages: [{ text, messageId }],
                    name: name || 'Usuario',
                    phoneNumber: phoneNumberFromData || this.extractPhoneFromJid(remoteJid),
                    timeout: null
                };
            }

            buffer.timeout = setTimeout(() => {
                this.executeBatchProcess(remoteJid);
            }, settings.messageGroupingTimeout);

            this.messageBuffers.set(remoteJid, buffer);
            return;
        }

        // Si no está habilitada la agrupación, procesar individualmente (comportamiento anterior refactorizado)
        await this.executeProcessing(remoteJid, phoneNumberFromData, [{ text, messageId }], name);
    }

    private async executeBatchProcess(remoteJid: string) {
        const buffer = this.messageBuffers.get(remoteJid);
        if (!buffer) return;

        this.messageBuffers.delete(remoteJid);

        this.logger.log(`[GROUPING] Executing batch process for ${remoteJid} with ${buffer.messages.length} messages`);
        await this.executeProcessing(remoteJid, buffer.phoneNumber, buffer.messages, buffer.name);
    }

    private async executeProcessing(remoteJid: string, phoneNumberFromData: string, messages: { text: string, messageId: string }[], name: string) {
        // Normalizar texto: unir sin espacios excesivos y convertir ráfagas fragmentadas
        // "re ", "qui ", "sitos" -> "re qui sitos"
        const combinedText = messages.map(m => m.text).join(' ').replace(/\s+/g, ' ').trim();

        if (!combinedText) return;

        this.logger.log(`Processing message(s) from ${remoteJid} (phone: ${phoneNumberFromData}): ${combinedText}`);

        // 1. Find or Create Lead
        let phoneToSave = phoneNumberFromData;

        if (!phoneToSave) {
            phoneToSave = this.extractPhoneFromJid(remoteJid);
            if (!phoneToSave || phoneToSave.length < 8) {
                this.logger.error(`CRITICAL: Cannot extract valid phone number from ${remoteJid}`);
                return;
            }
        }

        if (!/^\d{8,}$/.test(phoneToSave)) {
            this.logger.error(`CRITICAL: Invalid phone number format: ${phoneToSave}`);
            return;
        }

        const lead = await this.leadsService.findOrCreate(phoneToSave, name);

        // 2. Log Inbound Interaction (log separately for transparency, or combined?)
        // Log combined interaction for the conversation view
        await this.interactionsService.logInteraction({
            leadId: lead.id,
            direction: Direction.INBOUND,
            messageType: MessageType.TEXT,
            content: combinedText,
        });

        // Emit to WebSocket
        this.chatGateway.emitMessageToRoom(lead.id, {
            direction: 'INBOUND',
            content: combinedText,
            createdAt: new Date(),
            messageType: 'TEXT',
        });

        // CHECK HANDOVER
        if (lead.isHandoverActive) {
            this.logsService.addLog('log', `Message received from ${lead.phone} while Handover is ACTIVE. Bot is silent.`, 'WhatsappService');
            return;
        }

        // 3. Determine Response
        const responses = await this.handleIntents(combinedText, lead);

        // 4. Send Responses
        if (responses && responses.length > 0) {
            for (const response of responses) {
                await this.sendResponse(remoteJid, response, lead);
                this.logsService.addLog('log', `Bot response sent to ${remoteJid}: ${response.text?.substring(0, 100)}...`, 'WhatsappService');

                // Pequeño delay entre respuestas múltiples para que no lleguen instantáneamente si no hay delay configurado
                if (responses.length > 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        } else {
            this.logsService.addLog('warn', `No response generated for message from ${remoteJid}`, 'WhatsappService');
        }
    }

    private async handleIntents(text: string, lead: any): Promise<{ text: string; templateKey?: string; attachments?: any, statusUpdate?: LeadStatus }[]> {
        const lowerText = text.toLowerCase();
        const responses: { text: string; templateKey?: string; attachments?: any, statusUpdate?: LeadStatus }[] = [];

        // --- RULE BASED MATCHING (Pre-IA) ---
        // Se pueden acumular múltiples respuestas de reglas si es necesario

        // Greeting
        if (lowerText.match(/hola|buen|info|inicio/)) {
            const t = await this.templatesService.findByKey('bienvenida');
            if (t) responses.push({ text: t.content, templateKey: t.key, attachments: t.attachments ? JSON.parse(t.attachments) : null });
        }

        // Careers
        if (lowerText.includes('medicina')) {
            await this.leadsService.updateInterest(lead.phone, 'MEDICINA');
            const t = await this.templatesService.findByKey('brochure_medicina');
            if (t) responses.push({ text: t.content, templateKey: t.key, attachments: t.attachments ? JSON.parse(t.attachments) : null, statusUpdate: LeadStatus.INTERESADO_BROCHURE });
        }

        if (lowerText.includes('derecho') || lowerText.includes('abogado') || lowerText.includes('leyes')) {
            await this.leadsService.updateInterest(lead.phone, 'DERECHO');
            const t = await this.templatesService.findByKey('brochure_derecho');
            if (t) responses.push({ text: t.content, templateKey: t.key, attachments: t.attachments ? JSON.parse(t.attachments) : null, statusUpdate: LeadStatus.INTERESADO_BROCHURE });
        }

        // Si ya tenemos respuestas de reglas, podríamos saltarnos la IA o complementarla.
        // En este caso, si ya hay respuestas (ej. saludo + brochure), buscaremos si hay más intents específicos con la IA
        // pero evitando duplicar lo que ya procesamos manualmente.

        // --- OPENAI FALLBACK / COMPLEX MATCHING ---
        // Contextualize Query
        let searchContext = text;
        if (lead.careerInterest) searchContext += ` ${lead.careerInterest}`;

        const topTemplates = await this.templatesService.findMostRelevant(searchContext, 5);
        let context = topTemplates.length > 0
            ? topTemplates.map(t => `- KEY: ${t.key} (Cat: ${t.category}): ${(t.content || '').substring(0, 150)}...`).join('\n')
            : await this.templatesService.getContextSummary();

        const lastMessages = await this.leadsService.getLastMessages(lead.id, 6);
        const historyText = lastMessages.reverse().map(m => `${m.direction === 'INBOUND' ? 'Usuario' : 'Bot'}: ${m.content}`).join('\n');

        const classification = await this.openaiService.classifyMessage(text, context, historyText);

        if (classification.needs_human) {
            await this.leadsService.toggleHandover(lead.id, true);
            await this.leadsService.updateStatus(lead.phone, LeadStatus.NECESITA_ASESOR);
            this.logsService.addHandoverAlert(lead.id, lead.phone, lead.fullName, `Asistencia humana: "${text.substring(0, 100)}"`);

            const remoteJidForTimeout = lead.phone.includes('@') ? lead.phone : `${lead.phone}@s.whatsapp.net`;
            this.scheduleHandoverTimeout(lead.id, remoteJidForTimeout);

            const t = await this.templatesService.findByKey('necesita_asesor');
            responses.push(t ? { text: t.content, templateKey: t.key } : { text: "Un asesor te contactará.", templateKey: 'fallback' });
            return responses;
        }

        // Deduplicar claves devueltas por la IA para evitar respuestas dobles
        const uniqueTemplateKeys = [...new Set(classification.template_keys)];

        for (const key of uniqueTemplateKeys) {
            // Evitar duplicados si la regla manual ya lo agregó
            if (responses.some(r => r.templateKey === key)) continue;

            const t = await this.templatesService.findByKey(key);
            if (t) {
                let finalText = t.content;
                // Agregar extra_text solo a la última respuesta
                if (key === classification.template_keys[classification.template_keys.length - 1] && classification.extra_text) {
                    finalText += `\n\n${classification.extra_text}`;
                }
                responses.push({
                    text: finalText,
                    templateKey: t.key,
                    attachments: t.attachments ? JSON.parse(t.attachments) : null
                });
            }
        }

        return responses;
    }

    private async handleIntent(text: string, lead: any): Promise<{ text: string; templateKey?: string; attachments?: any, statusUpdate?: LeadStatus } | null> {
        // Este método queda obsoleto pero se mantiene por si hay llamadas internas o para una migración limpia
        const results = await this.handleIntents(text, lead);
        return results.length > 0 ? results[0] : null;

    }

    private async sendResponse(remoteJid: string, response: any, lead: any) {
        this.logger.log(`[DEBUG] sendResponse called for ${remoteJid} with response:`, { text: response.text?.substring(0, 50), templateKey: response.templateKey });

        if (response.attachments && response.attachments.length > 0) {
            const attachmentPath = response.attachments[0];
            const isUrl = attachmentPath.startsWith('http');

            let buffer: Buffer | { url: string };
            if (isUrl) {
                buffer = { url: attachmentPath };
            } else {
                try {
                    buffer = fs.readFileSync(attachmentPath);
                } catch (e) {
                    this.logger.error(`Could not read file ${attachmentPath}: ${e}`);
                    buffer = null;
                }
            }

            if (buffer) {
                if (attachmentPath.endsWith('.pdf')) {
                    await this.baileysService.sendMessage(remoteJid, { document: buffer, mimetype: 'application/pdf', fileName: 'Brochure.pdf', caption: response.text });
                } else {
                    await this.baileysService.sendMessage(remoteJid, { image: buffer, caption: response.text });
                }
            } else {
                await this.baileysService.sendMessage(remoteJid, { text: response.text + "\n(Adjunto no disponible)" });
            }

            await this.interactionsService.logInteraction({
                leadId: lead.id,
                direction: Direction.OUTBOUND,
                messageType: MessageType.MEDIA,
                content: response.text,
                templateKey: response.templateKey,
                usedAi: response.templateKey ? false : true
            });
        } else {
            // Send Text
            await this.baileysService.sendMessage(remoteJid, { text: response.text });
            await this.interactionsService.logInteraction({
                leadId: lead.id,
                direction: Direction.OUTBOUND,
                messageType: MessageType.TEXT,
                content: response.text,
                templateKey: response.templateKey,
                usedAi: response.templateKey ? false : true
            });
        }

        if (response.statusUpdate) {
            await this.leadsService.updateStatus(lead.phone, response.statusUpdate);
        }
    }

    /**
     * Extrae el número de teléfono de un JID como fallback
     * @param jid - El JID completo
     * @returns El número de teléfono normalizado
     */
    private extractPhoneFromJid(jid: string): string {
        // Si tiene @s.whatsapp.net, extraer el número
        if (jid.includes('@s.whatsapp.net')) {
            return jid.split('@')[0].replace(/\D/g, '');
        }
        // Si es un LID, intentar extraer cualquier número
        const phone = jid.split('@')[0].replace(/\D/g, '');
        return phone || jid; // Fallback al JID completo si no hay número
    }

    async getBotStatus() {
        return this.baileysService.getBotInfo();
    }

    async getBotProfilePicture() {
        return this.baileysService.getBotProfilePicture();
    }

    async startConnection() {
        return this.baileysService.startConnection();
    }

    async logout() {
        return this.baileysService.logout();
    }

    private scheduleHandoverTimeout(leadId: string, remoteJid: string) {
        // Cancelar cualquier timeout existente para este lead
        this.cancelHandoverTimeout(leadId);

        // Programar reactivación en 30 minutos (1800000 ms)
        const timeout = setTimeout(async () => {
            try {
                // Verificar si el handover sigue activo
                const lead = await this.leadsService.findOrCreate(remoteJid.split('@')[0], 'Unknown');
                if (lead && lead.isHandoverActive) {
                    // Reactivar el bot
                    await this.leadsService.toggleHandover(leadId, false);

                    // Enviar mensaje de seguimiento
                    const followUpTemplate = await this.templatesService.findByKey('follow_up_no_response');
                    const message = followUpTemplate
                        ? followUpTemplate.content
                        : "Hola! ¿Sigues interesado en información sobre nuestras carreras? Un asesor estará disponible pronto.";

                    await this.sendResponse(remoteJid, { text: message, templateKey: 'follow_up' }, lead);

                    this.logsService.addLog('log', `Handover timeout reached for lead ${lead.phone}, bot reactivated`, 'WhatsappService');
                }
            } catch (error) {
                this.logger.error(`Error in handover timeout for lead ${leadId}:`, error);
            } finally {
                // Limpiar el timeout del mapa
                this.handoverTimeouts.delete(leadId);
            }
        }, 30 * 60 * 1000); // 30 minutos

        // Almacenar el timeout
        this.handoverTimeouts.set(leadId, timeout);

        this.logger.log(`Handover timeout scheduled for lead ${leadId} in 30 minutes`);
    }

    private cancelHandoverTimeout(leadId: string) {
        const timeout = this.handoverTimeouts.get(leadId);
        if (timeout) {
            clearTimeout(timeout);
            this.handoverTimeouts.delete(leadId);
            this.logger.log(`Handover timeout cancelled for lead ${leadId}`);
        }
    }

    // Método público para enviar mensajes desde asesores
    async sendAdvisorMessage(remoteJid: string, message: string, lead: any) {
        return this.sendResponse(remoteJid, {
            text: message,
            templateKey: 'advisor_message'
        }, lead);
    }
}
