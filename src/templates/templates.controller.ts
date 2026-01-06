import { Controller, Get, Patch, Param, Body, Post } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Templates')
@Controller('templates')
export class TemplatesController {
    constructor(private readonly templatesService: TemplatesService) { }

    @Post()
    @ApiOperation({ summary: 'Create a template' })
    async create(@Body() body: any) {
        return this.templatesService.create(body);
    }

    @Get()
    @ApiOperation({ summary: 'List all templates' })
    async findAll() {
        return this.templatesService.findAll();
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a template' })
    async update(@Param('id') id: string, @Body() body: any) {
        return this.templatesService.update(id, body);
    }
}
