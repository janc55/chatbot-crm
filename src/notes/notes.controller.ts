import { Controller, Get, Post, Patch, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { NotesService } from './notes.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Notes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notes')
export class NotesController {
    constructor(private readonly notesService: NotesService) { }

    @Get('person/:personId')
    @ApiOperation({ summary: 'Get all notes for a person' })
    async findAllForPerson(@Param('personId') personId: string) {
        return this.notesService.findAllForPerson(personId);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new note' })
    async create(@Request() req: any, @Body() body: { personId: string, content: string }) {
        return this.notesService.create(req.user.userId, body.personId, body.content);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a note' })
    async update(@Param('id') id: string, @Request() req: any, @Body() body: { content: string }) {
        return this.notesService.update(id, req.user.userId, body.content);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a note' })
    async remove(@Param('id') id: string, @Request() req: any) {
        return this.notesService.remove(id, req.user.userId);
    }
}
