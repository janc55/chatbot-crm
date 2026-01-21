import { Controller, Get, Post, Patch, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { TagsService } from './tags.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Tags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tags')
export class TagsController {
    constructor(private readonly tagsService: TagsService) { }

    @Get()
    @ApiOperation({ summary: 'Get all tags for the tenant' })
    async findAll(@Request() req: any) {
        return this.tagsService.findAll(req.user.tenantId);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new tag' })
    async create(@Request() req: any, @Body() data: any) {
        return this.tagsService.create(req.user.tenantId, data);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a tag' })
    async update(@Param('id') id: string, @Body() data: any) {
        return this.tagsService.update(id, data);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a tag' })
    async remove(@Param('id') id: string) {
        return this.tagsService.remove(id);
    }

    @Post(':tagId/attach/:personId')
    @ApiOperation({ summary: 'Attach tag to a person' })
    async attach(@Param('tagId') tagId: string, @Param('personId') personId: string) {
        return this.tagsService.attachTag(personId, tagId);
    }

    @Delete(':tagId/detach/:personId')
    @ApiOperation({ summary: 'Detach tag from a person' })
    async detach(@Param('tagId') tagId: string, @Param('personId') personId: string) {
        return this.tagsService.detachTag(personId, tagId);
    }
}
