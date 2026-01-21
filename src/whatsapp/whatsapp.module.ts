import { Module, forwardRef } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { BaileysService } from './baileys.service';
import { PersonsModule } from '../persons/persons.module';
import { InteractionsModule } from '../interactions/interactions.module';
import { TemplatesModule } from '../templates/templates.module';
import { OpenaiModule } from '../openai/openai.module';
import { SettingsModule } from '../settings/settings.module';
import { LogsModule } from '../logs/logs.module';
import { ChatModule } from '../chat/chat.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        forwardRef(() => PersonsModule),
        InteractionsModule,
        TemplatesModule,
        OpenaiModule,
        SettingsModule,
        LogsModule,
        forwardRef(() => ChatModule),
        forwardRef(() => AuthModule),
    ],
    providers: [WhatsappService, BaileysService],
    controllers: [WhatsappController],
    exports: [WhatsappService, BaileysService],
})
export class WhatsappModule { }
