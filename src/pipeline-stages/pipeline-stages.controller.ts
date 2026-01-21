import { Controller, Get, Post, Patch, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { PipelineStagesService } from './pipeline-stages.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Pipeline Stages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pipeline-stages')
export class PipelineStagesController {
    constructor(private readonly stagesService: PipelineStagesService) { }

    @Get()
    @ApiOperation({ summary: 'Get all pipeline stages for the tenant' })
    async findAll(@Request() req: any) {
        // Assume tenantId is attached to req.user by auth middleware
        return this.stagesService.findAll(req.user.tenantId);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new pipeline stage' })
    async create(@Request() req: any, @Body() data: any) {
        return this.stagesService.create(req.user.tenantId, data);
    }

    @Post('seed')
    @ApiOperation({ summary: 'Seed default pipeline stages' })
    async seed(@Request() req: any) {
        return this.stagesService.seedDefaultStages(req.user.tenantId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a pipeline stage' })
    async update(@Param('id') id: string, @Body() data: any) {
        return this.stagesService.update(id, data);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a pipeline stage' })
    async remove(@Param('id') id: string) {
        return this.stagesService.remove(id);
    }
}
