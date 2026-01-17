import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LeadsService } from '../leads/leads.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { TemplatesService } from '../templates/templates.service';
import { SettingsService } from '../settings/settings.service';
import { LeadStatus } from '@prisma/client';

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);

    constructor(
        private leadsService: LeadsService,
        private whatsappService: WhatsappService,
        private templatesService: TemplatesService,
        private settingsService: SettingsService,
    ) { }

    @Cron(CronExpression.EVERY_HOUR)
    async handleFollowUps() {
        // 0. Check if follow-up is enabled
        const settings = await this.settingsService.getChatbotSettings();
        if (!settings.followUpEnabled) {
            return;
        }

        this.logger.log(`Starting follow-up check (Inactivity threshold: ${settings.followUpHours}h)...`);

        // Find leads without interaction for > settings.followUpHours
        const leads = await this.leadsService.findStaleLeads(settings.followUpHours);

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
