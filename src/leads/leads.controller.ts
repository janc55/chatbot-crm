import { Controller, Get, Patch, Param, Body, Post } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { InteractionsService } from '../interactions/interactions.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@ApiTags('Leads')
@Controller('leads')
export class LeadsController {
    constructor(
        private readonly leadsService: LeadsService,
        private readonly interactionsService: InteractionsService,
        private readonly whatsappService: WhatsappService
    ) { }

    @Get()
    @ApiOperation({ summary: 'Get all leads' })
    async findAll() {
        return this.leadsService.findAll();
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get lead statistics' })
    async getStats() {
        return this.leadsService.getStats();
    }

    @Get('stats/history')
    @ApiOperation({ summary: 'Get daily interaction stats' })
    async getDailyStats() {
        return this.interactionsService.getDailyStats();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get lead details' })
    async findOne(@Param('id') id: string) {
        return this.leadsService.findOne(id);
    }

    @Patch(':id/handover')
    @ApiOperation({ summary: 'Toggle human agent mode' })
    async toggleHandover(@Param('id') id: string, @Body() body: { status: boolean }) {
        return this.leadsService.toggleHandover(id, body.status);
    }

    @Post(':id/message')
    @ApiOperation({ summary: 'Send message to lead as advisor' })
    async sendAdvisorMessage(@Param('id') id: string, @Body() body: { message: string }) {
        const lead = await this.leadsService.findOne(id);
        if (!lead) {
            throw new Error('Lead not found');
        }

        // Cancelar handover si está activo (el asesor está respondiendo)
        if (lead.isHandoverActive) {
            await this.leadsService.toggleHandover(id, false);
        }

        // Enviar mensaje del asesor
        const remoteJid = lead.phone.includes('@') ? lead.phone : `${lead.phone}@s.whatsapp.net`;
        await this.whatsappService.sendAdvisorMessage(remoteJid, body.message, lead);

        return { success: true, message: 'Message sent successfully' };
    }
}
