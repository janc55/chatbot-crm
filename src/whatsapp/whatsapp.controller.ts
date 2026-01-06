import { Controller, Post, Body, Get } from '@nestjs/common';
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
        // We need to access BaileysService directly or via WhatsappService.
        // WhatsappService has BaileysService injected. 
        // But WhatsappController injects WhatsappService. 
        // I should expose it via WhatsappService or inject BaileysService into Controller.
        // WhatsappModule exports BaileysService, so I can inject it here.
        // But I need to update constructor.
        return this.whatsappService.getBotStatus();
    }
}
