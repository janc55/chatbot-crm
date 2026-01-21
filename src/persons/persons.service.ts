import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Person, LeadStatus, PersonType, LeadQuality, LeadSource } from '@prisma/client';

@Injectable()
export class PersonsService {
    constructor(private prisma: PrismaService) { }

    async findOrCreate(phone: string, tenantId: string, name?: string): Promise<Person> {
        console.log(`[PersonsService] finding or creating person for phone: ${phone}, tenant: ${tenantId}`);
        const person = await this.prisma.person.findUnique({
            where: {
                phone_tenantId: {
                    phone,
                    tenantId
                }
            }
        });
        if (person) return person;

        // Get the default pipeline stage for this tenant (first stage)
        const firstStage = await this.prisma.pipelineStage.findFirst({
            where: { tenantId },
            orderBy: { order: 'asc' }
        });

        return this.prisma.person.create({
            data: {
                phone,
                tenantId,
                fullName: name,
                status: LeadStatus.NUEVO,
                type: PersonType.LEAD,
                source: LeadSource.WHATSAPP,
                pipelineStageId: firstStage?.id,
            },
        });
    }

    async updateInterest(id: string, career: string) {
        return this.prisma.person.update({
            where: { id },
            data: { careerInterest: career, status: LeadStatus.INTERESADO_BROCHURE },
        });
    }

    async updateStatus(id: string, status: LeadStatus) {
        return this.prisma.person.update({
            where: { id },
            data: { status },
        });
    }

    async findAll(tenantId: string) {
        return this.prisma.person.findMany({
            where: { tenantId },
            include: {
                pipelineStage: true,
                tags: {
                    include: {
                        tag: true
                    }
                }
            }
        });
    }

    async findStaleLeads(tenantId: string, hours: number) {
        const cutoff = new Date();
        cutoff.setHours(cutoff.getHours() - hours);

        // Find persons where the most recent interaction is older than the cutoff time
        // and exclude persons with active handover (human agent is handling them)
        const personsWithLastInteraction = await this.prisma.person.findMany({
            where: {
                tenantId,
                status: {
                    in: [LeadStatus.INTERESADO_BROCHURE, LeadStatus.INTERESADO_COSTOS],
                },
                isHandoverActive: false,
                type: PersonType.LEAD, // Automated follow-ups usually only for leads
            },
            include: {
                interactions: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 1,
                },
            },
        });

        const stalePersons = personsWithLastInteraction.filter(person => {
            if (person.interactions.length === 0) {
                return person.createdAt < cutoff;
            }

            const lastInteraction = person.interactions[0];
            return lastInteraction.createdAt < cutoff;
        });

        return stalePersons.map(({ interactions, ...person }) => person);
    }

    async getStats(tenantId: string) {
        const total = await this.prisma.person.count({ where: { tenantId } });
        const byStatus = await this.prisma.person.groupBy({
            where: { tenantId },
            by: ['status'],
            _count: { status: true },
        });
        const byType = await this.prisma.person.groupBy({
            where: { tenantId },
            by: ['type'],
            _count: { type: true },
        });
        const byCareer = await this.prisma.person.groupBy({
            where: { tenantId },
            by: ['careerInterest'],
            _count: { careerInterest: true },
        });
        return { total, byStatus, byType, byCareer };
    }

    async findOne(id: string) {
        return this.prisma.person.findUnique({
            where: { id },
            include: {
                interactions: {
                    orderBy: { createdAt: 'asc' }
                },
                pipelineStage: true,
                tags: {
                    include: {
                        tag: true
                    }
                },
                notes: {
                    include: {
                        author: {
                            select: { fullName: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
    }

    async toggleHandover(id: string, status: boolean) {
        return this.prisma.person.update({
            where: { id },
            data: { isHandoverActive: status },
        });
    }

    async getLastMessages(personId: string, limit: number = 10) {
        return this.prisma.interaction.findMany({
            where: { personId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    async findById(id: string) {
        return this.prisma.person.findUnique({
            where: { id },
        });
    }

    // New Lifecycle methods

    async convertLeadToContact(id: string) {
        return this.prisma.person.update({
            where: { id },
            data: {
                type: PersonType.CONTACT,
                convertedAt: new Date()
            },
        });
    }

    async convertContactToCustomer(id: string) {
        return this.prisma.person.update({
            where: { id },
            data: {
                type: PersonType.CUSTOMER,
                convertedAt: new Date()
            },
        });
    }

    async updatePipelineStage(id: string, stageId: string) {
        return this.prisma.person.update({
            where: { id },
            data: { pipelineStageId: stageId },
        });
    }

    async updateQuality(id: string, quality: LeadQuality) {
        return this.prisma.person.update({
            where: { id },
            data: { quality },
        });
    }
}
