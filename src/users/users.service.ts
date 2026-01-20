import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { User, Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        private prisma: PrismaService,
        private mailService: MailService
    ) { }

    async findOne(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
            include: { tenant: true },
        });
    }

    async findById(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { id },
            include: { tenant: true },
        });
    }

    async findAllByTenant(tenantId: string): Promise<User[]> {
        return this.prisma.user.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(data: any, tenantId: string): Promise<User> {
        // 1. Verificar límite de usuarios del tenant
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { _count: { select: { users: true } } },
        });

        if (!tenant) {
            throw new BadRequestException('Tenant no encontrado');
        }

        if (tenant._count.users >= tenant.maxUsers) {
            throw new BadRequestException(`Límite de usuarios alcanzado (${tenant.maxUsers}). Actualiza tu plan para agregar más.`);
        }

        // 2. Verificar si el email ya existe
        const existingUser = await this.prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new BadRequestException('El correo ya está registrado');
        }

        // 3. Hash de contraseña
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // 4. Crear usuario
        const user = await this.prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                fullName: data.fullName,
                role: data.role || Role.AGENT,
                tenant: { connect: { id: tenantId } },
            },
        });

        // 5. Enviar email de bienvenida
        try {
            await this.mailService.sendWelcomeEmail(user.email, user.fullName);
        } catch (error) {
            // No fallar la creación del usuario si falla el envío del email
            console.error('[UsersService] Error sending welcome email:', error);
        }

        return user;
    }

    async remove(id: string, tenantId: string): Promise<User> {
        // Asegurar que el usuario pertenece al tenant antes de borrar
        const user = await this.prisma.user.findFirst({
            where: { id, tenantId },
        });

        if (!user) {
            throw new BadRequestException('Usuario no encontrado en este tenant');
        }

        return this.prisma.user.delete({
            where: { id },
        });
    }

    async updatePassword(email: string, newPassword: string): Promise<void> {
        await this.prisma.user.update({
            where: { email },
            data: { password: newPassword },
        });
    }
}
