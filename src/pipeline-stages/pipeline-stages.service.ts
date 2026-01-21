import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PipelineStagesService {
    constructor(private prisma: PrismaService) { }

    async findAll(tenantId: string) {
        return this.prisma.pipelineStage.findMany({
            where: { tenantId },
            orderBy: { order: 'asc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.pipelineStage.findUnique({
            where: { id },
        });
    }

    async create(tenantId: string, data: { name: string, displayName: string, color?: string, order: number, isFinal?: boolean }) {
        return this.prisma.pipelineStage.create({
            data: {
                ...data,
                tenantId,
            },
        });
    }

    async update(id: string, data: { name?: string, displayName?: string, color?: string, order?: number, isFinal?: boolean }) {
        return this.prisma.pipelineStage.update({
            where: { id },
            data,
        });
    }

    async remove(id: string) {
        return this.prisma.pipelineStage.delete({
            where: { id },
        });
    }

    async seedDefaultStages(tenantId: string) {
        const defaults = [
            { name: 'new', displayName: 'Nuevo', order: 1, color: '#3B82F6' },
            { name: 'contacted', displayName: 'Contactado', order: 2, color: '#F59E0B' },
            { name: 'qualified', displayName: 'Calificado', order: 3, color: '#10B981' },
            { name: 'proposal', displayName: 'Propuesta Enviada', order: 4, color: '#8B5CF6' },
            { name: 'negotiation', displayName: 'Negociación', order: 5, color: '#EC4899' },
            { name: 'won', displayName: 'Ganado', order: 6, color: '#059669', isFinal: true },
            { name: 'lost', displayName: 'Perdido', order: 7, color: '#DC2626', isFinal: true },
        ];

        for (const stage of defaults) {
            await this.prisma.pipelineStage.upsert({
                where: {
                    name_tenantId: {
                        name: stage.name,
                        tenantId,
                    },
                },
                update: {},
                create: {
                    ...stage,
                    tenantId,
                },
            });
        }
    }
}
