import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotesService {
    constructor(private prisma: PrismaService) { }

    async findAllForPerson(personId: string) {
        return this.prisma.note.findMany({
            where: { personId },
            include: {
                author: {
                    select: {
                        fullName: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(authorId: string, personId: string, content: string) {
        return this.prisma.note.create({
            data: {
                content,
                authorId,
                personId,
            },
        });
    }

    async update(id: string, authorId: string, content: string) {
        return this.prisma.note.update({
            where: { id, authorId }, // Only author can edit
            data: { content },
        });
    }

    async remove(id: string, authorId: string) {
        return this.prisma.note.delete({
            where: { id, authorId }, // Only author can delete
        });
    }
}
