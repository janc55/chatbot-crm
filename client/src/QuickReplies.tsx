import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toCommandSlug } from './utils/normalizeTitle';

interface QuickReply {
    id: string;
    title: string;
    content: string;
    category: string;
}

interface FormData {
    title: string;
    content: string;
    category: string;
}

const QuickRepliesManager: React.FC = () => {
    const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>({ 
        title: '', 
        content: '', 
        category: 'general' 
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchQuickReplies();
    }, []);

    const fetchQuickReplies = async () => {
        try {
            const response = await axios.get('http://localhost:3000/chat/quick-replies');
            setQuickReplies(response.data);
        } catch (error) {
            console.error('Error al obtener respuestas rápidas:', error);
        }
    };

    const handleCreate = async () => {
        if (!formData.title.trim() || !formData.content.trim()) {
            alert('Por favor completa el título y contenido');
            return;
        }

        setIsSubmitting(true);
        try {
            await axios.post('http://localhost:3000/chat/quick-replies', formData);
            resetForm();
            fetchQuickReplies();
        } catch (error) {
            console.error('Error al crear respuesta rápida:', error);
            alert('Error al crear respuesta rápida');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async () => {
        if (!editingId) return;
        
        if (!formData.title.trim() || !formData.content.trim()) {
            alert('Por favor completa el título y contenido');
            return;
        }

        setIsSubmitting(true);
        try {
            await axios.put(`http://localhost:3000/chat/quick-replies/${editingId}`, formData);
            resetForm();
            fetchQuickReplies();
        } catch (error) {
            console.error('Error al actualizar respuesta rápida:', error);
            alert('Error al actualizar respuesta rápida');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta respuesta rápida?')) return;
        
        try {
            await axios.delete(`http://localhost:3000/chat/quick-replies/${id}`);
            fetchQuickReplies();
        } catch (error) {
            console.error('Error al eliminar respuesta rápida:', error);
            alert('Error al eliminar respuesta rápida');
        }
    };

    const startEditing = (qr: QuickReply) => {
        setFormData({
            title: qr.title,
            content: qr.content,
            category: qr.category
        });
        setEditingId(qr.id);
        setShowForm(true);
    };

    const resetForm = () => {
        setFormData({ title: '', content: '', category: 'general' });
        setEditingId(null);
        setShowForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingId) {
            await handleUpdate();
        } else {
            await handleCreate();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-[#064A6F]">Respuestas Rápidas</h1>
                    <button
                        onClick={() => {
                            if (showForm) {
                                resetForm();
                            } else {
                                setEditingId(null);
                                setFormData({ title: '', content: '', category: 'general' });
                                setShowForm(true);
                            }
                        }}
                        className="px-4 py-2 bg-[#A7CF3B] text-white rounded hover:bg-[#8fb32d]"
                    >
                        {showForm ? 'Cancelar' : 'Agregar Respuesta Rápida'}
                    </button>
                </div>

                {showForm && (
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">
                    {editingId ? 'Editar Respuesta Rápida' : 'Nueva Respuesta Rápida'}
                    </h2>
                    <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Título *</label>
                        <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#A7CF3B] focus:border-[#A7CF3B]"
                        placeholder="Ej: Saludo Inicial"
                        required
                        />
                        {formData.title.trim() && (
                        <p className="text-xs text-gray-500 mt-1.5">
                            Se guardará como comando: 
                            <code className="ml-1 bg-gray-100 px-1.5 py-0.5 rounded font-mono text-[#064A6F]">
                            /{toCommandSlug(formData.title)}
                            </code>
                        </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Contenido *</label>
                        <textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#A7CF3B] min-h-[100px]"
                        placeholder="Escribe el mensaje que se enviará..."
                        required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Categoría (opcional)</label>
                        <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#A7CF3B]"
                        placeholder="Ej: saludo, ventas, soporte"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full px-4 py-2.5 text-white font-medium rounded transition-colors ${
                        isSubmitting 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-[#064A6F] hover:bg-[#0a5a87]'
                        }`}
                    >
                        {isSubmitting 
                        ? 'Procesando...' 
                        : editingId 
                            ? 'Actualizar Respuesta Rápida' 
                            : 'Crear Respuesta Rápida'}
                    </button>
                    </div>
                </form>
                )}

                <div className="space-y-4">
                    {quickReplies.map((qr) => (
                        <div key={qr.id} className="bg-white rounded-lg shadow-md p-4">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-[#064A6F]">{qr.title}</h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                    Comando en chat: <code className="bg-gray-100 px-1 rounded">/{toCommandSlug(qr.title)}</code>
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">{qr.content}</p>
                                    <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-xs rounded">
                                        {qr.category}
                                    </span>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => startEditing(qr)}
                                        className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(qr.id)}
                                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default QuickRepliesManager;


