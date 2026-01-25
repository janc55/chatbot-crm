import { useEffect, useState, useMemo } from 'react';
import api from './api';
import toast from 'react-hot-toast';

export default function Templates() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>({});
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedCareer, setSelectedCareer] = useState<string>('all');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [newTemplate, setNewTemplate] = useState<any>({
        key: '',
        category: '',
        content: '',
        attachments: '',
        followUpSuggested: false,
    });

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = () => api.get('/templates').then(res => setTemplates(res.data));

    // Extraer carrera del key del template (ej: "brochure_medicina" -> "medicina")
    const extractCareer = (key: string): string | null => {
        const parts = key.split('_');
        if (parts.length > 1) {
            return parts[parts.length - 1];
        }
        return null;
    };

    // Obtener categorías únicas
    const categories = useMemo(() => {
        const cats = new Set(templates.map(tpl => tpl.category));
        return Array.from(cats).sort();
    }, [templates]);

    // Obtener carreras únicas
    const careers = useMemo(() => {
        const carrs = new Set<string>();
        templates.forEach(tpl => {
            const career = extractCareer(tpl.key);
            if (career) {
                carrs.add(career);
            }
        });
        return Array.from(carrs).sort();
    }, [templates]);

    // Filtrar templates según los filtros seleccionados
    const filteredTemplates = useMemo(() => {
        return templates.filter(tpl => {
            const categoryMatch = selectedCategory === 'all' || tpl.category === selectedCategory;
            const career = extractCareer(tpl.key);
            const careerMatch = selectedCareer === 'all' || career === selectedCareer;
            return categoryMatch && careerMatch;
        });
    }, [templates, selectedCategory, selectedCareer]);

    // Formatear nombres de carrera para mostrar
    const formatCareerName = (career: string): string => {
        return career.charAt(0).toUpperCase() + career.slice(1).replace(/_/g, ' ');
    };

    // Formatear nombres de categoría para mostrar
    const formatCategoryName = (category: string): string => {
        return category.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const handleEdit = (tpl: any) => {
        setEditingId(tpl.id);
        setEditForm({ ...tpl });
    };

    const handleSave = async () => {
        try {
            await api.patch(`/templates/${editingId}`, { content: editForm.content });
            setEditingId(null);
            loadTemplates();
            toast.success('Template actualizado correctamente', {
                icon: '✅',
            });
        } catch (error) {
            toast.error('Error al actualizar el template');
        }
    };

    const handleCreate = async () => {
        // Validación mínima en cliente
        if (!newTemplate.key.trim() || !newTemplate.category.trim() || !newTemplate.content.trim()) {
            toast.error('Por favor completa al menos: key, categoría y contenido.', {
                icon: '⚠️',
            });
            return;
        }

        try {
            await api.post('/templates', {
                key: newTemplate.key.trim(),
                category: newTemplate.category.trim(),
                content: newTemplate.content.trim(),
                attachments: newTemplate.attachments?.trim() || null,
                followUpSuggested: !!newTemplate.followUpSuggested,
            });

            // Limpiar formulario y recargar lista
            setNewTemplate({
                key: '',
                category: '',
                content: '',
                attachments: '',
                followUpSuggested: false,
            });
            setIsModalOpen(false);
            loadTemplates();
            toast.success('Template guardado correctamente', {
                icon: '🎉',
            });
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Error al guardar el template';
            toast.error(errorMessage, {
                icon: '❌',
            });
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        // Limpiar formulario al cerrar
        setNewTemplate({
            key: '',
            category: '',
            content: '',
            attachments: '',
            followUpSuggested: false,
        });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-4xl font-bold leading-tight text-[#064A6F] mb-2">Templates</h1>
                    <p className="text-gray-600 mb-6">Gestión de plantillas de mensajes</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-[#064A6F] bg-[#A7CF3B] hover:bg-[#b8d85a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#A7CF3B]"
                >
                    + Nuevo Template
                </button>
            </div>

            {/* Modal para crear nuevo template */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={handleCloseModal}>
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">Crear nuevo template</h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                            Usa una <span className="font-mono">key</span> descriptiva, por ejemplo <span className="font-mono">brochure_medicina</span> o <span className="font-mono">costos_derecho</span>.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
                                <input
                                    type="text"
                                    value={newTemplate.key}
                                    onChange={e => setNewTemplate({ ...newTemplate, key: e.target.value })}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#064A6F] focus:border-[#064A6F] sm:text-sm"
                                    placeholder="brochure_medicina"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                                <select
                                    value={newTemplate.category}
                                    onChange={e => setNewTemplate({ ...newTemplate, category: e.target.value })}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#064A6F] focus:border-[#064A6F] sm:text-sm"
                                >
                                    <option value="">Selecciona una categoría</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>
                                            {formatCategoryName(cat)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contenido</label>
                            <textarea
                                rows={4}
                                value={newTemplate.content}
                                onChange={e => setNewTemplate({ ...newTemplate, content: e.target.value })}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Texto completo que se enviará al lead..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Attachments (opcional)</label>
                                <input
                                    type="text"
                                    value={newTemplate.attachments}
                                    onChange={e => setNewTemplate({ ...newTemplate, attachments: e.target.value })}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#064A6F] focus:border-[#064A6F] sm:text-sm"
                                    placeholder='Ej: ["assets/medicina.pdf"] o URL'
                                />
                            </div>
                            <div className="flex items-center mt-4 md:mt-7">
                                <input
                                    id="follow-up-suggested"
                                    type="checkbox"
                                    checked={newTemplate.followUpSuggested}
                                    onChange={e => setNewTemplate({ ...newTemplate, followUpSuggested: e.target.checked })}
                                    className="h-4 w-4 text-[#064A6F] border-gray-300 rounded"
                                />
                                <label htmlFor="follow-up-suggested" className="ml-2 block text-sm text-gray-700">
                                    Activar seguimiento sugerido
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={handleCloseModal}
                                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreate}
                                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-[#064A6F] bg-[#A7CF3B] hover:bg-[#b8d85a]"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Filtros */}
            <div className="mb-6 bg-white shadow sm:rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-2">
                            Filtrar por Categoría
                        </label>
                        <select
                            id="category-filter"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                            <option value="all">Todas las categorías</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>
                                    {formatCategoryName(cat)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="career-filter" className="block text-sm font-medium text-gray-700 mb-2">
                            Filtrar por Carrera
                        </label>
                        <select
                            id="career-filter"
                            value={selectedCareer}
                            onChange={(e) => setSelectedCareer(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                            <option value="all">Todas las carreras</option>
                            {careers.map(career => (
                                <option key={career} value={career}>
                                    {formatCareerName(career)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                {(selectedCategory !== 'all' || selectedCareer !== 'all') && (
                    <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                            Mostrando {filteredTemplates.length} de {templates.length} templates
                        </span>
                        <button
                            onClick={() => {
                                setSelectedCategory('all');
                                setSelectedCareer('all');
                            }}
                            className="text-sm text-[#064A6F] hover:text-[#0a5a87] font-medium"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                )}
            </div>

            {/* Grid de Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Botón "Create from Scratch" dinámico */}
                <div
                    onClick={() => setIsModalOpen(true)}
                    className="border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center p-12 hover:border-[#A7CF3B] hover:bg-white transition-all cursor-pointer group"
                >
                    <div className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center mb-4 group-hover:border-[#A7CF3B]">
                        <span className="text-2xl text-gray-400 group-hover:text-[#A7CF3B]">+</span>
                    </div>
                    <span className="text-gray-500 font-semibold group-hover:text-[#064A6F]">Create from Scratch</span>
                </div>

                {filteredTemplates.map(tpl => (
                    <div key={tpl.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col h-full hover:shadow-xl transition-shadow relative group">
                        {/* Header de la Card */}
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <svg className="w-6 h-6 text-[#064A6F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>
                            <span className={`flex items-center text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${tpl.followUpSuggested ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full mr-2 ${tpl.followUpSuggested ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                {tpl.followUpSuggested ? 'Live' : 'Draft'}
                            </span>
                        </div>

                        {/* Contenido */}
                        <div className="flex-grow">
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{tpl.key}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 italic">
                                "{tpl.content}"
                            </p>
                        </div>

                        {/* Footer de la Card */}
                        <div className="mt-8 pt-4 border-t border-gray-50 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                                {formatCategoryName(tpl.category)}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(tpl)}
                                    className="p-2 text-gray-400 hover:text-[#064A6F] hover:bg-gray-50 rounded-lg transition-all"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                                <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* Overlay de Edición Rápida (Solo si está editando) */}
                        {editingId === tpl.id && (
                            <div className="absolute inset-0 bg-white rounded-3xl z-10 p-6 flex flex-col">
                                <textarea
                                    className="w-full flex-grow p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#A7CF3B] outline-none text-sm mb-4"
                                    value={editForm.content}
                                    onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                                />
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setEditingId(null)} className="px-4 py-2 text-xs font-bold text-gray-400">Cancel</button>
                                    <button onClick={handleSave} className="px-4 py-2 bg-[#A7CF3B] text-[#064A6F] rounded-xl text-xs font-bold">Save Changes</button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
