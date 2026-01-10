import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from './context/ChatContext';
import axios from 'axios';

interface Message {
    id: string;
    direction: 'INBOUND' | 'OUTBOUND';
    content: string;
    createdAt: string;
    messageType: string;
}

interface QuickReply {
    id: string;
    title: string;
    content: string;
    category: string;
}

const Chat: React.FC = () => {
    const { leadId } = useParams<{ leadId: string }>();
    const navigate = useNavigate();
    const { joinRoom, leaveRoom, sendMessage, messages: realtimeMessages } = useChat();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
    const [showQuickReplies, setShowQuickReplies] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [quickReplySuggestions, setQuickReplySuggestions] = useState<QuickReply[]>([]);

    useEffect(() => {
        if (!leadId) return;

        // Join WebSocket room
        joinRoom(leadId);

        // Fetch conversation history
        fetchHistory();

        // Fetch quick replies
        fetchQuickReplies();

        return () => {
            leaveRoom();
        };
    }, [leadId]);

    useEffect(() => {
        // Append realtime messages to the list
        if (realtimeMessages.length > 0) {
            const newMessages = realtimeMessages.map((msg, idx) => ({
                id: `realtime-${idx}`,
                direction: msg.direction,
                content: msg.content,
                createdAt: msg.createdAt.toString(),
                messageType: msg.messageType,
            }));
            setMessages((prev) => [...prev, ...newMessages]);
        }
    }, [realtimeMessages]);

    const fetchHistory = async () => {
        try {
            const response = await axios.get(`http://localhost:3000/chat/history/${leadId}`);
            setMessages(response.data);
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

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
            const response = await axios.get(`http://localhost:3000/chat/suggest/${leadId}`);
            setSuggestions(response.data.suggestions || []);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        setLoading(true);
        try {
            await sendMessage(input);
            setInput('');
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
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

    const normalizeForSearch = (text: string) => {
        return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9-]/g, "");
    };

    const getQuickReplySuggestions = (query: string) => {
        if (!query) return [];

        const normalizedQuery = normalizeForSearch(query);

        return quickReplies
        .filter(qr => {
            const normalizedTitle = normalizeForSearch(qr.title);
            return normalizedTitle.startsWith(normalizedQuery);
        })
        .slice(0, 8);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/leads')}
                        className="text-blue-600 hover:text-blue-800"
                    >
                        ← Back to Leads
                    </button>
                    <h1 className="text-2xl font-bold">Chat - Lead {leadId?.substring(0, 8)}</h1>
                </div>

                {/* Messages */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-4 h-96 overflow-y-auto">
                    {messages.length === 0 ? (
                        <p className="text-gray-500 text-center">No messages yet</p>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`mb-3 flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-xs px-4 py-2 rounded-lg ${msg.direction === 'OUTBOUND'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200 text-gray-800'
                                        }`}
                                >
                                    <p>{msg.content}</p>
                                    <p className="text-xs mt-1 opacity-70">
                                        {new Date(msg.createdAt).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Suggestions */}
                {suggestions.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <p className="text-sm font-semibold mb-2">AI Suggestions:</p>
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

                {/* Input */}
                <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex gap-2 mb-2">
                        <button
                            onClick={() => setShowQuickReplies(!showQuickReplies)}
                            className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                        >
                            Quick Replies
                        </button>
                        <button
                            onClick={fetchSuggestions}
                            disabled={loadingSuggestions}
                            className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
                        >
                            {loadingSuggestions ? 'Loading...' : 'Get AI Suggestions'}
                        </button>
                    </div>

                    {showQuickReplies && (
                        <div className="mb-3 p-3 bg-gray-50 rounded max-h-40 overflow-y-auto">
                            {quickReplies.map((qr) => (
                                <button
                                    key={qr.id}
                                    onClick={() => handleQuickReply(qr.content)}
                                    className="block w-full text-left px-3 py-2 hover:bg-gray-200 rounded mb-1"
                                >
                                    <span className="font-semibold">{qr.title}</span>
                                    <p className="text-sm text-gray-600">{qr.content.substring(0, 50)}...</p>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <textarea
                        value={input}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            setInput(newValue);

                            // Detectamos si está escribiendo un comando
                            const lastChar = newValue.slice(-1);
                            const hasSlash = newValue.includes('/');

                            if (hasSlash) {
                            // Tomamos lo que está después del último /
                            const parts = newValue.split('/');
                            const currentQuery = parts[parts.length - 1];

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
                            if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                            }
                        }}
                        placeholder="Type your message... (escribe / para respuestas rápidas)"
                        className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        />
                        {quickReplySuggestions.length > 0 && (
                        <div 
                            className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto z-10"
                            style={{ maxWidth: 'calc(100% - 100px)' }} // ajusta según necesites
                        >
                            {quickReplySuggestions.map((qr) => (
                            <button
                                key={qr.id}
                                className="w-full text-left px-4 py-2.5 hover:bg-gray-100 border-b last:border-b-0"
                                onClick={() => {
                                // Reemplazamos desde el último / con el contenido
                                const parts = input.split('/');
                                parts[parts.length - 1] = ''; // borramos lo escrito después del /
                                const newInput = parts.join('/') + qr.content;
                                setInput(newInput);
                                setQuickReplySuggestions([]);
                                }}
                            >
                                <div className="font-medium text-[#064A6F]">/{qr.title}</div>
                                <div className="text-sm text-gray-600 truncate">
                                {qr.content.substring(0, 60)}...
                                </div>
                            </button>
                            ))}
                        </div>
                        )}
                        </div>
                        <button
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                        >
                            {loading ? 'Sending...' : 'Send'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;
