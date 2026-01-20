import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { renderPasswordResetEmail, renderWelcomeEmail } from '../emails';

@Injectable()
export class MailService {
  private resend: Resend;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }
    this.resend = new Resend(apiKey);
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}/reset-password?token=${resetToken}`;

    try {
      // Renderizar el email usando React Email
      const htmlContent = await renderPasswordResetEmail(resetUrl);

      const { error } = await this.resend.emails.send({
        from: 'Nettidev CRM <no-reply@netti.lat>',
        to: [email],
        subject: 'Restablecer tu contraseña | Nettidev',
        html: htmlContent,
      });

      if (error) {
        console.error('[MailService] Error sending password reset email:', error);
        throw new Error(`Failed to send password reset email: ${error.message}`);
      }

      console.log(`[MailService] Password reset email sent successfully to ${email}`);
    } catch (error) {
      console.error('[MailService] Error sending password reset email:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, userName: string): Promise<void> {
    const loginUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173')}/login`;

    try {
      // Renderizar el email usando React Email
      const htmlContent = await renderWelcomeEmail(userName, loginUrl);

      const { error } = await this.resend.emails.send({
        from: 'Nettidev CRM <no-reply@netti.lat>',
        to: [email],
        subject: 'Bienvenido a Nettidev | Sistema de Gestión Universitaria',
        html: htmlContent,
      });

      if (error) {
        console.error('[MailService] Error sending welcome email:', error);
        throw new Error(`Failed to send welcome email: ${error.message}`);
      }

      console.log(`[MailService] Welcome email sent successfully to ${email} for user ${userName}`);
    } catch (error) {
      console.error('[MailService] Error sending welcome email:', error);
      throw error;
    }
  }

  async sendSupportEmail(to: string, subject: string, message: string): Promise<void> {
    try {
      const { error } = await this.resend.emails.send({
        from: 'Nettidev CRM <no-reply@netti.lat>',
        to: [to],
        subject: subject,
        html: `
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background-color: #2563eb;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
              }
              .content {
                background-color: #f8f9fa;
                padding: 30px;
                border-radius: 0 0 8px 8px;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                font-size: 14px;
                color: #6b7280;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Nettidev CRM</h1>
              <h2>Soporte</h2>
            </div>
            <div class="content">
              ${message}
            </div>
            <div class="footer">
              <p>Este es un correo automático del sistema de soporte.</p>
              <p>&copy; 2026 Nettidev CRM. Todos los derechos reservados.</p>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        console.error('[MailService] Error sending support email:', error);
        throw new Error(`Failed to send support email: ${error.message}`);
      }

      console.log(`[MailService] Support email sent successfully to ${to}`);
    } catch (error) {
      console.error('[MailService] Error sending support email:', error);
      throw error;
    }
  }
}