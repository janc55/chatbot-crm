import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Roles(Role.ADMIN)
    @Get()
    async findAll(@Request() req: any) {
        return this.usersService.findAllByTenant(req.user.tenantId);
    }

    @Roles(Role.ADMIN)
    @Post()
    async create(@Request() req: any, @Body() userData: any) {
        return this.usersService.create(userData, req.user.tenantId);
    }

    @Roles(Role.ADMIN)
    @Delete(':id')
    async remove(@Request() req: any, @Param('id') id: string) {
        // No permitirse borrar a uno mismo
        if (req.user.userId === id) {
            throw new ForbiddenException('No puedes eliminar tu propio usuario');
        }
        return this.usersService.remove(id, req.user.tenantId);
    }
}
