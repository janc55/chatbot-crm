import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { BaileysService } from './baileys.service';
import { LeadsModule } from '../leads/leads.module';
import { InteractionsModule } from '../interactions/interactions.module';
import { TemplatesModule } from '../templates/templates.module';
import { OpenaiModule } from '../openai/openai.module';
import { SettingsModule } from '../settings/settings.module';
import { LogsModule } from '../logs/logs.module';

@Module({
    imports: [LeadsModule, InteractionsModule, TemplatesModule, OpenaiModule, SettingsModule, LogsModule],
    providers: [WhatsappService, BaileysService],
    controllers: [WhatsappController],
    exports: [WhatsappService, BaileysService],
})
export class WhatsappModule { }
