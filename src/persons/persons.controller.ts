import { Controller, Get, Patch, Param, Body, Post, UseInterceptors, UploadedFile, Res, UseGuards, Req } from '@nestjs/common';
import { PersonsService } from './persons.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InteractionsService } from '../interactions/interactions.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { LeadQuality } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportExportService } from './import-export.service';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Persons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('persons')
export class PersonsController {
    constructor(
        private readonly personsService: PersonsService,
        private readonly interactionsService: InteractionsService,
        private readonly whatsappService: WhatsappService,
        private readonly importExportService: ImportExportService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'Get all persons (leads, contacts, customers)' })
    async findAll(@Req() req: any) {
        return this.personsService.findAll(req.user.tenantId);
    }

    @Get('export')
    @ApiOperation({ summary: 'Export persons to Excel' })
    async export(@Req() req: any, @Res() res: Response) {
        const persons = await this.personsService.findAll(req.user.tenantId);
        const buffer = await this.importExportService.exportToExcel(persons);

        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="persons.xlsx"',
            'Content-Length': buffer.length,
        });

        res.end(buffer);
    }

    @Post('import')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Import persons from CSV or Excel' })
    async import(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
        const tenantId = req.user.tenantId;
        if (file.originalname.endsWith('.csv')) {
            return this.importExportService.importFromCsv(file.buffer, tenantId);
        } else {
            return this.importExportService.importFromExcel(file.buffer, tenantId);
        }
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get persona statistics' })
    async getStats(@Req() req: any) {
        return this.personsService.getStats(req.user.tenantId);
    }

    @Get('stats/history')
    @ApiOperation({ summary: 'Get daily interaction stats' })
    async getDailyStats(@Req() req: any) {
        return this.interactionsService.getDailyStats(req.user.tenantId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get person details' })
    async findOne(@Param('id') id: string) {
        return this.personsService.findOne(id);
    }

    @Patch(':id/handover')
    @ApiOperation({ summary: 'Toggle human agent mode' })
    async toggleHandover(@Param('id') id: string, @Body() body: { status: boolean }) {
        return this.personsService.toggleHandover(id, body.status);
    }

    @Post(':id/message')
    @ApiOperation({ summary: 'Send message to person as advisor' })
    async sendAdvisorMessage(@Param('id') id: string, @Body() body: { message: string }) {
        const person = await this.personsService.findOne(id);
        if (!person) {
            throw new Error('Person not found');
        }

        if (person.isHandoverActive) {
            await this.personsService.toggleHandover(id, false);
        }

        const remoteJid = person.phone.includes('@') ? person.phone : `${person.phone}@s.whatsapp.net`;
        await this.whatsappService.sendAdvisorMessage(remoteJid, body.message, person);

        return { success: true, message: 'Message sent successfully' };
    }

    @Post(':id/convert-to-contact')
    @ApiOperation({ summary: 'Convert lead to contact' })
    async convertToContact(@Param('id') id: string) {
        return this.personsService.convertLeadToContact(id);
    }

    @Post(':id/convert-to-customer')
    @ApiOperation({ summary: 'Convert contact to customer' })
    async convertToCustomer(@Param('id') id: string) {
        return this.personsService.convertContactToCustomer(id);
    }

    @Patch(':id/pipeline-stage')
    @ApiOperation({ summary: 'Update pipeline stage' })
    async updatePipelineStage(@Param('id') id: string, @Body() body: { stageId: string }) {
        return this.personsService.updatePipelineStage(id, body.stageId);
    }

    @Patch(':id/quality')
    @ApiOperation({ summary: 'Update person quality' })
    async updateQuality(@Param('id') id: string, @Body() body: { quality: LeadQuality }) {
        return this.personsService.updateQuality(id, body.quality);
    }
}
