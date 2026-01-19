import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Lead, LeadStatus } from '@prisma/client';

@Injectable()
export class LeadsService {
    constructor(private prisma: PrismaService) { }

    async findOrCreate(phone: string, tenantId: string, name?: string): Promise<Lead> {
        console.log(`[LeadsService] finding or creating lead for phone: ${phone}, tenant: ${tenantId}`);
        const lead = await this.prisma.lead.findUnique({
            where: {
                phone_tenantId: {
                    phone,
                    tenantId
                }
            }
        });
        if (lead) return lead;

        return this.prisma.lead.create({
            data: {
                phone,
                tenantId,
                fullName: name,
                status: LeadStatus.NUEVO,
            },
        });
    }

    async updateInterest(id: string, career: string) {
        return this.prisma.lead.update({
            where: { id },
            data: { careerInterest: career, status: LeadStatus.INTERESADO_BROCHURE },
        });
    }

    async updateStatus(id: string, status: LeadStatus) {
        return this.prisma.lead.update({
            where: { id },
            data: { status },
        });
    }

    async findAll() {
        return this.prisma.lead.findMany();
    }

    async findStaleLeads(hours: number) {
        const cutoff = new Date();
        cutoff.setHours(cutoff.getHours() - hours);

        return this.prisma.lead.findMany({
            where: {
                status: {
                    in: [LeadStatus.INTERESADO_BROCHURE, LeadStatus.INTERESADO_COSTOS],
                },
                updatedAt: {
                    lt: cutoff,
                },
            },
        });
    }

    async getStats() {
        const total = await this.prisma.lead.count();
        const byStatus = await this.prisma.lead.groupBy({
            by: ['status'],
            _count: { status: true },
        });
        const byCareer = await this.prisma.lead.groupBy({
            by: ['careerInterest'],
            _count: { careerInterest: true },
        });
        return { total, byStatus, byCareer };
    }

    async findOne(id: string) {
        return this.prisma.lead.findUnique({
            where: { id },
            include: {
                interactions: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
    }

    async toggleHandover(id: string, status: boolean) {
        return this.prisma.lead.update({
            where: { id },
            data: { isHandoverActive: status },
        });
    }

    async getLastMessages(leadId: string, limit: number = 10) {
        return this.prisma.interaction.findMany({
            where: { leadId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    async findById(id: string) {
        return this.prisma.lead.findUnique({
            where: { id },
        });
    }
}
