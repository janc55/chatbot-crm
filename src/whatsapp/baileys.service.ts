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

@Injectable()
export class BaileysService implements OnModuleInit, OnModuleDestroy {
    private sock: WASocket;
    private readonly logger = new Logger(BaileysService.name);
    private isConnecting = false;
    private isConnected = false;
    private reconnectAttempts = 0;
    private readonly maxReconnectAttempts = 5;
    private reconnectDelay = 5000; // 5 segundos inicial
    private currentQr: string | null = null;

    constructor(
        @Inject(forwardRef(() => WhatsappService))
        private readonly whatsappService: WhatsappService,
        private readonly settingsService: SettingsService,
    ) {
        this.logger.log('[DEBUG] BaileysService constructor called');
        this.logger.log('[DEBUG] WhatsappService injected:', !!this.whatsappService);
        this.logger.log('[DEBUG] SettingsService injected:', !!this.settingsService);
    }

    async onModuleInit() {
        // Allow scripts to skip connection
        if (process.env.SKIP_WHATSAPP_CONNECT === 'true') {
            this.logger.log('Skipping WhatsApp connection (SKIP_WHATSAPP_CONNECT is set)');
            return;
        }
        // Esperar un poco antes de conectar para asegurar que todos los módulos estén listos
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.connectToWhatsApp();
    }

    async onModuleDestroy() {
        await this.disconnect();
    }

    private async disconnect() {
        if (this.sock) {
            this.logger.log('Cerrando conexión de WhatsApp...');
            try {
                await this.sock.end(undefined);
            } catch (error) {
                this.logger.error(`Error al cerrar conexión: ${error}`);
            }
            this.sock = null;
            this.isConnected = false;
        }
    }

