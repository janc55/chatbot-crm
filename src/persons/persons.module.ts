import { Module, forwardRef } from '@nestjs/common';
import { PersonsService } from './persons.service';
import { PersonsController } from './persons.controller';
import { InteractionsModule } from '../interactions/interactions.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { ImportExportService } from './import-export.service';

@Module({
    imports: [InteractionsModule, forwardRef(() => WhatsappModule)],
    providers: [PersonsService, ImportExportService],
    controllers: [PersonsController],
    exports: [PersonsService, ImportExportService],
})
export class PersonsModule { }
