import { useState, useEffect } from 'react';
import api from './api';

interface WhatsAppConnectProps {
    onConnected: () => void;
}

export default function WhatsAppConnect({ onConnected }: WhatsAppConnectProps) {
    const [botInfo, setBotInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);

    const checkStatus = async () => {
        try {
            const response = await api.get('/webhook/whatsapp/status');
            setBotInfo(response.data);
            if (response.data.status === 'connected') {
                onConnected();
            }
        } catch (error) {
            console.error('Error checking status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async () => {
        setConnecting(true);
        try {
            await api.post('/webhook/whatsapp/connect');
            // Esperar un poco y luego verificar el estado
            setTimeout(checkStatus, 2000);
        } catch (error) {
            console.error('Error connecting:', error);
            alert('Error al iniciar conexión');
        } finally {
            setConnecting(false);
        }
    };

    useEffect(() => {
        checkStatus();
        // Verificar estado cada 5 segundos si no está conectado
        const interval = setInterval(() => {
            if (!botInfo || botInfo.status !== 'connected') {
                checkStatus();
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [botInfo]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#064A6F] mx-auto mb-4"></div>
                    <p className="text-[#064A6F] font-medium">Verificando estado del bot...</p>
                </div>
            </div>
        );
    }

    if (botInfo?.status === 'connected') {
        // Redirigir al dashboard si ya está conectado
        window.location.href = '/';
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                <div className="text-center mb-8">
                    <div className="mx-auto h-16 w-16 bg-[#A7CF3B] rounded-full flex items-center justify-center mb-4">
                        <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-[#064A6F] mb-2">Conectar WhatsApp</h1>
                    <p className="text-gray-600">Conecta tu chatbot universitario con WhatsApp</p>
                </div>

                {botInfo?.qr && (
                    <div className="text-center mb-6">
                        <p className="text-sm text-gray-600 mb-4">Escanea este código QR con WhatsApp:</p>
                        <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(botInfo.qr)}`}
                                alt="QR Code"
                                className="w-48 h-48"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Abre WhatsApp → Menú → WhatsApp Web → Escanear código
                        </p>
                    </div>
                )}

                {!botInfo?.qr && botInfo?.status !== 'connecting' && (
                    <div className="text-center mb-6">
                        <button
                            onClick={handleConnect}
                            disabled={connecting}
                            className="bg-[#A7CF3B] hover:bg-[#96BF2D] disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center mx-auto"
                        >
                            {connecting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Conectando...
                                </>
                            ) : (
                                'Iniciar Conexión'
                            )}
                        </button>
                    </div>
                )}

                <div className="text-center text-sm text-gray-500">
                    <p>Una vez conectado, podrás gestionar leads y respuestas automáticamente.</p>
                </div>
            </div>
        </div>
    );
}