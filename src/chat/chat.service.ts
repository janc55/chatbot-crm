import { toCommandSlug } from 'src/utils/string.utils';
import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    async getConversationHistory(personId: string) {
        return this.prisma.interaction.findMany({
            where: { personId },
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
        const normalizedTitle = toCommandSlug(data.title);

        // Verificamos si ya existe uno con ese mismo slug (para evitar duplicados)
        const existing = await this.prisma.quickReply.findFirst({
            where: { title: normalizedTitle },
        });

        if (existing) {
            throw new Error(
                `Ya existe una respuesta rápida con el comando "/${normalizedTitle}". Elige otro título.`
            );
            // O usa BadRequestException si tienes excepciones de NestJS
            // throw new BadRequestException(`El comando /${normalizedTitle} ya está en uso`);
        }

        return this.prisma.quickReply.create({
            data: {
                title: normalizedTitle,           // ← ¡Aquí se guarda el valor convertido!
                content: data.content,
                category: data.category || 'general',
            },
        });
    }

    async updateQuickReply(
        id: string,
        data: { title: string; content: string; category?: string }
    ) {
        // Si no hay título nuevo → no normalizamos ni verificamos
        if (!data.title) {
            return this.prisma.quickReply.update({
                where: { id },
                data: {
                    content: data.content,
                    category: data.category,
                },
            });
        }

        const normalizedTitle = toCommandSlug(data.title);

        // Verificamos unicidad, pero excluimos el registro actual
        const existing = await this.prisma.quickReply.findFirst({
            where: {
                title: normalizedTitle,
                id: { not: id }, // ← Importante: no nos bloqueamos a nosotros mismos
            },
        });

        if (existing) {
            throw new Error(
                `Ya existe otra respuesta rápida con el comando "/${normalizedTitle}".`
            );
        }

        return this.prisma.quickReply.update({
            where: { id },
            data: {
                title: normalizedTitle,           // ← Actualizamos solo si hay título nuevo
                content: data.content,
                category: data.category,
            },
        });
    }

    async deleteQuickReply(id: string) {
        return this.prisma.quickReply.delete({
            where: { id },
        });
    }
}
