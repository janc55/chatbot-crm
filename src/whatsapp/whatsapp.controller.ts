import { Controller, Post, Body, Get, HttpCode } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Whatsapp')
@Controller('webhook/whatsapp')
export class WhatsappController {
    constructor(private readonly whatsappService: WhatsappService) { }

    @Post()
    @ApiOperation({ summary: 'Receive webhook from WhatsApp (External or Internal)' })
    async handleWebhook(@Body() body: any) {
        if (body.remoteJid && body.text) {
            await this.whatsappService.processMessage(body);
            return { status: 'processed' };
        }
        return { status: 'ignored' };
    }

    @Get('status')
    @ApiOperation({ summary: 'Get WhatsApp Bot Status & Profile Info' })
    async getStatus() {
        return this.whatsappService.getBotStatus();
    }

    @Get('profile-picture')
    @ApiOperation({ summary: 'Get WhatsApp Bot Profile Picture URL' })
    async getProfilePicture() {
        const profilePictureUrl = await this.whatsappService.getBotProfilePicture();
        return { profilePicture: profilePictureUrl };
    }

    @Post('connect')
    @HttpCode(200)
    @ApiOperation({ summary: 'Start WhatsApp connection and generate QR' })
    async connect() {
        return this.whatsappService.startConnection();
    }

    @Post('disconnect')
    @HttpCode(200)
    @ApiOperation({ summary: 'Disconnect and logout from WhatsApp' })
    async disconnect() {
        return this.whatsappService.logout();
    }
}
