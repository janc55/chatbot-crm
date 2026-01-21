import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Direction, MessageType } from '@prisma/client';

@Injectable()
export class InteractionsService {
    constructor(private prisma: PrismaService) { }

    async logInteraction(data: {
        personId: string;
        direction: Direction;
        messageType: MessageType;
        content: string;
        templateKey?: string;
        usedAi?: boolean;
    }) {
        return this.prisma.interaction.create({ data: data as any });
    }

    async getDailyStats(tenantId: string) {
        // Agrupar por día (YYYY-MM-DD) y contar inputs vs outputs
        // PostgreSQL specific, filter by tenantId from the person relation
        const result = await this.prisma.$queryRaw`
            SELECT 
                DATE(i.created_at) as date, 
                i.direction,
                COUNT(*) as count 
            FROM interactions i
            JOIN persons p ON i.person_id = p.id
            WHERE p.tenant_id = ${tenantId}
            GROUP BY DATE(i.created_at), i.direction 
            ORDER BY DATE(i.created_at) ASC
            LIMIT 30;
        `;

        // Transformar para el frontend: { date: '2023-01-01', inbound: 10, outbound: 5 }
        const stats: Record<string, { date: string, inbound: number, outbound: number }> = {};

        (result as any[]).forEach(row => {
            const dateStr = row.date.toISOString().split('T')[0];
            if (!stats[dateStr]) {
                stats[dateStr] = { date: dateStr, inbound: 0, outbound: 0 };
            }
            if (row.direction === Direction.INBOUND) {
                stats[dateStr].inbound = Number(row.count);
            } else {
                stats[dateStr].outbound = Number(row.count);
            }
        });

        return Object.values(stats);
    }
}
