import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { LeadsService } from '../leads/leads.service';
import { OpenaiService } from '../openai/openai.service';
import { ChatGateway } from './chat.gateway';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
    constructor(
        private chatService: ChatService,
        private whatsappService: WhatsappService,
        private leadsService: LeadsService,
        private openaiService: OpenaiService,
        private chatGateway: ChatGateway,
    ) { }

    @Get('history/:leadId')
    @ApiOperation({ summary: 'Get conversation history for a lead' })
    async getHistory(@Param('leadId') leadId: string) {
        return this.chatService.getConversationHistory(leadId);
    }

    @Post('send')
    @ApiOperation({ summary: 'Send message to a lead via WhatsApp' })
    async sendMessage(@Body() body: { leadId: string; message: string }) {
        const { leadId, message } = body;

        // Get lead info
        const lead = await this.leadsService.findById(leadId);
        if (!lead) {
            throw new Error('Lead not found');
        }

        // Build remoteJid
        const remoteJid = lead.phone.includes('@') ? lead.phone : `${lead.phone}@s.whatsapp.net`;

        // Send via WhatsApp
        await this.whatsappService.sendAdvisorMessage(remoteJid, message, lead);

        // Cancel handover timeout if active
        if (lead.isHandoverActive) {
            await this.leadsService.toggleHandover(leadId, false);
        }

        // Emit to WebSocket clients
        this.chatGateway.emitMessageToRoom(leadId, {
            direction: 'OUTBOUND',
            content: message,
            createdAt: new Date(),
            messageType: 'TEXT',
        });

        return { success: true };
    }

    @Get('quick-replies')
    @ApiOperation({ summary: 'Get all quick replies' })
    async getQuickReplies() {
        return this.chatService.getAllQuickReplies();
    }

    @Post('quick-replies')
    @ApiOperation({ summary: 'Create a new quick reply' })
    async createQuickReply(@Body() body: { title: string; content: string; category?: string }) {
        return this.chatService.createQuickReply(body);
    }

    @Delete('quick-replies/:id')
    @ApiOperation({ summary: 'Delete a quick reply' })
    async deleteQuickReply(@Param('id') id: string) {
        return this.chatService.deleteQuickReply(id);
    }

    @Get('suggest/:leadId')
    @ApiOperation({ summary: 'Get AI-powered response suggestions for a lead' })
    async getSuggestions(@Param('leadId') leadId: string) {
        // Get conversation history
        const history = await this.chatService.getConversationHistory(leadId);
        const lead = await this.leadsService.findById(leadId);

        if (!history || history.length === 0) {
            return {
                suggestions: [
                    '¡Hola! ¿En qué puedo ayudarte hoy?',
                    '¿Te gustaría conocer más sobre nuestras carreras?',
                    '¿Tienes alguna pregunta específica?',
                ],
            };
        }

        // Get last user message
        const lastUserMessage = history
            .filter((m) => m.direction === 'INBOUND')
            .pop();

        if (!lastUserMessage) {
            return {
                suggestions: [
                    '¿Hay algo más en lo que pueda ayudarte?',
                    '¿Tienes alguna otra pregunta?',
                ],
            };
        }

        // Use OpenAI to generate suggestions
        const prompt = `Eres un asesor universitario. El estudiante preguntó: "${lastUserMessage.content}". 
Genera 3 respuestas cortas y útiles (máximo 100 caracteres cada una) que un asesor podría usar.
Contexto: ${lead.careerInterest ? `Interesado en ${lead.careerInterest}` : 'Sin carrera específica'}.
Responde SOLO con un array JSON de strings, sin explicaciones adicionales.`;

        try {
            const response = await this.openaiService.generateSuggestions(prompt);
            return { suggestions: response };
        } catch (error) {
            // Fallback suggestions
            return {
                suggestions: [
                    'Claro, déjame ayudarte con eso.',
                    '¿Necesitas información adicional?',
                    'Estoy aquí para resolver tus dudas.',
                ],
            };
        }
    }
}
