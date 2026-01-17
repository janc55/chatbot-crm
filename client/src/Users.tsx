import React, { useState, useEffect } from 'react';
import api from './api';
import toast from 'react-hot-toast';
import { UserPlusIcon, TrashIcon, UsersIcon } from '@heroicons/react/24/outline';

interface User {
    id: string;
    email: string;
    fullName: string;
    role: string;
    createdAt: string;
}

const Users: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        role: 'AGENT'
    });

    const [stats, setStats] = useState({
        used: 0,
        total: 5
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/users');
            setUsers(res.data);
            // Simular límite (en una versión real esto vendría del tenant en el login o un endpoint de config)
            setStats(prev => ({ ...prev, used: res.data.length }));
        } catch (error) {
            toast.error('Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/users', formData);
            toast.success('Usuario creado correctamente');
            setShowModal(false);
            setFormData({ email: '', password: '', fullName: '', role: 'AGENT' });
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al crear usuario');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;
        try {
            await api.delete(`/users/${id}`);
            toast.success('Usuario eliminado');
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al eliminar');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <UsersIcon className="h-8 w-8 text-[#064A6F]" />
                        Gestión de Usuarios
                    </h1>
                    <p className="text-gray-500 mt-1">Administra los accesos de tu equipo</p>
                </div>
                <div className="flex flex-col items-end">
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-[#A7CF3B] text-[#064A6F] px-4 py-2 rounded-lg font-bold hover:bg-[#96BF2D] transition-colors"
                    >
                        <UserPlusIcon className="h-5 w-5" />
                        Nuevo Usuario
                    </button>
                    <div className="mt-2 flex items-center gap-2 text-sm">
                        <span className="text-gray-600">Uso del límite:</span>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${stats.used >= stats.total ? 'bg-red-500' : 'bg-[#064A6F]'}`}
                                style={{ width: `${Math.min((stats.used / stats.total) * 100, 100)}%` }}
                            ></div>
                        </div>
                        <span className="font-medium text-gray-900">{stats.used} / {stats.total}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Creado</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">Cargando...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">No hay usuarios registrados</td></tr>
                        ) : users.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{u.fullName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-600">{u.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${u.role === 'ADMIN' ? 'bg-[#A7CF3B] text-[#064A6F]' : 'bg-gray-100 text-gray-600'}`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    <button
                                        onClick={() => handleDelete(u.id)}
                                        className="text-red-400 hover:text-red-600 px-2 py-1 transition-colors"
                                        title="Eliminar"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Crear Nuevo Usuario</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A7CF3B] focus:border-transparent outline-none"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A7CF3B] focus:border-transparent outline-none"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A7CF3B] focus:border-transparent outline-none"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A7CF3B] focus:border-transparent outline-none"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="AGENT">Agente (Consulta)</option>
                                    <option value="ADMIN">Administrador (Control Total)</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-[#064A6F] text-white rounded-lg font-medium hover:bg-[#0a5a87] transition-colors"
                                >
                                    Crear Usuario
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
