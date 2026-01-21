import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { OpenaiModule } from './openai/openai.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { PersonsModule } from './persons/persons.module';
import { TemplatesModule } from './templates/templates.module';
import { InteractionsModule } from './interactions/interactions.module';
import { TasksModule } from './tasks/tasks.module';
import { SettingsModule } from './settings/settings.module';
import { LogsModule } from './logs/logs.module';
import { ChatModule } from './chat/chat.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { PipelineStagesModule } from './pipeline-stages/pipeline-stages.module';
import { TagsModule } from './tags/tags.module';
import { NotesModule } from './notes/notes.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        ScheduleModule.forRoot(),
        MailModule,
        PrismaModule,
        OpenaiModule,
        WhatsappModule,
        PersonsModule,
        TemplatesModule,
        InteractionsModule,
        TasksModule,
        SettingsModule,
        LogsModule,
        ChatModule,
        AuthModule,
        UsersModule,
        PipelineStagesModule,
        TagsModule,
        NotesModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
