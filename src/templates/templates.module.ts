import { Module, forwardRef } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { OpenaiModule } from '../openai/openai.module';

@Module({
    imports: [forwardRef(() => OpenaiModule)],
    providers: [TemplatesService],
    controllers: [TemplatesController],
    exports: [TemplatesService],
})
export class TemplatesModule { }
