import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { BaileysService } from './baileys.service';
import { LeadsService } from '../leads/leads.service';
import { InteractionsService } from '../interactions/interactions.service';
import { TemplatesService } from '../templates/templates.service';
import { OpenaiService } from '../openai/openai.service';
import { LeadStatus, Direction, MessageType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class WhatsappService {
    private readonly logger = new Logger(WhatsappService.name);

    constructor(
        @Inject(forwardRef(() => BaileysService))
        private baileysService: BaileysService,
        private leadsService: LeadsService,
        private interactionsService: InteractionsService,
        private templatesService: TemplatesService,
        private openaiService: OpenaiService,
    ) { }

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
        this.logger.log(`Processing message from ${remoteJid} (phone: ${phoneNumberFromData}): ${text}`);

        // 1. Find or Create Lead
        // Validar que tenemos un número de teléfono válido
        let phoneToSave = phoneNumberFromData;

        if (!phoneToSave) {
            this.logger.error(`CRITICAL: No phone number provided for remoteJid: ${remoteJid}`);
            // Intentar extraer del remoteJid como último recurso
            phoneToSave = this.extractPhoneFromJid(remoteJid);
            if (!phoneToSave || phoneToSave.length < 8) {
                this.logger.error(`CRITICAL: Cannot extract valid phone number from ${remoteJid}`);
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
        if (lead.isHandoverActive) {
            this.logger.log(`Skipping bot response for ${remoteJid} (Handover Active)`);
            return;
        }

        // 3. Determine Response
        const response = await this.handleIntent(text, lead);

        // 4. Send Response
        if (response) {
            await this.sendResponse(remoteJid, response, lead);
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
        // Retrieve only the most relevant templates (Top 5) based on embedding similarity
        const topTemplates = await this.templatesService.findMostRelevant(text, 5);

        let context = '';
        if (topTemplates.length > 0) {
            context = topTemplates.map(t => `- KEY: ${t.key} (Cat: ${t.category}): ${(t.content || '').substring(0, 100)}...`).join('\n');
        } else {
            // Fallback to general summary if no matches found (or no embeddings yet)
            context = await this.templatesService.getContextSummary();
        }

        const classification = await this.openaiService.classifyMessage(text, context);

        if (classification.needs_human) {
            await this.leadsService.updateStatus(lead.phone, LeadStatus.NECESITA_ASESOR);
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

        return null;
    }

    private async sendResponse(remoteJid: string, response: any, lead: any) {
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
}
