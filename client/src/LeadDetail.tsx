import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useChat } from './context/ChatContext';
import api from './api';
import axios from 'axios';
import { toCommandSlug } from './utils/normalizeTitle';

interface QuickReply {
    id: string;
    title: string;
    content: string;
    category: string;
}

export default function LeadDetail() {
    const { id } = useParams();
    const { joinRoom, leaveRoom, sendMessage, messages: realtimeMessages } = useChat();
    const [lead, setLead] = useState<any>(null);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
    const [showQuickReplies, setShowQuickReplies] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [quickReplySuggestions, setQuickReplySuggestions] = useState<QuickReply[]>([]);

    useEffect(() => {
        if (!id) return;

        // Fetch lead data
        api.get(`/leads/${id}`).then(res => {
            setLead(res.data);
        });

        // Join WebSocket room
        joinRoom(id);

        // Fetch quick replies
        fetchQuickReplies();

        return () => {
            leaveRoom();
        };
    }, [id]);

    useEffect(() => {
        // Scroll to bottom when new messages arrive
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [lead?.interactions, realtimeMessages]);

    const fetchQuickReplies = async () => {
        try {
            const response = await axios.get('http://localhost:3000/chat/quick-replies');
            setQuickReplies(response.data);
        } catch (error) {
            console.error('Error fetching quick replies:', error);
        }
    };

    const fetchSuggestions = async () => {
        setLoadingSuggestions(true);
        try {
            const response = await axios.get(`http://localhost:3000/chat/suggest/${id}`);
            setSuggestions(response.data.suggestions || []);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const handleSend = async () => {
        console.log('handleSend called with input:', input, 'handover:', lead.isHandoverActive);
        if (!input.trim() || !id) return;

        setLoading(true);
        try {
            console.log('Calling sendMessage...');
            await sendMessage(input);
            console.log('Message sent successfully');
            setInput('');
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Error al enviar mensaje');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickReply = (content: string) => {
        setInput(content);
        setShowQuickReplies(false);
    };

    const handleSuggestion = (suggestion: string) => {
        setInput(suggestion);
        setSuggestions([]);
    };

    const getQuickReplySuggestions = (query: string): QuickReply[] => {
    if (!query.trim()) return [];

    const normalizedQuery = toCommandSlug(query);  // ← Usamos tu función existente

    return quickReplies
        .filter(qr => {
        const normalizedTitle = toCommandSlug(qr.title); // ← y aquí también
        return normalizedTitle.startsWith(normalizedQuery);
        })
        .slice(0, 6); // límite razonable
    };

    if (!lead) return <div>Cargando...</div>;

    // Extract phone number for display
    const phoneDisplay = lead.phone.replace('@s.whatsapp.net', '').replace('@lid', '').split(':')[0];

    return (
        <div className="h-[80vh] flex flex-col">
            <div className="bg-white shadow px-4 py-5 sm:px-6 mb-4 flex justify-between items-center">
                <div>
                    <h3 className="text-xl leading-6 font-bold text-[#064A6F]">
                        Chat con {phoneDisplay}
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">{lead.fullName} - {lead.careerInterest}</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`mr-2 text-sm font-medium ${lead.isHandoverActive ? 'text-red-600' : 'text-[#064A6F]'}`}>
                        {lead.isHandoverActive ? 'Asesor Activo' : 'Bot Activo'}
                    </span>
                    <button
                        onClick={async () => {
                            await api.patch(`/leads/${id}/handover`, { status: !lead.isHandoverActive });
                            setLead({ ...lead, isHandoverActive: !lead.isHandoverActive });
                        }}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#064A6F] ${lead.isHandoverActive ? 'bg-red-600' : 'bg-[#A7CF3B]'}`}
                    >
                        <span className="sr-only">Cambiar modo</span>
                        <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${lead.isHandoverActive ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 border rounded-lg space-y-4 mb-4">
                {lead.interactions?.map((interaction: any) => (
                    <div key={interaction.id} className={`flex ${interaction.direction === 'INBOUND' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${interaction.direction === 'INBOUND' ? 'bg-white border border-gray-200' : 'bg-[#A7CF3B] bg-opacity-20 border border-[#A7CF3B]'}`}>
                            <div className="text-sm text-gray-900">{interaction.content}</div>
                            <div className="text-xs text-gray-400 mt-1 flex justify-between">
                                <span>{new Date(interaction.createdAt).toLocaleTimeString()}</span>
                                {interaction.templateKey && <span className="ml-2 font-mono text-[10px]">{interaction.templateKey}</span>}
                            </div>
                        </div>
                    </div>
                ))}
                {realtimeMessages.map((msg, idx) => (
                    <div key={`realtime-${idx}`} className={`flex ${msg.direction === 'INBOUND' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${msg.direction === 'INBOUND' ? 'bg-white border border-gray-200' : 'bg-[#A7CF3B] bg-opacity-20 border border-[#A7CF3B]'}`}>
                            <div className="text-sm text-gray-900">{msg.content}</div>
                            <div className="text-xs text-gray-400 mt-1 flex justify-between">
                                <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                    <p className="text-sm font-semibold mb-2">Sugerencias de IA:</p>
                    <div className="flex flex-wrap gap-2">
                        {suggestions.map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSuggestion(suggestion)}
                                className="bg-white border border-yellow-300 px-3 py-1 rounded-full text-sm hover:bg-yellow-100"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Area - Only enabled when handover is active */}
            <div className={`bg-white rounded-lg shadow-md p-4 ${!lead.isHandoverActive ? 'opacity-50' : ''}`}>
                {lead.isHandoverActive && (
                    <div className="flex gap-2 mb-2">
                        <button
                            onClick={() => setShowQuickReplies(!showQuickReplies)}
                            className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                        >
                            Respuestas Rápidas
                        </button>
                        <button
                            onClick={fetchSuggestions}
                            disabled={loadingSuggestions}
                            className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 text-sm"
                        >
                            {loadingSuggestions ? 'Cargando...' : 'Sugerencias IA'}
                        </button>
                    </div>
                )}

                {showQuickReplies && lead.isHandoverActive && (
                    <div className="mb-3 p-3 bg-gray-50 rounded max-h-40 overflow-y-auto">
                        {quickReplies.length === 0 ? (
                            <p className="text-sm text-gray-500">No hay respuestas rápidas disponibles</p>
                        ) : (
                            quickReplies.map((qr) => (
                                <button
                                    key={qr.id}
                                    onClick={() => handleQuickReply(qr.content)}
                                    className="block w-full text-left px-3 py-2 hover:bg-gray-200 rounded mb-1"
                                >
                                    <span className="font-semibold text-sm">{qr.title}</span>
                                    <p className="text-xs text-gray-600">{qr.content.substring(0, 50)}...</p>
                                </button>
                            ))
                        )}
                    </div>
                )}

                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <textarea
                            value={input}
                            onChange={(e) => {
                            const newValue = e.target.value;
                            setInput(newValue);

                            // Solo procesamos si hay un / en el texto
                            if (newValue.includes('/')) {
                                // Tomamos lo que está después del ÚLTIMO /
                                const parts = newValue.split('/');
                                const currentQuery = parts[parts.length - 1].trim();

                                if (currentQuery) {
                                const matches = getQuickReplySuggestions(currentQuery);
                                setQuickReplySuggestions(matches);
                                } else {
                                setQuickReplySuggestions([]);
                                }
                            } else {
                                setQuickReplySuggestions([]);
                            }
                            }}
                            onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey && lead.isHandoverActive) {
                                e.preventDefault();
                                if (quickReplySuggestions.length > 0) {
                                    // Seleccionar la primera sugerencia
                                    const firstSuggestion = quickReplySuggestions[0];
                                    setInput(firstSuggestion.content.trim());
                                    setQuickReplySuggestions([]);
                                } else {
                                    handleSend();
                                }
                            }
                            }}
                            placeholder={lead.isHandoverActive ? "Escribe tu mensaje... (usa / para respuestas rápidas)" : "Activa el modo Asesor para enviar mensajes"}
                            disabled={!lead.isHandoverActive}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            rows={2}
                        />

                        {/* Dropdown de sugerencias */}
                        {quickReplySuggestions.length > 0 && lead.isHandoverActive && (
                            <div className="absolute bottom-full left-0 w-full mb-2 bg-white border border-gray-300 rounded-lg shadow-xl max-h-64 overflow-y-auto z-10">
                            {quickReplySuggestions.map((qr) => (
                                <button
                                key={qr.id}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                                onClick={() => {
                                    setInput(qr.content.trim());
                                    setQuickReplySuggestions([]); // cerramos sugerencias
                                }}
                                >
                                <div className="font-medium text-[#064A6F]">/{qr.title}</div>
                                <div className="text-xs text-gray-600 truncate">
                                    {qr.content.substring(0, 60)}...
                                </div>
                                </button>
                            ))}
                            </div>
                        )}
                        </div>
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim() || !lead.isHandoverActive}
                        className="px-6 py-2 bg-[#064A6F] text-white rounded hover:bg-[#053a56] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Enviando...' : 'Enviar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
