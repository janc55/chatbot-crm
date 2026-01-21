import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { PersonsService } from '../persons/persons.service';
import { OpenaiService } from '../openai/openai.service';
import { ChatGateway } from './chat.gateway';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
    constructor(
        private chatService: ChatService,
        private whatsappService: WhatsappService,
        private personsService: PersonsService,
        private openaiService: OpenaiService,
        private chatGateway: ChatGateway,
    ) { }

    @Get('history/:personId')
    @ApiOperation({ summary: 'Get conversation history for a person' })
    async getHistory(@Param('personId') personId: string) {
        return this.chatService.getConversationHistory(personId);
    }

    @Post('send')
    @ApiOperation({ summary: 'Send message to a person via WhatsApp' })
    async sendMessage(@Body() body: { personId: string; message: string }) {
        const { personId, message } = body;

        console.log('Backend: Sending message to person:', personId, 'message:', message);

        // Get person info
        const person = await this.personsService.findById(personId);
        if (!person) {
            console.log('Backend: Person not found');
            throw new Error('Person not found');
        }

        console.log('Backend: Person found:', person.phone);

        // Build remoteJid
        const remoteJid = person.phone.includes('@') ? person.phone : `${person.phone}@s.whatsapp.net`;

        console.log('Backend: RemoteJid:', remoteJid);

        // Send via WhatsApp
        await this.whatsappService.sendAdvisorMessage(remoteJid, message, person);

        console.log('Backend: Message sent via WhatsApp');

        // Cancel handover timeout if active
        if (person.isHandoverActive) {
            await this.personsService.toggleHandover(personId, false);
            console.log('Backend: Handover cancelled');
        }

        // Emit to WebSocket clients
        this.chatGateway.emitMessageToRoom(personId, {
            direction: 'OUTBOUND',
            content: message,
            createdAt: new Date(),
            messageType: 'TEXT',
        });

        console.log('Backend: Message emitted to WebSocket');

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

    @Put('quick-replies/:id')
    @ApiOperation({ summary: 'Update a quick reply' })
    async updateQuickReply(
        @Param('id') id: string,
        @Body() body: { title: string; content: string; category?: string }
    ) {
        return this.chatService.updateQuickReply(id, body);
    }

    @Delete('quick-replies/:id')
    @ApiOperation({ summary: 'Delete a quick reply' })
    async deleteQuickReply(@Param('id') id: string) {
        return this.chatService.deleteQuickReply(id);
    }

    @Get('suggest/:personId')
    @ApiOperation({ summary: 'Get AI-powered response suggestions for a person' })
    async getSuggestions(@Param('personId') personId: string) {
        // Get conversation history
        const history = await this.chatService.getConversationHistory(personId);
        const person = await this.personsService.findById(personId);

        if (!history || history.length === 0) {
            return {
                suggestions: [
                    '¡Hola! ¿En qué puedo ayudarte hoy?',
                    '¿Te gustaría conocer más sobre nuestras carreras?',
                    '¿Tienes alguna pregunta específica?',
                ],
            };
        }

        // Get last 3 messages for context (both user and bot)
        const recentMessages = history.slice(-6); // Last 6 messages (3 exchanges)
        const conversationContext = recentMessages
            .map(m => `${m.direction === 'INBOUND' ? 'Usuario' : 'Bot'}: ${m.content}`)
            .join('\n');

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

        // Use OpenAI to generate suggestions with conversation context
        const careerContext = person.careerInterest ? `El estudiante está interesado en ${person.careerInterest}.` : 'No hay carrera específica de interés.';

        try {
            const response = await this.openaiService.generateSuggestions(
                conversationContext,
                lastUserMessage.content,
                careerContext
            );
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
