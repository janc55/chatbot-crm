import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    async getConversationHistory(leadId: string) {
        return this.prisma.interaction.findMany({
            where: { leadId },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                direction: true,
                messageType: true,
                content: true,
                createdAt: true,
                templateKey: true,
            },
        });
    }

    async getAllQuickReplies() {
        return this.prisma.quickReply.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async createQuickReply(data: { title: string; content: string; category?: string }) {
        return this.prisma.quickReply.create({
            data: {
                title: data.title,
                content: data.content,
                category: data.category || 'general',
            },
        });
    }

    async deleteQuickReply(id: string) {
        return this.prisma.quickReply.delete({
            where: { id },
        });
    }
}
