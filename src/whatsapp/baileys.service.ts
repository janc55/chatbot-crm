import { Injectable, OnModuleInit, Logger, Inject, forwardRef, OnModuleDestroy } from '@nestjs/common';
import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    WASocket,
    AnyMessageContent,
    fetchLatestBaileysVersion,
    jidNormalizedUser,
} from '@whiskeysockets/baileys';
import * as qrcode from 'qrcode-terminal';
import * as path from 'path';
import * as fs from 'fs';
import { WhatsappService } from './whatsapp.service';
import { SettingsService } from '../settings/settings.service';
import { LogsService } from '../logs/logs.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BaileysService implements OnModuleInit, OnModuleDestroy {
    private socks = new Map<string, WASocket>();
    private readonly logger = new Logger(BaileysService.name);
    private qrs = new Map<string, string>();
    private connectionStatuses = new Map<string, string>(); // CONNECTING, CONNECTED, DISCONNECTED
    private reconnectAttempts = new Map<string, number>();
    private readonly maxReconnectAttempts = 5;

    constructor(
        @Inject(forwardRef(() => WhatsappService))
        private readonly whatsappService: WhatsappService,
        private readonly settingsService: SettingsService,
        private readonly logsService: LogsService,
        private readonly prisma: PrismaService,
    ) {
        this.logger.log('[DEBUG] BaileysService constructor called');
    }

    async onModuleInit() {
        if (process.env.SKIP_WHATSAPP_CONNECT === 'true') {
            this.logger.log('Skipping WhatsApp connection (SKIP_WHATSAPP_CONNECT is set)');
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));

        await this.initializeInstances();
    }

    async initializeInstances() {
        try {
            // Use any to bypass type check if client not generated yet
            const instances: any[] = await this.prisma.whatsappInstance.findMany();
            this.logger.log(`Found ${instances.length} WhatsApp instances to connect.`);

            for (const instance of instances) {
                this.connectToWhatsApp(instance);
            }
        } catch (error) {
            this.logger.error(`Error initializing instances: ${error}`);
        }
    }

    async onModuleDestroy() {
        for (const instanceId of this.socks.keys()) {
            await this.disconnect(instanceId);
        }
    }

    async disconnect(instanceId: string) {
        const sock = this.socks.get(instanceId);
        if (sock) {
            this.logger.log(`Cerrando conexión de WhatsApp para instancia ${instanceId}...`);
            try {
                await sock.end(undefined);
            } catch (error) {
                this.logger.error(`Error al cerrar conexión ${instanceId}: ${error}`);
            }
            this.socks.delete(instanceId);
            this.connectionStatuses.set(instanceId, 'DISCONNECTED');

            try {
                // await this.prisma.whatsappInstance.update({
                //     where: { id: instanceId },
                //     data: { status: 'DISCONNECTED' }
                // });
            } catch (e) { }
        }
    }

    async connectToWhatsApp(instance: any) {
        const instanceId = instance.id;
        const tenantId = instance.tenantId;
        const sessionId = instance.sessionId;
        const instanceName = instance.name || 'Unknown';

        this.logger.log(`[DEBUG] connectToWhatsApp called for instance ${instanceId} (${instanceName})`);

        if (this.connectionStatuses.get(instanceId) === 'CONNECTING') {
            this.logger.warn(`Ya hay una conexión en progreso para ${instanceId}, esperando...`);
            return;
        }

        if (this.socks.has(instanceId)) {
            await this.disconnect(instanceId);
        }

        this.connectionStatuses.set(instanceId, 'CONNECTING');

        try {
            const sessionsDir = process.env.WHATSAPP_SESSION_PATH || './wa_sessions';
            const sessionPath = path.join(sessionsDir, sessionId);

            if (!fs.existsSync(sessionPath)) {
                fs.mkdirSync(sessionPath, { recursive: true });
            }

            const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

            let version;
            try {
                const versionInfo = await fetchLatestBaileysVersion();
                version = versionInfo.version;
            } catch (error) {
                this.logger.warn(`Failed to fetch latest Baileys version: ${error}`);
            }

            const createSilentLogger = () => ({
                level: 'silent' as const,
                child: () => createSilentLogger(),
                trace: () => { },
                debug: () => { },
                info: () => { },
                warn: () => { },
                error: () => { },
            });
            const baileysLogger = createSilentLogger();

            const socketConfig: any = {
                auth: state,
                printQRInTerminal: false,
                logger: baileysLogger,
                browser: ['Chatbot Multi', 'Chrome', '1.0.0'],
                connectTimeoutMs: 60000,
                defaultQueryTimeoutMs: 60000,
                keepAliveIntervalMs: 10000,
            };

            if (version) socketConfig.version = version;

            const sock = makeWASocket(socketConfig);
            this.socks.set(instanceId, sock);

            sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    this.logger.log(`QR Code received for ${instanceName}.`);
                    this.qrs.set(instanceId, qr);
                    await this.updateInstanceStatus(instanceId, 'QR_READY', qr);
                    this.reconnectAttempts.set(instanceId, 0);
                }

                if (connection === 'open') {
                    this.logger.log(`WhatsApp connection open for ${instanceName}!`);
                    this.connectionStatuses.set(instanceId, 'CONNECTED');
                    this.qrs.delete(instanceId);

                    const phone = sock.user?.id?.split('@')[0];
                    await this.updateInstanceStatus(instanceId, 'CONNECTED', null, phone);

                    this.reconnectAttempts.set(instanceId, 0);
                } else if (connection === 'close') {
                    this.connectionStatuses.set(instanceId, 'DISCONNECTED');
                    const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
                    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                    this.logger.error(`Connection closed for ${instanceName}. Reason: ${statusCode}`);

                    if (shouldReconnect) {
                        const attempts = this.reconnectAttempts.get(instanceId) || 0;
                        if (attempts < this.maxReconnectAttempts) {
                            this.reconnectAttempts.set(instanceId, attempts + 1);
                            this.logger.log(`Retrying connection for ${instanceName} in 5s... (Attempt ${attempts + 1})`);
                            setTimeout(() => this.connectToWhatsApp(instance), 5000);
                        } else {
                            this.logger.error(`Max reconnect attempts reached for ${instanceName}`);
                            await this.updateInstanceStatus(instanceId, 'DISCONNECTED');
                        }
                    } else {
                        this.logger.warn(`Logged out for ${instanceName}`);
                        await this.updateInstanceStatus(instanceId, 'DISCONNECTED');
                        // Maybe delete session files?
                    }
                }
            });

            sock.ev.on('creds.update', saveCreds);

            sock.ev.on('messages.upsert', async (m) => {
                if (m.type !== 'notify') return;

                try {
                    for (const msg of m.messages) {
                        if (msg.key.fromMe) continue;
                        if (msg.key.remoteJid?.endsWith('@g.us')) continue;

                        const text = msg.message?.conversation ||
                            msg.message?.extendedTextMessage?.text ||
                            msg.message?.imageMessage?.caption ||
                            '';

                        if (text.trim()) {
                            const originalJid = msg.key.remoteJid;
                            let phoneNumber: string;

                            // Priority 1: Extract from senderPn if available (for @lid JIDs)
                            // @ts-ignore - senderPn is not in Baileys types but exists in messages
                            const senderPn = msg.verifiedBizName || msg.senderPn || (msg as any).senderPn;

                            if (senderPn) {
                                // senderPn usually comes in format like "59172454767" or with country code
                                phoneNumber = senderPn.replace(/\D/g, '');
                                console.log(`[BaileysService] Extracted phone from senderPn: ${phoneNumber}`);
                            } else if (originalJid.includes('@s.whatsapp.net')) {
                                // Priority 2: Standard JID format
                                phoneNumber = originalJid.split('@')[0].replace(/\D/g, '');
                                console.log(`[BaileysService] Extracted phone from standard JID: ${phoneNumber}`);
                            } else {
                                // Priority 3: Fallback - extract from any JID format
                                phoneNumber = originalJid.split('@')[0].replace(/\D/g, '');
                                console.log(`[BaileysService] Extracted phone from JID (fallback): ${phoneNumber} from ${originalJid}`);
                            }

                            if (phoneNumber && phoneNumber.length >= 8) {
                                await this.whatsappService.processMessage({
                                    remoteJid: originalJid,
                                    phoneNumber,
                                    text,
                                    name: msg.pushName || 'Usuario',
                                    messageId: msg.key.id,
                                    tenantId: tenantId,
                                    instanceId: instanceId
                                });
                            }
                        }
                    }
                } catch (e) {
                    this.logger.error(`Error processing message for ${instanceName}: ${e}`);
                }
            });

        } catch (error) {
            this.connectionStatuses.set(instanceId, 'DISCONNECTED');
            this.logger.error(`Failed to connect ${instanceName}: ${error}`);

            const attempts = this.reconnectAttempts.get(instanceId) || 0;
            if (attempts < this.maxReconnectAttempts) {
                this.reconnectAttempts.set(instanceId, attempts + 1);
                setTimeout(() => this.connectToWhatsApp(instance), 10000);
            }
        }
    }

    // Helper to update DB status safely
    private async updateInstanceStatus(id: string, status: string, qrCode: string | null = null, phoneNumber: string | null = null) {
        try {
            await this.prisma.whatsappInstance.update({
                where: { id },
                data: {
                    status,
                    qrCode: qrCode || null, // Ensure null if not present
                    ...(phoneNumber ? { phoneNumber } : {})
                }
            });
        } catch (e) {
            this.logger.error(`Failed to update instance status in DB: ${e}`);
        }
    }

    async sendMessage(instanceId: string, to: string, content: AnyMessageContent) {
        const sock = this.socks.get(instanceId);
        if (!sock) {
            throw new Error(`Instance ${instanceId} not connected`);
        }

        await this.applyMessageDelay(instanceId, content);
        await sock.sendMessage(to, content);
    }

    private async applyMessageDelay(instanceId: string, content: AnyMessageContent) {
        // Could fetch tenant specific settings here using instanceId -> tenantId -> settings
        // For now using simple random delay to keep it simple
        const delay = Math.random() * 1000 + 500;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    getQr(instanceId: string): string | null {
        return this.qrs.get(instanceId) || null;
    }

    getConnectionStatus(instanceId: string): string {
        return this.connectionStatuses.get(instanceId) || 'DISCONNECTED';
    }

    async logout(instanceId: string) {
        await this.disconnect(instanceId);
        // Clear session files logic...
        try {
            const instance = await this.prisma.whatsappInstance.findUnique({ where: { id: instanceId } });
            if (instance) {
                const sessionsDir = process.env.WHATSAPP_SESSION_PATH || './wa_sessions';
                const sessionPath = path.join(sessionsDir, instance.sessionId);
                if (fs.existsSync(sessionPath)) {
                    fs.rmSync(sessionPath, { recursive: true, force: true });
                }
            }
            return { success: true };
        } catch (e) {
            return { success: false, error: e };
        }
    }

    async getBotProfilePicture(instanceId: string): Promise<string | null> {
        const sock = this.socks.get(instanceId);
        if (!sock || !sock.user?.id) return null;
        try {
            return await sock.profilePictureUrl(sock.user.id, 'image');
        } catch (e) {
            return null;
        }
    }
}
