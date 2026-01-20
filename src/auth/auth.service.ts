import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private mailService: MailService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findOne(email);
        if (user && (await bcrypt.compare(pass, user.password))) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = {
            email: user.email,
            sub: user.id,
            role: user.role,
            tenantId: user.tenantId
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                tenantId: user.tenantId,
            },
        };
    }

    async requestPasswordReset(email: string): Promise<void> {
        const user = await this.usersService.findOne(email);
        if (!user) {
            // Por seguridad, no revelamos si el email existe o no
            return;
        }

        // Generar token de reseteo (válido por 1 hora)
        const resetToken = this.jwtService.sign(
            {
                email: user.email,
                type: 'password_reset',
                sub: user.id
            },
            {
                expiresIn: '1h',
                secret: process.env.JWT_SECRET || 'default-secret'
            }
        );

        // Enviar email de recuperación
        await this.mailService.sendPasswordResetEmail(user.email, resetToken);
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        try {
            // Verificar el token
            const payload = this.jwtService.verify(token, {
                secret: process.env.JWT_SECRET || 'default-secret'
            });

            if (payload.type !== 'password_reset') {
                throw new UnauthorizedException('Invalid token type');
            }

            // Hash de la nueva contraseña
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Actualizar contraseña del usuario
            await this.usersService.updatePassword(payload.email, hashedPassword);
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }
}
