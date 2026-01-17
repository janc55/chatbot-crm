import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SettingsService, ChatbotSettings } from './settings.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Settings')
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) { }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all settings' })
  async getAllSettings() {
    return this.settingsService.getAllSettings();
  }

  @Get('chatbot')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get chatbot-specific settings' })
  async getChatbotSettings(): Promise<ChatbotSettings> {
    return this.settingsService.getChatbotSettings();
  }

  @Post('chatbot')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update chatbot settings' })
  async updateChatbotSettings(@Body() settings: Partial<ChatbotSettings>) {
    await this.settingsService.updateChatbotSettings(settings);
    return { success: true, message: 'Settings updated successfully' };
  }

  @Post('initialize')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Initialize default settings' })
  async initializeSettings() {
    await this.settingsService.initializeDefaultSettings();
    return { success: true, message: 'Default settings initialized' };
  }
}
