import { Controller, Post, Body, Get, Delete, Param, Query, NotFoundException, HttpCode, Inject, forwardRef, UseGuards, Req } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { BaileysService } from './baileys.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Whatsapp')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('webhook/whatsapp')
export class WhatsappController {
    constructor(
        private readonly whatsappService: WhatsappService,
        @Inject(forwardRef(() => BaileysService))
        private readonly baileysService: BaileysService
    ) { }

    @Post()
    @ApiOperation({ summary: 'Receive webhook from WhatsApp (External or Internal)' })
    async handleWebhook(@Body() body: any) {
        if (body.remoteJid && body.text && body.tenantId && body.instanceId) {
            await this.whatsappService.processMessage(body);
            return { status: 'processed' };
        }
        return { status: 'ignored', reason: 'Missing required fields (remoteJid, text, tenantId, instanceId)' };
    }

    // --- Instance Management ---

    @Post('instances')
    @ApiOperation({ summary: 'Create a new WhatsApp instance for a tenant' })
    async createInstance(@Req() req: any, @Body() body: { name: string }) {
        const tenantId = req.user.tenantId;
        return this.whatsappService.createInstance(tenantId, body.name);
    }

    @Delete('instances/:id')
    @ApiOperation({ summary: 'Delete a WhatsApp instance' })
    async deleteInstance(@Param('id') id: string) {
        return this.whatsappService.deleteInstance(id);
    }

    @Get('instances')
    @ApiOperation({ summary: 'List WhatsApp instances for a tenant' })
    async listInstances(@Req() req: any) {
        const tenantId = req.user.tenantId;
        return this.whatsappService.getInstances(tenantId);
    }

    @Get('instances/:id')
    @ApiOperation({ summary: 'Get details of a specific instance' })
    async getInstance(@Param('id') id: string) {
        const instance = await this.whatsappService.getInstance(id);
        if (!instance) throw new NotFoundException('Instance not found');
        return instance;
    }

    @Post('instances/:id/connect')
    @HttpCode(200)
    @ApiOperation({ summary: 'Start connection process for an instance' })
    async connectInstance(@Param('id') id: string) {
        const instance = await this.whatsappService.getInstance(id);
        if (!instance) throw new NotFoundException('Instance not found');

        await this.baileysService.connectToWhatsApp(instance);
        return { message: 'Connection started', status: 'connecting' };
    }

    @Post('instances/:id/disconnect')
    @HttpCode(200)
    @ApiOperation({ summary: 'Disconnect and logout an instance' })
    async disconnectInstance(@Param('id') id: string) {
        return this.baileysService.logout(id);
    }

    @Get('instances/:id/status')
    @ApiOperation({ summary: 'Get connection status and QR code for an instance' })
    async getInstanceStatus(@Param('id') id: string) {
        return {
            status: this.baileysService.getConnectionStatus(id),
            qr: this.baileysService.getQr(id)
        };
    }

    @Get('instances/:id/profile-picture')
    @ApiOperation({ summary: 'Get profile picture' })
    async getProfilePicture(@Param('id') id: string) {
        const url = await this.baileysService.getBotProfilePicture(id);
        return { profilePicture: url };
    }
}
