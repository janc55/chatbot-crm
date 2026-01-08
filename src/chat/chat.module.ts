import { Module, forwardRef } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { LeadsModule } from '../leads/leads.module';
import { OpenaiModule } from '../openai/openai.module';

@Module({
    imports: [
        PrismaModule,
        forwardRef(() => WhatsappModule),
        LeadsModule,
        OpenaiModule,
    ],
    providers: [ChatGateway, ChatService],
    controllers: [ChatController],
    exports: [ChatGateway],
})
export class ChatModule { }
