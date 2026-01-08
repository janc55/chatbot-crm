import { Module, forwardRef } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { InteractionsModule } from '../interactions/interactions.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
    imports: [InteractionsModule, forwardRef(() => WhatsappModule)],
    providers: [LeadsService],
    controllers: [LeadsController],
    exports: [LeadsService],
})
export class LeadsModule { }
