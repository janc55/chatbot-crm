import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { BaileysService } from './baileys.service';
import { PersonsService } from '../persons/persons.service';
import { InteractionsService } from '../interactions/interactions.service';
import { TemplatesService } from '../templates/templates.service';
import { OpenaiService } from '../openai/openai.service';
import { LogsService } from '../logs/logs.service';
import { ChatGateway } from '../chat/chat.gateway';
import { SettingsService } from '../settings/settings.service';
import { Person, LeadStatus, Direction, MessageType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class WhatsappService {
    private readonly logger = new Logger(WhatsappService.name);

    private processedMessages = new Set<string>();
    private handoverTimeouts = new Map<string, NodeJS.Timeout>(); // personId -> timeout
    private messageBuffers = new Map<string, {
        messages: { text: string, messageId: string }[],
        timeout: NodeJS.Timeout,
        name: string,
        phoneNumber: string,
        tenantId: string,
        instanceId: string
    }>();

    constructor(
        @Inject(forwardRef(() => BaileysService))
        private baileysService: BaileysService,
        private personsService: PersonsService,
        private interactionsService: InteractionsService,
        private templatesService: TemplatesService,
        private openaiService: OpenaiService,
        private logsService: LogsService,
        @Inject(forwardRef(() => ChatGateway))
        private chatGateway: ChatGateway,
        private settingsService: SettingsService,
        private prisma: PrismaService,
    ) {
        this.logger.log('[DEBUG] WhatsappService constructor called');
    }

    // --- INSTANCE MANAGEMENT ---

    async createInstance(tenantId: string, name: string) {
        const sessionId = `${tenantId}_${Date.now()}`;
        return this.prisma.whatsappInstance.create({
            data: {
                tenantId,
                name,
                sessionId,
                status: 'DISCONNECTED'
            }
        });
    }

    async getInstances(tenantId: string) {
        return this.prisma.whatsappInstance.findMany({
            where: { tenantId }
        });
    }

    async getInstance(id: string) {
        return this.prisma.whatsappInstance.findUnique({
            where: { id }
        });
    }

    async deleteInstance(id: string) {
        const instance = await this.getInstance(id);
        if (instance) {
            await this.baileysService.logout(id);
            return this.prisma.whatsappInstance.delete({ where: { id } });
        }
    }

    // --- MESSAGE PROCESSING ---

    async sendFollowUp(person: any, template: any) {
        if (!person.tenantId) {
            this.logger.warn(`Cannot send follow up to person ${person.id} without tenantId`);
            return;
        }

        const instance = await this.prisma.whatsappInstance.findFirst({
            where: { tenantId: person.tenantId, status: 'CONNECTED' }
        });

        if (!instance) {
            this.logger.warn(`No connected instance found for tenant ${person.tenantId}`);
            return;
        }

        const remoteJid = person.phone.includes('@') ? person.phone : `${person.phone}@s.whatsapp.net`;
        await this.sendResponse(remoteJid, {
            text: template.content,
            templateKey: template.key,
            attachments: template.attachments ? JSON.parse(template.attachments) : null
        }, person, instance.id);
    }

    async processMessage(data: { remoteJid: string; phoneNumber?: string; text: string; name?: string; messageId: string, tenantId: string, instanceId: string }) {
        const { remoteJid, phoneNumber: phoneNumberFromData, text, name, messageId, tenantId, instanceId } = data;

        this.logger.log(`[DEBUG] processMessage called for ${remoteJid} on instance ${instanceId}`);

        if (this.processedMessages.has(messageId)) {
            return;
        }
        this.processedMessages.add(messageId);
        setTimeout(() => this.processedMessages.delete(messageId), 15000);

        const settings = await this.settingsService.getChatbotSettings();
        const bufferKey = `${instanceId}:${remoteJid}`;

        if (settings.messageGroupingEnabled) {
            let buffer = this.messageBuffers.get(bufferKey);

            if (buffer) {
                clearTimeout(buffer.timeout);
                buffer.messages.push({ text, messageId });
            } else {
                buffer = {
                    messages: [{ text, messageId }],
                    name: name || 'Usuario',
                    phoneNumber: phoneNumberFromData,
                    timeout: null,
                    tenantId,
                    instanceId
                };
            }

            buffer.timeout = setTimeout(() => {
                this.executeBatchProcess(bufferKey);
            }, settings.messageGroupingTimeout);

            this.messageBuffers.set(bufferKey, buffer);
            return;
        }

        await this.executeProcessing(remoteJid, phoneNumberFromData, [{ text, messageId }], name, tenantId, instanceId);
    }

    private async executeBatchProcess(bufferKey: string) {
        const buffer = this.messageBuffers.get(bufferKey);
        if (!buffer) return;

        this.messageBuffers.delete(bufferKey);
        const firstColonIndex = bufferKey.indexOf(':');
        const remoteJid = bufferKey.substring(firstColonIndex + 1);

        await this.executeProcessing(remoteJid, buffer.phoneNumber, buffer.messages, buffer.name, buffer.tenantId, buffer.instanceId);
    }

    private async executeProcessing(remoteJid: string, phoneNumberFromData: string, messages: { text: string, messageId: string }[], name: string, tenantId: string, instanceId: string) {
        const combinedText = messages.map(m => m.text).join(' ').replace(/\s+/g, ' ').trim();
        if (!combinedText) return;

        let phoneToSave = phoneNumberFromData;
        if (!phoneToSave) {
            if (remoteJid.includes('@s.whatsapp.net')) {
                phoneToSave = remoteJid.split('@')[0].replace(/\D/g, '');
            } else {
                phoneToSave = remoteJid.split('@')[0].replace(/\D/g, '');
            }
        }

        if (!phoneToSave || phoneToSave.length < 5) return;

        const person = await this.personsService.findOrCreate(phoneToSave, tenantId, name);

        await this.interactionsService.logInteraction({
            personId: person.id,
            direction: Direction.INBOUND,
            messageType: MessageType.TEXT,
            content: combinedText,
        });

        this.chatGateway.emitMessageToRoom(person.id, {
            direction: 'INBOUND',
            content: combinedText,
            createdAt: new Date(),
            messageType: 'TEXT',
            instanceId
        });

        if (person.isHandoverActive) {
            this.logsService.addLog('log', `Message received from ${person.phone} while Handover is ACTIVE. Bot is silent.`, 'WhatsappService');
            return;
        }

        const responses = await this.handleIntents(combinedText, person);

        if (responses && responses.length > 0) {
            for (const response of responses) {
                await this.sendResponse(remoteJid, response, person, instanceId);
                if (responses.length > 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        } else {
            this.logsService.addLog('warn', `No response generated for message from ${remoteJid}`, 'WhatsappService');
        }
    }

    private async handleIntents(text: string, person: any): Promise<{ text: string; templateKey?: string; attachments?: any, statusUpdate?: LeadStatus }[]> {
        const lowerText = text.toLowerCase();
        const responses: { text: string; templateKey?: string; attachments?: any, statusUpdate?: LeadStatus }[] = [];

        // --- RULE BASED MATCHING ---
        if (lowerText.match(/hola|buen|info|inicio/)) {
            const t = await this.templatesService.findByKey('bienvenida');
            if (t) responses.push({ text: t.content, templateKey: t.key, attachments: t.attachments ? JSON.parse(t.attachments) : null });
        }

        if (lowerText.includes('medicina')) {
            await this.personsService.updateInterest(person.id, 'MEDICINA');
            const t = await this.templatesService.findByKey('brochure_medicina');
            if (t) responses.push({ text: t.content, templateKey: t.key, attachments: t.attachments ? JSON.parse(t.attachments) : null, statusUpdate: LeadStatus.INTERESADO_BROCHURE });
        }

        if (lowerText.includes('derecho') || lowerText.includes('abogado') || lowerText.includes('leyes')) {
            await this.personsService.updateInterest(person.id, 'DERECHO');
            const t = await this.templatesService.findByKey('brochure_derecho');
            if (t) responses.push({ text: t.content, templateKey: t.key, attachments: t.attachments ? JSON.parse(t.attachments) : null, statusUpdate: LeadStatus.INTERESADO_BROCHURE });
        }

        // --- OPENAI FALLBACK ---
        let searchContext = text;
        if (person.careerInterest) searchContext += ` ${person.careerInterest}`;

        const topTemplates = await this.templatesService.findMostRelevant(searchContext, 5);
        let context = topTemplates.length > 0
            ? topTemplates.map(t => `- KEY: ${t.key} (Cat: ${t.category}): ${(t.content || '').substring(0, 150)}...`).join('\n')
            : await this.templatesService.getContextSummary();

        const lastMessages = await this.personsService.getLastMessages(person.id, 6);
        const historyText = lastMessages.reverse().map(m => `${m.direction === 'INBOUND' ? 'Usuario' : 'Bot'}: ${m.content}`).join('\n');

        const classification = await this.openaiService.classifyMessage(text, context, historyText);

        if (classification.needs_human) {
            await this.personsService.toggleHandover(person.id, true);
            await this.personsService.updateStatus(person.id, LeadStatus.NECESITA_ASESOR);
            this.logsService.addHandoverAlert(person.id, person.phone, person.fullName, `Asistencia humana: "${text.substring(0, 100)}"`);

            const remoteJidForTimeout = person.phone.includes('@') ? person.phone : `${person.phone}@s.whatsapp.net`;
            this.scheduleHandoverTimeout(person.id, remoteJidForTimeout);

            const t = await this.templatesService.findByKey('necesita_asesor');
            responses.push(t ? { text: t.content, templateKey: t.key } : { text: "Un asesor te contactará.", templateKey: 'fallback' });
            return responses;
        }

        const uniqueTemplateKeys = [...new Set(classification.template_keys)];

        for (const key of uniqueTemplateKeys) {
            if (responses.some(r => r.templateKey === key)) continue;

            const t = await this.templatesService.findByKey(key);
            if (t) {
                let finalText = t.content;
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

    private async sendResponse(remoteJid: string, response: any, person: any, instanceId: string) {
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
                    await this.baileysService.sendMessage(instanceId, remoteJid, { document: buffer, mimetype: 'application/pdf', fileName: 'Brochure.pdf', caption: response.text });
                } else {
                    await this.baileysService.sendMessage(instanceId, remoteJid, { image: buffer, caption: response.text });
                }
            } else {
                await this.baileysService.sendMessage(instanceId, remoteJid, { text: response.text + "\n(Adjunto no disponible)" });
            }

            await this.interactionsService.logInteraction({
                personId: person.id,
                direction: Direction.OUTBOUND,
                messageType: MessageType.MEDIA,
                content: response.text,
                templateKey: response.templateKey,
                usedAi: !!(response.templateKey)
            });
        } else {
            await this.baileysService.sendMessage(instanceId, remoteJid, { text: response.text });
            await this.interactionsService.logInteraction({
                personId: person.id,
                direction: Direction.OUTBOUND,
                messageType: MessageType.TEXT,
                content: response.text,
                templateKey: response.templateKey,
                usedAi: !!(response.templateKey)
            });
        }

        if (response.statusUpdate) {
            await this.personsService.updateStatus(person.id, response.statusUpdate);
        }
    }

    private scheduleHandoverTimeout(personId: string, remoteJid: string) {
        this.cancelHandoverTimeout(personId);

        const timeout = setTimeout(async () => {
            try {
                const person = await this.personsService.findById(personId);
                if (person && person.isHandoverActive) {
                    await this.personsService.toggleHandover(personId, false);

                    const followUpTemplate = await this.templatesService.findByKey('follow_up_no_response');
                    const message = followUpTemplate
                        ? followUpTemplate.content
                        : "Hola! ¿Sigues interesado en información? Un asesor estará disponible pronto.";

                    if (person.tenantId) {
                        const instance = await this.prisma.whatsappInstance.findFirst({
                            where: { tenantId: person.tenantId, status: 'CONNECTED' }
                        });
                        if (instance) {
                            await this.sendResponse(remoteJid, { text: message, templateKey: 'follow_up' }, person, instance.id);
                        }
                    }

                    this.logsService.addLog('log', `Handover timeout reached for person ${person.phone}, bot reactivated`, 'WhatsappService');
                }
            } catch (error) {
                this.logger.error(`Error in handover timeout for person ${personId}:`, error);
            } finally {
                this.handoverTimeouts.delete(personId);
            }
        }, 30 * 60 * 1000);

        this.handoverTimeouts.set(personId, timeout);
    }

    private cancelHandoverTimeout(personId: string) {
        const timeout = this.handoverTimeouts.get(personId);
        if (timeout) {
            clearTimeout(timeout);
            this.handoverTimeouts.delete(personId);
        }
    }

    async sendAdvisorMessage(remoteJid: string, message: string, person: any, instanceId?: string) {
        let targetInstanceId = instanceId;
        if (!targetInstanceId) {
            const instance = await this.prisma.whatsappInstance.findFirst({
                where: { tenantId: person.tenantId, status: 'CONNECTED' }
            });
            targetInstanceId = instance?.id;
        }

        if (!targetInstanceId) throw new Error('No connected instance found');

        return this.sendResponse(remoteJid, {
            text: message,
            templateKey: 'advisor_message'
        }, person, targetInstanceId);
    }
}
