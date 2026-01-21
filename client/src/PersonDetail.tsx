import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useChat } from './context/ChatContext';
import api from './api';
import { toCommandSlug } from './utils/normalizeTitle';

interface QuickReply {
    id: string;
    title: string;
    content: string;
    category: string;
}

export default function PersonDetail() {
    const { id } = useParams();
    const { joinRoom, leaveRoom, sendMessage, messages: realtimeMessages } = useChat();
    const [person, setPerson] = useState<any>(null);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
    const [showQuickReplies, setShowQuickReplies] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [quickReplySuggestions, setQuickReplySuggestions] = useState<QuickReply[]>([]);

    // CRM states
    const [stages, setStages] = useState<any[]>([]);
    const [allTags, setAllTags] = useState<any[]>([]);
    const [notes, setNotes] = useState<any[]>([]);
    const [newNote, setNewNote] = useState('');

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        if (!id) return;

        // Fetch person data
        api.get(`/persons/${id}`).then(res => {
            setPerson(res.data);
            setNotes(res.data.notes || []);
        });

        // Join WebSocket room
        joinRoom(id);

        // Fetch support data
        fetchQuickReplies();
        fetchStages();
        fetchTags();

        return () => {
            leaveRoom();
        };
    }, [id]);

    const fetchStages = async () => {
        try {
            const res = await api.get('/pipeline-stages');
            setStages(res.data);
        } catch (error) { console.error(error); }
    };

    const fetchTags = async () => {
        try {
            const res = await api.get('/tags');
            setAllTags(res.data);
        } catch (error) { console.error(error); }
    };

    const handleUpdateStage = async (stageId: string) => {
        try {
            await api.patch(`/persons/${id}/pipeline-stage`, { stageId });
            const updated = await api.get(`/persons/${id}`);
            setPerson(updated.data);
        } catch (error) { console.error(error); }
    };

    const handleToggleTag = async (tagId: string, isAttached: boolean) => {
        try {
            if (isAttached) {
                await api.delete(`/tags/${tagId}/detach/${id}`);
            } else {
                await api.post(`/tags/${tagId}/attach/${id}`);
            }
            const updated = await api.get(`/persons/${id}`);
            setPerson(updated.data);
        } catch (error) { console.error(error); }
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;

        try {
            await api.post('/notes', { personId: id, content: newNote });
            const res = await api.get(`/notes/person/${id}`);
            setNotes(res.data);
            setNewNote('');
        } catch (error) {
            console.error('Error al guardar nota:', error);
        }
    };

    useEffect(() => {
        // Scroll to bottom when new messages arrive
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [person?.interactions, realtimeMessages]);

    const fetchQuickReplies = async () => {
        try {
            const response = await api.get('/chat/quick-replies');
            setQuickReplies(response.data);
        } catch (error) {
            console.error('Error fetching quick replies:', error);
        }
    };

    const fetchSuggestions = async () => {
        setLoadingSuggestions(true);
        try {
            const response = await api.get(`/chat/suggest/${id}`);
            setSuggestions(response.data.suggestions || []);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || !id) return;

        setLoading(true);
        try {
            await sendMessage(input);
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
        const normalizedQuery = toCommandSlug(query);
        return quickReplies
            .filter(qr => toCommandSlug(qr.title).startsWith(normalizedQuery))
            .slice(0, 6);
    };

    if (!person) return <div>Cargando...</div>;

    const phoneDisplay = person.phone.replace('@s.whatsapp.net', '').replace('@lid', '').split(':')[0];

    return (
        <div className="flex flex-row gap-6 h-[85vh] overflow-hidden relative">
            {/* Botón Flotante para reabrir Sidebar (solo visible si está cerrado) */}
            {!isSidebarOpen && (
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="absolute right-0 top-4 z-50 bg-[#064A6F] text-white p-2 rounded-l-lg shadow-lg hover:bg-[#053d5c] transition-all"
                >
                    <span className="material-symbols-outlined">menu_open</span>
                </button>
            )}
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <div className="bg-white shadow px-4 py-5 sm:px-6 mb-4 flex justify-between items-center rounded-xl border border-gray-100">
                    <div>
                        <h3 className="text-xl leading-6 font-bold text-[#064A6F] flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#A7CF3B]">chat</span>
                            Chat con {phoneDisplay}
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">{person.fullName || 'Sin nombre'} - {person.careerInterest}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`text-sm font-semibold ${person.isHandoverActive ? 'text-red-600' : 'text-[#064A6F]'}`}>
                            {person.isHandoverActive ? 'Asesor Activo' : 'Bot Activo'}
                        </span>
                        <button
                            onClick={async () => {
                                await api.patch(`/persons/${id}/handover`, { status: !person.isHandoverActive });
                                setPerson({ ...person, isHandoverActive: !person.isHandoverActive });
                            }}
                            className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#064A6F] ${person.isHandoverActive ? 'bg-red-600' : 'bg-[#A7CF3B]'}`}
                        >
                            <span className="sr-only">Cambiar modo</span>
                            <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${person.isHandoverActive ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-white border border-gray-100 rounded-xl space-y-4 mb-4 shadow-sm">
                    {person.interactions?.map((interaction: any) => (
                        <div key={interaction.id} className={`flex ${interaction.direction === 'INBOUND' ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl shadow-sm ${interaction.direction === 'INBOUND' ? 'bg-gray-100 text-gray-800' : 'bg-[#064A6F] text-white'}`}>
                                <div className="text-sm whitespace-pre-wrap">{interaction.content}</div>
                                <div className={`text-[10px] mt-1 flex justify-between gap-4 ${interaction.direction === 'INBOUND' ? 'text-gray-400' : 'text-blue-100'}`}>
                                    <span>{new Date(interaction.createdAt).toLocaleTimeString()}</span>
                                    {interaction.templateKey && <span className="font-mono">{interaction.templateKey}</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                    {realtimeMessages.map((msg, idx) => (
                        <div key={`realtime-${idx}`} className={`flex ${msg.direction === 'INBOUND' ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl shadow-sm ${msg.direction === 'INBOUND' ? 'bg-gray-100 text-gray-800' : 'bg-[#064A6F] text-white'}`}>
                                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                                <div className={`text-[10px] mt-1 ${msg.direction === 'INBOUND' ? 'text-gray-400' : 'text-blue-100'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 ${!person.isHandoverActive ? 'opacity-50' : ''}`}>
                    {person.isHandoverActive && (
                        <div className="flex gap-2 mb-3">
                            <button onClick={() => setShowQuickReplies(!showQuickReplies)} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-xs font-medium">Respuestas Rápidas</button>
                            <button onClick={fetchSuggestions} disabled={loadingSuggestions} className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50 text-xs font-medium">Sugerencias IA</button>
                        </div>
                    )}

                    {suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {suggestions.map((s, i) => (
                                <button key={i} onClick={() => handleSuggestion(s)} className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded border border-purple-100 hover:bg-purple-100">{s}</button>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2 relative">
                        <textarea
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                if (e.target.value.includes('/')) {
                                    const parts = e.target.value.split('/');
                                    const q = parts[parts.length - 1].trim();
                                    setQuickReplySuggestions(q ? getQuickReplySuggestions(q) : []);
                                } else { setQuickReplySuggestions([]); }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey && person.isHandoverActive) {
                                    e.preventDefault();
                                    if (quickReplySuggestions.length > 0) {
                                        setInput(quickReplySuggestions[0].content);
                                        setQuickReplySuggestions([]);
                                    } else { handleSend(); }
                                }
                            }}
                            placeholder={person.isHandoverActive ? "Escribe un mensaje... (usa /)" : "Inicia intervención para escribir"}
                            disabled={!person.isHandoverActive}
                            className="flex-1 border-gray-200 rounded-lg p-3 text-sm focus:ring-[#064A6F] focus:border-[#064A6F] h-20 resize-none"
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading || !input.trim() || !person.isHandoverActive}
                            className="bg-[#064A6F] text-white px-6 rounded-lg font-medium hover:bg-[#053d5c] disabled:opacity-50 h-20"
                        >
                            {loading ? '...' : 'Enviar'}
                        </button>

                        {quickReplySuggestions.length > 0 && (
                            <div className="absolute bottom-full left-0 w-full mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                                {quickReplySuggestions.map(qr => (
                                    <button key={qr.id} onClick={() => handleQuickReply(qr.content)} className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                                        <div className="text-xs font-bold text-[#064A6F]">/{qr.title}</div>
                                        <div className="text-xs text-gray-500 truncate">{qr.content}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sidebar CRM Section - DESPLEGABLE */}
            <div
                className={`transition-all duration-300 ease-in-out border-l border-gray-100 bg-gray-50/30 px-4 overflow-y-auto
                ${isSidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}
            >
                <div className="min-w-[280px] py-2 space-y-6">
                    {/* Botón para cerrar */}
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Panel CRM</h4>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>

                    {/* Status & Lifecycle */}
                    <section className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Información del CRM</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Tipo de Persona</label>
                                <div className="flex gap-2">
                                    <span className={`flex-1 text-center py-2 rounded-lg text-[10px] font-bold transition-colors ${person.type === 'LEAD' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>LEAD</span>
                                    <span className={`flex-1 text-center py-2 rounded-lg text-[10px] font-bold transition-colors ${person.type === 'CONTACT' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400'}`}>CONTACT</span>
                                    <span className={`flex-1 text-center py-2 rounded-lg text-[10px] font-bold transition-colors ${person.type === 'CUSTOMER' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'}`}>CUSTOMER</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Etapa del Pipeline</label>
                                <div className="relative">
                                    <select
                                        value={person.pipelineStageId || ''}
                                        onChange={(e) => handleUpdateStage(e.target.value)}
                                        className="w-full appearance-none bg-white border border-gray-200 rounded-lg py-2 px-4 pr-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all cursor-pointer"
                                    >
                                        <option value="">Sin etapa</option>
                                        {stages.map(s => (
                                            <option key={s.id} value={s.id}>{s.displayName}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                        <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">
                                    Calidad (Lead Score)
                                </label>
                                <div className="flex gap-1">
                                    {['COLD', 'WARM', 'HOT'].map((q) => {
                                        // Definimos los colores según la calidad
                                        const isSelected = person.quality === q;

                                        const baseClasses = "flex-1 py-2 rounded text-[10px] font-bold border transition-all";

                                        let bgColor = "";
                                        let borderColor = "";
                                        let textColor = "";

                                        if (q === 'COLD') {
                                            bgColor = isSelected ? 'bg-blue-100' : 'bg-white';
                                            borderColor = isSelected ? 'border-blue-300' : 'border-gray-200';
                                            textColor = isSelected ? 'text-blue-700' : 'text-gray-500';
                                        } else if (q === 'WARM') {
                                            bgColor = isSelected ? 'bg-orange-100' : 'bg-white';
                                            borderColor = isSelected ? 'border-orange-300' : 'border-gray-200';
                                            textColor = isSelected ? 'text-orange-700' : 'text-gray-500';
                                        } else if (q === 'HOT') {
                                            bgColor = isSelected ? 'bg-red-100' : 'bg-white';
                                            borderColor = isSelected ? 'border-red-300' : 'border-gray-200';
                                            textColor = isSelected ? 'text-red-700' : 'text-gray-500';
                                        }

                                        return (
                                            <button
                                                key={q}
                                                onClick={() =>
                                                    api
                                                        .patch(`/persons/${id}/quality`, { quality: q })
                                                        .then(() => api.get(`/persons/${id}`).then((r) => setPerson(r.data)))
                                                }
                                                className={`${baseClasses} ${bgColor} ${borderColor} ${textColor} hover:bg-opacity-80`}
                                            >
                                                {q}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Tags Management - CORREGIDA */}
                    <section className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Etiquetas</h4>
                        <div className="flex flex-wrap gap-2">
                            {person.tags?.map((pt: any) => (
                                <span key={pt.tag.id} className="inline-flex items-center bg-[#064A6F] text-white text-[10px] px-3 py-1 rounded-full group">
                                    {pt.tag.name}
                                    <button onClick={() => handleToggleTag(pt.tag.id, true)} className="ml-1 opacity-60 hover:opacity-100">×</button>
                                </span>
                            ))}
                        </div>
                        <div className="relative">
                            <select
                                onChange={(e) => e.target.value && handleToggleTag(e.target.value, false)}
                                className="w-full appearance-none bg-white border border-gray-200 rounded-lg py-2 px-4 pr-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all cursor-pointer"
                                value=""
                            >
                                <option value="">Agregar etiqueta...</option>
                                {allTags.filter(t => !person.tags?.some((pt: any) => pt.tagId === t.id)).map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                                <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                        </div>
                    </section>

                    {/* Internal Notes - CORREGIDA */}
                    <section className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex-1 flex flex-col min-h-[350px]">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Notas Internas</h4>

                        <div className="space-y-3 overflow-y-auto max-h-48 mb-6 pr-2">
                            {notes.map(note => (
                                <div key={note.id} className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                                    <p className="text-xs text-gray-700 whitespace-pre-wrap">{note.content}</p>
                                    <div className="text-[9px] text-gray-400 mt-2 flex justify-between">
                                        <span className="font-bold">{note.author?.fullName}</span>
                                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                            {notes.length === 0 && <p className="text-sm text-gray-400 italic text-center py-4">No hay notas todavía</p>}
                        </div>

                        <div className="mt-auto space-y-3">
                            <textarea
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="Nueva nota interna..."
                                className="w-full text-sm border-2 border-gray-800 rounded-xl px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none transition-all"
                                rows={3}
                            />
                            <button
                                onClick={handleAddNote}
                                disabled={!newNote.trim()}
                                className={`w-full py-3 rounded-lg text-sm font-bold transition-all shadow-sm ${!newNote.trim()
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-70'
                                        : 'bg-[#064A6F] text-white hover:bg-[#053d5c] active:scale-[0.98]'
                                    }`}
                            >
                                Guardar Nota
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
