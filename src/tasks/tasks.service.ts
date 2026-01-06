import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LeadsService } from '../leads/leads.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { TemplatesService } from '../templates/templates.service';
import { LeadStatus } from '@prisma/client';

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);

    constructor(
        private leadsService: LeadsService,
        private whatsappService: WhatsappService,
        private templatesService: TemplatesService,
    ) { }

    @Cron(CronExpression.EVERY_HOUR)
    async handleFollowUps() {
        this.logger.log('Starting follow-up check...');

        // Find leads without interaction for > 2 hours
        const leads = await this.leadsService.findStaleLeads(2);

        if (leads.length === 0) {
            this.logger.log('No stale leads found.');
            return;
        }

        this.logger.log(`Found ${leads.length} stale leads. Sending follow-ups...`);

        const template = await this.templatesService.findByKey('seguimiento');
        if (!template) {
            this.logger.warn('Follow-up template "seguimiento" not found.');
            return;
        }

        for (const lead of leads) {
            this.logger.log(`Sending follow-up to ${lead.phone}`);
            await this.whatsappService.sendFollowUp(lead, template);
        }
    }
}
