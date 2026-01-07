import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { OpenaiModule } from './openai/openai.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { LeadsModule } from './leads/leads.module';
import { TemplatesModule } from './templates/templates.module';
import { InteractionsModule } from './interactions/interactions.module';
import { TasksModule } from './tasks/tasks.module';
import { SettingsModule } from './settings/settings.module';
import { LogsModule } from './logs/logs.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        ScheduleModule.forRoot(),
        PrismaModule,
        OpenaiModule,
        WhatsappModule,
        LeadsModule,
        TemplatesModule,
        InteractionsModule,
        TasksModule,
        SettingsModule,
        LogsModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
