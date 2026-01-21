import { Module } from '@nestjs/common';
import { PipelineStagesService } from './pipeline-stages.service';
import { PipelineStagesController } from './pipeline-stages.controller';

@Module({
    providers: [PipelineStagesService],
    controllers: [PipelineStagesController],
    exports: [PipelineStagesService],
})
export class PipelineStagesModule { }
