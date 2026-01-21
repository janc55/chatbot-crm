import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PersonsService } from '../persons/persons.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { TemplatesService } from '../templates/templates.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);

    constructor(
        private personsService: PersonsService,
        private whatsappService: WhatsappService,
        private templatesService: TemplatesService,
        private settingsService: SettingsService,
    ) { }

    @Cron(CronExpression.EVERY_HOUR)
    async handleFollowUps() {
        const tenants = await this.settingsService.getAllTenants();

        for (const tenant of tenants) {
            try {
                // 0. Check if follow-up is enabled for this tenant
                const settings = await this.settingsService.getChatbotSettings(tenant.id);
                if (!settings.followUpEnabled) {
                    continue;
                }

                this.logger.log(`[Tenant: ${tenant.name}] Starting follow-up check (Inactivity threshold: ${settings.followUpHours}h)...`);

                // Find persons without interaction for > settings.followUpHours
                const persons = await this.personsService.findStaleLeads(tenant.id, settings.followUpHours);

                if (persons.length === 0) {
                    continue;
                }

                this.logger.log(`[Tenant: ${tenant.name}] Found ${persons.length} stale persons. Sending follow-ups...`);

                const template = await this.templatesService.findByKey('seguimiento', tenant.id);
                if (!template) {
                    this.logger.warn(`[Tenant: ${tenant.name}] Follow-up template "seguimiento" not found.`);
                    continue;
                }

                for (const person of persons) {
                    this.logger.log(`[Tenant: ${tenant.name}] Sending follow-up to ${person.phone}`);
                    await this.whatsappService.sendFollowUp(person, template);
                }
            } catch (error) {
                this.logger.error(`Error processing follow-ups for tenant ${tenant.id}: ${error.message}`);
            }
        }
    }
}
