import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TagsService {
    constructor(private prisma: PrismaService) { }

    async findAll(tenantId: string) {
        return this.prisma.tag.findMany({
            where: { tenantId },
            include: {
                _count: {
                    select: { persons: true }
                }
            }
        });
    }

    async create(tenantId: string, data: { name: string, color?: string, category?: string }) {
        return this.prisma.tag.create({
            data: {
                ...data,
                tenantId,
            },
        });
    }

    async update(id: string, data: { name?: string, color?: string, category?: string }) {
        return this.prisma.tag.update({
            where: { id },
            data,
        });
    }

    async remove(id: string) {
        return this.prisma.tag.delete({
            where: { id },
        });
    }

    async attachTag(personId: string, tagId: string) {
        return this.prisma.personTag.upsert({
            where: {
                personId_tagId: {
                    personId,
                    tagId,
                },
            },
            update: {},
            create: {
                personId,
                tagId,
            },
        });
    }

    async detachTag(personId: string, tagId: string) {
        return this.prisma.personTag.delete({
            where: {
                personId_tagId: {
                    personId,
                    tagId,
                },
            },
        });
    }
}
