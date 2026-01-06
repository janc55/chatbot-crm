import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { LeadsModule } from '../leads/leads.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { TemplatesModule } from '../templates/templates.module';

@Module({
    imports: [LeadsModule, WhatsappModule, TemplatesModule],
    providers: [TasksService],
})
export class TasksModule { }
