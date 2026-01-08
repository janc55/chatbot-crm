import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { BaileysService } from './baileys.service';
import { LeadsService } from '../leads/leads.service';
import { InteractionsService } from '../interactions/interactions.service';
import { TemplatesService } from '../templates/templates.service';
import { OpenaiService } from '../openai/openai.service';
import { LogsService } from '../logs/logs.service';
import { LeadStatus, Direction, MessageType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class WhatsappService {
    private readonly logger = new Logger(WhatsappService.name);

    private processedMessages = new Set<string>();
    private handoverTimeouts = new Map<string, NodeJS.Timeout>(); // leadId -> timeout

    constructor(
        @Inject(forwardRef(() => BaileysService))
        private baileysService: BaileysService,
        private leadsService: LeadsService,
        private interactionsService: InteractionsService,
        private templatesService: TemplatesService,
        private openaiService: OpenaiService,
        private logsService: LogsService,
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

        this.logger.log(`Processing message from ${remoteJid} (phone: ${phoneNumberFromData}): ${text}`);

        // 1. Find or Create Lead
        // Validar que tenemos un número de teléfono válido
        let phoneToSave = phoneNumberFromData;

        if (!phoneToSave) {
            this.logger.error(`CRITICAL: No phone number provided for remoteJid: ${remoteJid}`);
            this.logsService.addLog('error', `No phone number provided for message from ${remoteJid}`, 'WhatsappService');
            // Intentar extraer del remoteJid como último recurso
            phoneToSave = this.extractPhoneFromJid(remoteJid);
            if (!phoneToSave || phoneToSave.length < 8) {
                this.logger.error(`CRITICAL: Cannot extract valid phone number from ${remoteJid}`);
                this.logsService.addLog('error', `Cannot extract valid phone number from ${remoteJid}`, 'WhatsappService');
                return; // No procesar si no tenemos un número válido
            }
        }

        // Validar que el número es válido (solo dígitos, mínimo 8 caracteres)
        if (!/^\d{8,}$/.test(phoneToSave)) {
            this.logger.error(`CRITICAL: Invalid phone number format: ${phoneToSave} from remoteJid: ${remoteJid}`);
            return; // No procesar si el número no es válido
        }

        this.logger.log(`Using validated phone number for lead: ${phoneToSave}`);
        const lead = await this.leadsService.findOrCreate(phoneToSave, name);

        // 2. Log Inbound Interaction
        await this.interactionsService.logInteraction({
            leadId: lead.id,
            direction: Direction.INBOUND,
            messageType: MessageType.TEXT,
            content: text,
        });

        // CHECK HANDOVER
        // CHECK HANDOVER
        if (lead.isHandoverActive) {
            this.logsService.addLog('log', `Message received from ${lead.phone} while Handover is ACTIVE. Bot is silent.`, 'WhatsappService');
            this.logger.log(`[HANDOVER ACTIVE] Message from ${remoteJid} ignored by bot. Waiting for advisor.`);
            // STOP PROCESSING - Do NOT auto-cancel handover on user message
            // Handover can only be cancelled by:
            // 1. Advisor sending a message (sendAdvisorMessage)
            // 2. Advisor clicking "Stop Handover" (API)
            // 3. Timeout (30 mins)
            return;
        }

        // 3. Determine Response
        const response = await this.handleIntent(text, lead);

        // 4. Send Response
        if (response) {
            await this.sendResponse(remoteJid, response, lead);
            this.logsService.addLog('log', `Bot response sent to ${remoteJid}: ${response.text?.substring(0, 100)}...`, 'WhatsappService');
        } else {
            this.logsService.addLog('warn', `No response generated for message from ${remoteJid}`, 'WhatsappService');
        }
    }

    private async handleIntent(text: string, lead: any): Promise<{ text: string; templateKey?: string; attachments?: any, statusUpdate?: LeadStatus } | null> {
        const lowerText = text.toLowerCase();

        // --- RULE BASED MATCHING ---

        // Greeting / Start
        if (lowerText.match(/hola|buen|info|inicio/)) {
            const t = await this.templatesService.findByKey('bienvenida');
            return t ? { text: t.content, templateKey: t.key, attachments: t.attachments ? JSON.parse(t.attachments) : null } : null;
        }

        // Careers
        if (lowerText.includes('medicina')) {
            await this.leadsService.updateInterest(lead.phone, 'MEDICINA');
            const t = await this.templatesService.findByKey('brochure_medicina');
            return t ? { text: t.content, templateKey: t.key, attachments: t.attachments ? JSON.parse(t.attachments) : null, statusUpdate: LeadStatus.INTERESADO_BROCHURE } : null;
        }

        if (lowerText.includes('derecho') || lowerText.includes('abogado') || lowerText.includes('leyes')) {
            await this.leadsService.updateInterest(lead.phone, 'DERECHO');
            const t = await this.templatesService.findByKey('brochure_derecho');
            return t ? { text: t.content, templateKey: t.key, attachments: t.attachments ? JSON.parse(t.attachments) : null, statusUpdate: LeadStatus.INTERESADO_BROCHURE } : null;
        }

        // Costos (Regex simple)
        if (lowerText.match(/costo|precio|cuanto cuesta|valor/)) {
            let key = 'costos_generales';
            if (lead.careerInterest === 'MEDICINA' || lowerText.includes('medicina')) key = 'costos_medicina';
            if (lead.careerInterest === 'DERECHO' || lowerText.includes('derecho')) key = 'costos_derecho';

            let t = await this.templatesService.findByKey(key);
            if (!t && key !== 'costos_generales') t = await this.templatesService.findByKey('costos_medicina'); // Fallback demo
            return t ? { text: t.content, templateKey: t.key, statusUpdate: LeadStatus.INTERESADO_COSTOS } : null;
        }

        // --- OPENAI FALLBACK (RAG) ---

        // 1. Contextualize Query using Career Interest
        let searchContext = text;
        if (lead.careerInterest) {
            searchContext += ` ${lead.careerInterest}`;
        }

        // Retrieve only the most relevant templates (Top 5) based on embedding similarity using contextualized query
        const topTemplates = await this.templatesService.findMostRelevant(searchContext, 5);

        let context = '';
        if (topTemplates.length > 0) {
            context = topTemplates.map(t => `- KEY: ${t.key} (Cat: ${t.category}): ${(t.content || '').substring(0, 150)}...`).join('\n'); // Increased substring length
        } else {
            // Fallback to general summary if no matches found
            context = await this.templatesService.getContextSummary();
        }

        // 2. Fetch Conversation History
        const lastMessages = await this.leadsService.getLastMessages(lead.id, 6);
        // Format history: Oldest first
        const historyText = lastMessages.reverse().map(m =>
            `${m.direction === 'INBOUND' ? 'Usuario' : 'Bot'}: ${m.content}`
        ).join('\n');

        const classification = await this.openaiService.classifyMessage(text, context, historyText);

        if (classification.needs_human || !classification.template_key) {
            // Activar handover automático
            await this.leadsService.toggleHandover(lead.id, true);
            await this.leadsService.updateStatus(lead.phone, LeadStatus.NECESITA_ASESOR);

            // Generar alerta para el asesor
            this.logsService.addHandoverAlert(
                lead.id,
                lead.phone,
                lead.fullName,
                `Lead necesita asistencia humana. Mensaje: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`
            );

            // Notificar sobre el handover
            this.logsService.addLog('log', `Handover activated for lead ${lead.phone} (${lead.fullName || 'Unknown'}) - Reason: ${classification.needs_human ? 'AI Flag' : 'No Template Matched'}`, 'WhatsappService');

            // Programar reactivación automática en 30 minutos si no hay respuesta del asesor
            const remoteJidForTimeout = lead.phone.includes('@') ? lead.phone : `${lead.phone}@s.whatsapp.net`;
            this.scheduleHandoverTimeout(lead.id, remoteJidForTimeout);

            const t = await this.templatesService.findByKey('necesita_asesor');
            return t ? { text: t.content, templateKey: t.key } : { text: "Un asesor te contactará.", templateKey: 'fallback' };
        }

        if (classification.template_key) {
            const t = await this.templatesService.findByKey(classification.template_key);
            if (t) {
                let finalText = t.content;
                if (classification.extra_text) finalText += `\n\n${classification.extra_text}`;
                return {
                    text: finalText,
                    templateKey: t.key,
                    attachments: t.attachments ? JSON.parse(t.attachments) : null
                };
            }
        }

        // Should not happen due to the first if, but just in case
        return null;
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
