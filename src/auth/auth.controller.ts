import { Controller, Request, Post, UseGuards, Body, Get, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    async login(@Body() body: any) {
        const user = await this.authService.validateUser(body.email, body.password);
        if (!user) {
            throw new UnauthorizedException('Credenciales inválidas');
        }
        return this.authService.login(user);
    }

    @Post('request-password-reset')
    async requestPasswordReset(@Body() body: { email: string }) {
        await this.authService.requestPasswordReset(body.email);
        return { message: 'Si el correo existe, recibirás un enlace para restablecer tu contraseña' };
    }

    @Post('reset-password')
    async resetPassword(@Body() body: { token: string; newPassword: string }) {
        await this.authService.resetPassword(body.token, body.newPassword);
        return { message: 'Contraseña actualizada exitosamente' };
    }
}
