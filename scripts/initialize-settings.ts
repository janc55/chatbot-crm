import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SettingsService } from '../src/settings/settings.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const settingsService = app.get(SettingsService);

  try {
    console.log('Initializing default settings...');
    await settingsService.initializeDefaultSettings();
    console.log('✅ Default settings initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing settings:', error);
  } finally {
    await app.close();
  }
}

bootstrap();