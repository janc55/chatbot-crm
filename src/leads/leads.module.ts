import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { InteractionsModule } from '../interactions/interactions.module';

@Module({
    imports: [InteractionsModule],
    providers: [LeadsService],
    controllers: [LeadsController],
    exports: [LeadsService],
})
export class LeadsModule { }
