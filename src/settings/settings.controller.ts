import { Controller, Get, Post, Body } from '@nestjs/common';
import { SettingsService, ChatbotSettings } from './settings.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all settings' })
  async getAllSettings() {
    return this.settingsService.getAllSettings();
  }

  @Get('chatbot')
  @ApiOperation({ summary: 'Get chatbot-specific settings' })
  async getChatbotSettings(): Promise<ChatbotSettings> {
    return this.settingsService.getChatbotSettings();
  }

  @Post('chatbot')
  @ApiOperation({ summary: 'Update chatbot settings' })
  async updateChatbotSettings(@Body() settings: Partial<ChatbotSettings>) {
    await this.settingsService.updateChatbotSettings(settings);
    return { success: true, message: 'Settings updated successfully' };
  }

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize default settings' })
  async initializeSettings() {
    await this.settingsService.initializeDefaultSettings();
    return { success: true, message: 'Default settings initialized' };
  }
}
