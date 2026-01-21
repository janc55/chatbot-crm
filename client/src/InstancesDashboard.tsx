import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import { useAuth } from './context/AuthContext';
import { PlusIcon, TrashIcon, QrCodeIcon, SignalIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Instance {
    id: string;
    name: string;
    status: string; // DISCONNECTED, CONNECTING, CONNECTED, QR_READY
    phoneNumber?: string;
    qrCode?: string;
}

export default function InstancesDashboard() {
    const [instances, setInstances] = useState<Instance[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();
    const [newInstanceName, setNewInstanceName] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (user) {
            fetchInstances();
        }
    }, [user]);

    const fetchInstances = async () => {
        try {
            setLoading(true);
            const response = await api.get('/webhook/whatsapp/instances');
            setInstances(response.data);
        } catch (error) {
            console.error('Error fetching instances:', error);
            toast.error('Error al cargar instancias');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateInstance = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newInstanceName.trim()) return;

        try {
            setCreating(true);
            await api.post('/webhook/whatsapp/instances', {
                name: newInstanceName
            });
            toast.success('Instancia creada');
            setNewInstanceName('');
            fetchInstances();
        } catch (error) {
            console.error('Error creating instance:', error);
            toast.error('Error al crear instancia');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta instancia? Se desconectará y perderá la sesión.')) return;
        try {
            await api.delete(`/webhook/whatsapp/instances/${id}`); // Assuming delete endpoint exists as per service logic
            toast.success('Instancia eliminada');
            fetchInstances();
        } catch (error) {
            console.error('Error deleting instance:', error);
            toast.error('Error al eliminar instancia');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONNECTED': return 'bg-green-100 text-green-800 border-green-200';
            case 'CONNECTING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'QR_READY': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#064A6F]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                <div className="md:grid md:grid-cols-3 md:gap-6">
                    <div className="md:col-span-1">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">Nueva Instancia</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Crea una nueva conexión de WhatsApp. Puedes tener múltiples números conectados dependiendo de tu plan.
                        </p>
                    </div>
                    <div className="mt-5 md:mt-0 md:col-span-2">
                        <form onSubmit={handleCreateInstance} className="grid grid-cols-6 gap-6">
                            <div className="col-span-6 sm:col-span-4">
                                <label htmlFor="instance_name" className="block text-sm font-medium text-gray-700">
                                    Nombre de la Instancia
                                </label>
                                <div className="mt-1 flex rounded-md shadow-sm">
                                    <input
                                        type="text"
                                        name="instance_name"
                                        id="instance_name"
                                        value={newInstanceName}
                                        onChange={(e) => setNewInstanceName(e.target.value)}
                                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 focus:ring-[#A7CF3B] focus:border-[#A7CF3B] sm:text-sm"
                                        placeholder="Ej. Ventas Principal"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm hover:bg-gray-100"
                                    >
                                        {creating ? 'Creando...' : <><PlusIcon className="h-5 w-5 mr-1" /> Crear</>}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Instancias Exisitentes</h3>
                </div>
                <ul className="divide-y divide-gray-200">
                    {instances.length === 0 ? (
                        <li className="px-4 py-8 text-center text-gray-500">
                            No tienes ninguna instancia de WhatsApp configurada.
                        </li>
                    ) : (
                        instances.map((instance) => (
                            <li key={instance.id}>
                                <div className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center truncate">
                                            <p className="font-medium text-[#064A6F] truncate text-lg">{instance.name}</p>
                                            <span className={`ml-3 px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(instance.status)}`}>
                                                {instance.status}
                                            </span>
                                        </div>
                                        <div className="ml-2 flex-shrink-0 flex text-gray-500 text-sm gap-2">
                                            {/* Actions */}
                                            <div className="flex space-x-2">
                                                {(instance.status === 'DISCONNECTED' || instance.status === 'QR_READY' || instance.status === 'CONNECTING') && (
                                                    <button
                                                        onClick={() => navigate(`/instances/${instance.id}/connect`)}
                                                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-[#064A6F] bg-[#A7CF3B] hover:bg-[#96BF2D]"
                                                    >
                                                        <QrCodeIcon className="h-4 w-4 mr-1" /> Conectar / Ver QR
                                                    </button>
                                                )}

                                                {(instance.status === 'CONNECTED') && (
                                                    <span className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white">
                                                        <SignalIcon className="h-4 w-4 mr-1 text-green-500" />
                                                        {instance.phoneNumber ? `(+${instance.phoneNumber})` : 'En línea'}
                                                    </span>
                                                )}

                                                <button
                                                    onClick={() => handleDelete(instance.id)}
                                                    className="inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                                                    title="Eliminar Instancia"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-2 sm:flex sm:justify-between">
                                        <div className="sm:flex">
                                            <p className="flex items-center text-sm text-gray-500">
                                                ID: <code className="ml-1 text-xs bg-gray-100 p-0.5 rounded">{instance.id}</code>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}
