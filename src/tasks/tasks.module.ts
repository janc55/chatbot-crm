import { Module } from '@nestjs/common';
import { PersonsModule } from '../persons/persons.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { TemplatesModule } from '../templates/templates.module';
import { SettingsModule } from '../settings/settings.module';
import { TasksService } from './tasks.service';

@Module({
    imports: [PersonsModule, WhatsappModule, TemplatesModule, SettingsModule],
    providers: [TasksService],
})
export class TasksModule { }
