module.exports = {
    default: jest.fn(),
    makeWASocket: jest.fn().mockReturnValue({
        ev: { on: jest.fn(), emit: jest.fn() },
        authState: { creds: {}, keys: {} },
        sendMessage: jest.fn(),
        user: { id: 'me' }
    }),
    DisconnectReason: {},
    useMultiFileAuthState: jest.fn().mockResolvedValue({ state: {}, saveCreds: jest.fn() }),
    fetchLatestBaileysVersion: jest.fn().mockResolvedValue({ version: [0, 0, 0] }),
    makeCacheableSignalKeyStore: jest.fn(),
    jidNormalizedUser: jest.fn().mockImplementation(jid => jid),
};
