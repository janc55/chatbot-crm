import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ChatbotSettings {
  messageDelayEnabled: boolean;
  messageDelayMin: number; // in milliseconds
  messageDelayMax: number; // in milliseconds
  typingSpeed: number; // characters per second
  autoResponsesEnabled: boolean;
  workingHoursEnabled: boolean;
  workingHoursStart: string; // HH:MM format
  workingHoursEnd: string; // HH:MM format
  customGreeting: string;
  aiConfidenceThreshold: number; // 0-1
}

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    try {
      console.log('[SettingsService] Initializing default settings...');
      await this.initializeDefaultSettings();
      console.log('[SettingsService] Default settings initialized successfully');
    } catch (error) {
      console.error('[SettingsService] Error initializing default settings:', error);
      // Don't throw error to prevent module initialization failure
    }
  }

  async getAllSettings(): Promise<Record<string, string>> {
    const settings = await this.prisma.setting.findMany();
    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
  }

  async getSetting(key: string): Promise<string | null> {
    const setting = await this.prisma.setting.findUnique({
      where: { key }
    });
    return setting?.value || null;
  }

  async setSetting(key: string, value: string, description?: string, category: string = 'general'): Promise<void> {
    await this.prisma.setting.upsert({
      where: { key },
      update: { value, description, category },
      create: { key, value, description, category }
    });
  }

  async getChatbotSettings(): Promise<ChatbotSettings> {
    try {
      const settings = await this.getAllSettings();

      return {
        messageDelayEnabled: settings['messageDelayEnabled'] !== 'false', // Default true
        messageDelayMin: parseInt(settings['messageDelayMin'] || '800'),
        messageDelayMax: parseInt(settings['messageDelayMax'] || '2000'),
        typingSpeed: parseInt(settings['typingSpeed'] || '150'),
        autoResponsesEnabled: settings['autoResponsesEnabled'] !== 'false', // Default true
        workingHoursEnabled: settings['workingHoursEnabled'] === 'true',
        workingHoursStart: settings['workingHoursStart'] || '08:00',
        workingHoursEnd: settings['workingHoursEnd'] || '18:00',
        customGreeting: settings['customGreeting'] || '¡Hola! Soy el asistente de la Universidad. ¿En qué puedo ayudarte?',
        aiConfidenceThreshold: parseFloat(settings['aiConfidenceThreshold'] || '0.7')
      };
    } catch (error) {
      console.error('[SettingsService] Error getting chatbot settings, using defaults:', error);
      // Return safe defaults
      return {
        messageDelayEnabled: true,
        messageDelayMin: 800,
        messageDelayMax: 2000,
        typingSpeed: 150,
        autoResponsesEnabled: true,
        workingHoursEnabled: false,
        workingHoursStart: '08:00',
        workingHoursEnd: '18:00',
        customGreeting: '¡Hola! Soy el asistente de la Universidad. ¿En qué puedo ayudarte?',
        aiConfidenceThreshold: 0.7
      };
    }
  }

  async updateChatbotSettings(settings: Partial<ChatbotSettings>): Promise<void> {
    const updates = Object.entries(settings).map(([key, value]) => {
      return this.setSetting(key, String(value), `Chatbot setting: ${key}`, 'chatbot');
    });

    await Promise.all(updates);
  }

  async initializeDefaultSettings(): Promise<void> {
    try {
      // Check if settings already exist
      const existingSettings = await this.prisma.setting.count();
      if (existingSettings > 0) {
        console.log('[SettingsService] Settings already exist, skipping initialization');
        return;
      }

      const defaultSettings: Array<{ key: string; value: string; description: string }> = [
        { key: 'messageDelayEnabled', value: 'true', description: 'Enable message delays to simulate typing' },
        { key: 'messageDelayMin', value: '800', description: 'Minimum delay before sending message (ms)' },
        { key: 'messageDelayMax', value: '2000', description: 'Maximum delay before sending message (ms)' },
        { key: 'typingSpeed', value: '150', description: 'Characters per second for typing simulation (higher = faster)' },
        { key: 'autoResponsesEnabled', value: 'true', description: 'Enable automatic responses' },
        { key: 'workingHoursEnabled', value: 'false', description: 'Enable working hours restrictions' },
        { key: 'workingHoursStart', value: '08:00', description: 'Working hours start time' },
        { key: 'workingHoursEnd', value: '18:00', description: 'Working hours end time' },
        { key: 'customGreeting', value: '¡Hola! Soy el asistente de la Universidad. ¿En qué puedo ayudarte?', description: 'Custom greeting message' },
        { key: 'aiConfidenceThreshold', value: '0.7', description: 'AI confidence threshold for responses' }
      ];

      for (const setting of defaultSettings) {
        await this.setSetting(setting.key, setting.value, setting.description, 'chatbot');
      }

      console.log('[SettingsService] Default settings initialized successfully');
    } catch (error) {
      console.error('[SettingsService] Error in initializeDefaultSettings:', error);
      throw error;
    }
  }
}
