import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { InteractionsService } from '../interactions/interactions.service';

@ApiTags('Leads')
@Controller('leads')
export class LeadsController {
    constructor(
        private readonly leadsService: LeadsService,
        private readonly interactionsService: InteractionsService
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
}