    async connectToWhatsApp() {
        this.logger.log('[DEBUG] connectToWhatsApp called');

        // Evitar múltiples conexiones simultáneas
        if (this.isConnecting) {
            this.logger.warn('Ya hay una conexión en progreso, esperando...');
            return;
        }

        // Cerrar conexión anterior si existe
        if (this.sock) {
            try {
                await this.disconnect();
            } catch (error) {
                this.logger.error(`Error al desconectar socket anterior: ${error}`);
            }
        }

        this.isConnecting = true;
        this.logger.log('[DEBUG] Starting WhatsApp connection process');

        try {
            const sessionPath = process.env.WHATSAPP_SESSION_PATH || './wa_sessions';
            if (!fs.existsSync(sessionPath)) {
                fs.mkdirSync(sessionPath, { recursive: true });
            }

            // Configurar logger de Baileys para evitar conflictos
            const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

            // Obtener la versión más reciente de Baileys (con fallback si falla)
            let version;
            try {
                const versionInfo = await fetchLatestBaileysVersion();
                version = versionInfo.version;
                this.logger.log(`Usando versión de Baileys: ${version.join('.')}`);
            } catch (error) {
                this.logger.warn(`No se pudo obtener la versión más reciente de Baileys: ${error}. Usando versión por defecto.`);
                // No especificar version, Baileys usará la versión por defecto
                version = undefined;
            }

            // Configurar logger personalizado para Baileys (silenciar logs internos)
            // El logger debe implementar ILogger con el método child()
            const createSilentLogger = () => ({
                level: 'silent' as const,
                child: () => createSilentLogger(), // Retorna un nuevo logger con la misma estructura
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
                browser: ['Ubuntu', 'Chrome', '110.0.0.0'],
                connectTimeoutMs: 60000,
                defaultQueryTimeoutMs: 60000,
                keepAliveIntervalMs: 10000,
            };

            // Solo agregar version si se obtuvo exitosamente
            if (version) {
                socketConfig.version = version;
            }

            this.sock = makeWASocket(socketConfig);

            // Manejar actualizaciones de conexión
            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr, isNewLogin } = update;

                if (qr) {
                    this.logger.log('QR Code recibido. Por favor escanea para iniciar sesión.');
                    qrcode.generate(qr, { small: true });
                    this.currentQr = qr;
                    this.reconnectAttempts = 0; // Resetear intentos cuando hay QR
                }

                if (connection === 'connecting') {
                    this.logger.log('Conectando a WhatsApp...');
                    this.isConnected = false;
                } else if (connection === 'open') {
                    this.logger.log('¡Conexión de WhatsApp abierta exitosamente!');
                    this.isConnecting = false;
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.reconnectDelay = 5000; // Resetear delay

                    if (isNewLogin) {
                        this.logger.log('Nueva sesión iniciada');
                    }
                } else if (connection === 'close') {
                    this.isConnecting = false;
                    this.isConnected = false;
                    const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
                    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                    // Log detallado del error
                    if (lastDisconnect?.error) {
                        this.logger.error(`Error de conexión: ${lastDisconnect.error}`);
                    }

                    this.logger.error(
                        `Conexión cerrada. Razón: ${statusCode || 'unknown'}. Reconectando: ${shouldReconnect}`,
                    );

                    if (statusCode === DisconnectReason.loggedOut) {
                        this.logger.warn('Sesión cerrada. Necesitas escanear el QR nuevamente.');
                        // Limpiar sesión si fue cerrada
                        const sessionPath = process.env.WHATSAPP_SESSION_PATH || './wa_sessions';
                        if (fs.existsSync(sessionPath)) {
                            const files = fs.readdirSync(sessionPath);
                            for (const file of files) {
                                fs.unlinkSync(path.join(sessionPath, file));
                            }
                            this.logger.log('Sesión limpiada. Reinicia la aplicación para obtener un nuevo QR.');
                        }
                    } else if (shouldReconnect) {
                        if (this.reconnectAttempts < this.maxReconnectAttempts) {
                            this.reconnectAttempts++;
                            this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000); // Backoff exponencial, máximo 30s
                            this.logger.log(
                                `Reintentando conexión en ${this.reconnectDelay / 1000} segundos (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`,
                            );
                            setTimeout(() => {
                                this.connectToWhatsApp();
                            }, this.reconnectDelay);
                        } else {
                            this.logger.error(
                                `Máximo de intentos de reconexión alcanzado (${this.maxReconnectAttempts}). Por favor reinicia la aplicación.`,
                            );
                        }
                    }
                }
            });

            // Guardar credenciales cuando se actualicen
            this.sock.ev.on('creds.update', async () => {
                try {
                    await saveCreds();
                    this.logger.log('Credenciales guardadas');
                } catch (error) {
                    this.logger.error(`Error al guardar credenciales: ${error}`);
                }
            });

            // Manejar mensajes entrantes
            this.sock.ev.on('messages.upsert', async (m) => {
                this.logger.log('[DEBUG] messages.upsert event received:', { type: m.type, messagesCount: m.messages?.length });

                try {
                    if (m.type !== 'notify') {
                        this.logger.log('[DEBUG] Ignoring non-notify message type');
                        return;
                    }

                    for (const msg of m.messages) {
                        // Ignorar mensajes propios y de grupos (si no se manejan grupos)
                        if (msg.key.fromMe) continue;
                        if (msg.key.remoteJid?.endsWith('@g.us')) continue;

                        const text = msg.message?.conversation ||
                            msg.message?.extendedTextMessage?.text ||
                            msg.message?.imageMessage?.caption ||
                            '';

                        if (text.trim()) {
                            if (text.trim()) {
                                const originalJid = msg.key.remoteJid;
                                const senderPn = (msg.key as any).senderPn; // senderPn contiene el número real

                                this.logger.log(`Raw Key: ${JSON.stringify(msg.key)}`);
                                this.logger.log(`Original JID: ${originalJid}`);
                                this.logger.log(`SenderPn: ${senderPn}`);

                                // PRIORIDAD 1: Usar senderPn si está disponible (contiene el número real)
                                let normalizedJid: string;
                                let phoneNumber: string | null = null;

                                if (senderPn && senderPn.includes('@s.whatsapp.net')) {
                                    // senderPn tiene el número real de teléfono
                                    phoneNumber = senderPn.split('@')[0].replace(/\D/g, '');
                                    normalizedJid = originalJid; // Usar remoteJid para enviar mensajes
                                    this.logger.log(`Using senderPn with phone number: ${phoneNumber} (remoteJid: ${originalJid})`);
                                } else if (originalJid.includes('@s.whatsapp.net')) {
                                    // Ya tenemos el número real en remoteJid, usarlo directamente
                                    normalizedJid = originalJid;
                                    phoneNumber = originalJid.split('@')[0].replace(/\D/g, '');
                                    this.logger.log(`Using original JID with phone number: ${phoneNumber}`);
                                } else {
                                    // Es un LID o alias, intentar normalizarlo
                                    normalizedJid = jidNormalizedUser(originalJid);
                                    this.logger.log(`Normalized JID: ${originalJid} -> ${normalizedJid}`);

                                    // Extraer el número del JID normalizado
                                    try {
                                        phoneNumber = await this.extractPhoneNumber(normalizedJid);
                                        this.logger.log(`Extracted phone number: ${phoneNumber} from normalized JID: ${normalizedJid}`);
                                    } catch (error) {
                                        this.logger.error(`Failed to extract phone number from ${normalizedJid}: ${error}`);
                                        // Intentar extraer del JID original como último recurso
                                        const fallbackPhone = originalJid.split('@')[0].replace(/\D/g, '');
                                        if (fallbackPhone && fallbackPhone.length >= 8 && /^\d+$/.test(fallbackPhone)) {
                                            phoneNumber = fallbackPhone;
                                            this.logger.log(`Using fallback phone from original JID: ${phoneNumber}`);
                                        } else {
                                            this.logger.error(`CRITICAL: Cannot extract valid phone number from ${originalJid}`);
                                        }
                                    }
                                }

                                // Validar que tenemos un número válido antes de continuar
                                if (!phoneNumber || phoneNumber.length < 8) {
                                    this.logger.error(`CRITICAL: Invalid phone number extracted: ${phoneNumber} from JID: ${originalJid}`);
                                    // No procesar el mensaje si no podemos obtener un número válido
                                    return;
                                }

                                await this.whatsappService.processMessage({
                                    remoteJid: normalizedJid, // Keep JID for sending messages
                                    phoneNumber: phoneNumber, // Pass extracted phone number
                                    text: text,
                                    name: msg.pushName || 'Usuario',
                                    messageId: msg.key.id,
                                });
                            }
                        }
                    }
                } catch (error) {
                    this.logger.error(`Error al procesar mensaje: ${error}`);
                }
            });

        } catch (error) {
            this.isConnecting = false;
            this.logger.error(`Error al conectar con WhatsApp: ${error}`);

            // Reintentar después de un delay
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000);
                this.logger.log(
                    `Reintentando conexión en ${this.reconnectDelay / 1000} segundos (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`,
                );
                setTimeout(() => {
                    this.connectToWhatsApp();
                }, this.reconnectDelay);
            } else {
                this.logger.error(
                    `Máximo de intentos de conexión alcanzado (${this.maxReconnectAttempts}). Por favor reinicia la aplicación.`,
                );
            }
        }
    }

    async sendMessage(to: string, content: AnyMessageContent) {
        this.logger.log(`[DEBUG] sendMessage called for ${to}`);

        if (!this.sock) {
            this.logger.warn('Socket no inicializado, no se puede enviar mensaje');
            throw new Error('Socket no inicializado');
        }

        try {
            // Verificar que la conexión esté abierta
            if (!this.isConnected) {
                this.logger.warn('Socket no está conectado, intentando reconectar...');
                await this.connectToWhatsApp();
                // Esperar un poco para que se establezca la conexión
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Si después de esperar aún no está conectado, lanzar error
                if (!this.isConnected) {
                    throw new Error('No se pudo establecer la conexión para enviar el mensaje');
                }
            }

            this.logger.log(`[DEBUG] About to apply message delay`);

            // Aplicar delay si está habilitado
            await this.applyMessageDelay(content);

            this.logger.log(`[DEBUG] Delay applied, sending message`);

            await this.sock.sendMessage(to, content);
            this.logger.log(`Mensaje enviado a ${to}`);
        } catch (error) {
            this.logger.error(`Error al enviar mensaje a ${to}: ${error}`);
            throw error;
        }
    }

    private async applyMessageDelay(content: AnyMessageContent): Promise<void> {
        try {
            // Simple delay without settings for now - just to test
            const delay = Math.random() * 1000 + 500; // 500-1500ms
            this.logger.log(`[DEBUG] Applying simple delay of ${Math.round(delay)}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        } catch (error) {
            this.logger.warn(`Error aplicando delay: ${error}`);
        }
    }

    getConnectionStatus(): boolean {
        return this.isConnected && this.sock !== null;
    }

    /**
     * Extrae el número de teléfono de un JID, manejando tanto formatos estándar como LIDs
     * @param jid - El JID completo (ej: "1234567890@s.whatsapp.net" o "random@lid")
     * @returns El número de teléfono normalizado (solo dígitos)
     */
    async extractPhoneNumber(jid: string): Promise<string> {
        try {
            this.logger.log(`[extractPhoneNumber] Processing JID: ${jid}`);

            // Si el JID termina en @s.whatsapp.net, extraer el número directamente
            if (jid.includes('@s.whatsapp.net')) {
                const phone = jid.split('@')[0].replace(/\D/g, '');
                this.logger.log(`[extractPhoneNumber] Extracted from @s.whatsapp.net: ${phone}`);
                return phone;
            }

            // Si es un LID (@lid), intentar obtener el número real usando el socket
            if (jid.includes('@lid') && this.sock && this.isConnected) {
                this.logger.log(`[extractPhoneNumber] Attempting to resolve LID: ${jid}`);
                try {
                    // Usar onWhatsApp para obtener información del contacto
                    // Nota: onWhatsApp puede tener diferentes firmas según la versión de Baileys
                    // Intentamos con el JID directamente como string
                    const result = await (this.sock.onWhatsApp as any)(jid);

                    this.logger.log(`[extractPhoneNumber] onWhatsApp result: ${JSON.stringify(result)}`);

                    // Manejar tanto si devuelve un objeto directo como si devuelve un array
                    const finalResult = Array.isArray(result) ? (result.length > 0 ? result[0] : null) : result;

                    if (finalResult && finalResult.exists && finalResult.jid) {
                        // El JID normalizado debería tener el número real
                        const normalizedJid = finalResult.jid;
                        this.logger.log(`[extractPhoneNumber] Normalized JID from onWhatsApp: ${normalizedJid}`);

                        if (normalizedJid && normalizedJid.includes('@s.whatsapp.net')) {
                            const phone = normalizedJid.split('@')[0].replace(/\D/g, '');
                            this.logger.log(`[extractPhoneNumber] Successfully resolved LID ${jid} to phone: ${phone}`);
                            return phone;
                        } else {
                            this.logger.warn(`[extractPhoneNumber] Normalized JID doesn't have @s.whatsapp.net: ${normalizedJid}`);
                        }
                    } else {
                        this.logger.warn(`[extractPhoneNumber] Result doesn't exist or has no jid: ${JSON.stringify(finalResult)}`);
                    }
                } catch (error) {
                    this.logger.error(`[extractPhoneNumber] Error resolving LID ${jid}: ${error}`);
                }

                // Fallback: intentar extraer cualquier número del LID
                // Los LIDs a veces tienen el número al inicio antes del @
                const parts = jid.split('@');
                if (parts[0]) {
                    const possiblePhone = parts[0].replace(/\D/g, '');
                    // Si parece un número de teléfono (más de 8 dígitos), usarlo
                    if (possiblePhone.length >= 8 && /^\d+$/.test(possiblePhone)) {
                        this.logger.log(`[extractPhoneNumber] Using extracted number from LID: ${possiblePhone}`);
                        return possiblePhone;
                    } else {
                        this.logger.warn(`[extractPhoneNumber] LID part doesn't look like a phone number: ${possiblePhone}`);
                    }
                }

                // Si llegamos aquí, no pudimos resolver el LID
                this.logger.error(`[extractPhoneNumber] CRITICAL: Could not resolve LID ${jid} to a phone number!`);
                throw new Error(`No se pudo extraer el número de teléfono del LID: ${jid}`);
            }

            // Si no es @s.whatsapp.net ni @lid, intentar extraer número de cualquier forma
            const phone = jid.split('@')[0].replace(/\D/g, '');
            if (phone && phone.length >= 8 && /^\d+$/.test(phone)) {
                this.logger.log(`[extractPhoneNumber] Extracted number from unknown format: ${phone}`);
                return phone;
            }

            // Último fallback: error
            this.logger.error(`[extractPhoneNumber] CRITICAL: Could not extract phone from JID: ${jid}`);
            throw new Error(`No se pudo extraer el número de teléfono del JID: ${jid}`);
        } catch (error) {
            this.logger.error(`[extractPhoneNumber] Error al extraer número de teléfono de ${jid}: ${error}`);
            throw error; // Re-lanzar el error en lugar de devolver un valor inválido
        }
    }

    async getBotInfo() {
        if (!this.sock || !this.isConnected || !this.sock.user) {
            return {
                status: this.isConnecting ? 'connecting' : 'disconnected',
                name: null,
                phone: null,
                profilePicUrl: null,
                qr: this.currentQr
            };
        }

        const user = this.sock.user;
        let profilePicUrl = null;

        try {
            // "image" returns high res, "preview" low res.
            profilePicUrl = await this.sock.profilePictureUrl(user.id, 'image');
        } catch (e) {
            this.logger.warn(`Could not fetch profile picture for bot: ${e}`);
        }

        return {
            status: 'connected',
            name: user.name || user.notify || 'Chatbot',
            phone: user.id.split(':')[0],
            profilePicUrl,
            qr: null
        };
    }

    async startConnection() {
        if (this.isConnected) {
            return { success: false, message: 'Ya está conectado' };
        }
        await this.connectToWhatsApp();
        return { success: true, message: 'Iniciando conexión...' };
    }

    async logout() {
        if (!this.sock) {
            return { success: false, message: 'No hay conexión activa' };
        }

        try {
            await this.disconnect();
            // Limpiar sesión
            const sessionPath = process.env.WHATSAPP_SESSION_PATH || './wa_sessions';
            if (fs.existsSync(sessionPath)) {
                const files = fs.readdirSync(sessionPath);
                for (const file of files) {
                    fs.unlinkSync(path.join(sessionPath, file));
                }
                this.logger.log('Sesión limpiada');
            }
            this.currentQr = null;
            return { success: true, message: 'Sesión cerrada exitosamente' };
        } catch (error) {
            this.logger.error(`Error al cerrar sesión: ${error}`);
            return { success: false, message: 'Error al cerrar sesión' };
        }
    }
}
