import { useEffect, useState } from 'react';
import api from './api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
    const [stats, setStats] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [botInfo, setBotInfo] = useState<any>(null);
    const [disconnecting, setDisconnecting] = useState(false);

    const handleDisconnect = async () => {
        if (!confirm('¿Estás seguro de que quieres desconectar el bot de WhatsApp? Se perderá la sesión actual.')) {
            return;
        }

        setDisconnecting(true);
        try {
            await api.post('/webhook/whatsapp/disconnect');
            // Recargar la página para volver a la pantalla de conexión
            window.location.reload();
        } catch (error) {
            console.error('Error disconnecting:', error);
            alert('Error al desconectar');
        } finally {
            setDisconnecting(false);
        }
    };

    useEffect(() => {
        api.get('/leads/stats').then(res => setStats(res.data));
        api.get('/leads/stats/history').then(res => setHistory(res.data));
        // Recupere estado de bot (GET /webhook/whatsapp/status)
        // Nota: Si el bot no está conectado, devuelve null o status disconnected
        api.get('/webhook/whatsapp/status')
            .then(res => setBotInfo(res.data))
            .catch(err => console.error("Error fetching bot info", err));
    }, []);

    if (!stats) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#064A6F] mx-auto mb-4"></div>
                    <p className="text-[#064A6F] font-medium">Cargando estadísticas...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-bold leading-tight text-[#064A6F] mb-2">Dashboard</h1>
                    <p className="text-gray-600">Resumen de actividad y estadísticas</p>
                </div>

                {botInfo ? (
                    <div className="flex items-center bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                        {botInfo.profilePicUrl ? (
                            <img
                                src={botInfo.profilePicUrl}
                                alt="Bot Profile"
                                className="h-12 w-12 rounded-full mr-3 border-2 border-[#A7CF3B] object-cover"
                            />
                        ) : (
                            <div className="h-12 w-12 rounded-full mr-3 border-2 border-[#A7CF3B] bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                                {botInfo.name ? botInfo.name[0] : 'B'}
                            </div>
                        )}
                        <div className="text-right">
                            <p className="text-sm font-bold text-[#064A6F]">{botInfo.name || 'Chatbot'}</p>
                            <p className="text-xs text-gray-500">{botInfo.phone || 'Unknown Phone'}</p>
                            <div className="flex items-center justify-between mt-1">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${botInfo.status === 'connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {botInfo.status === 'connected' ? 'ONLINE' : 'OFFLINE'}
                                </span>
                                {botInfo.status === 'connected' && (
                                    <button
                                        onClick={handleDisconnect}
                                        disabled={disconnecting}
                                        className="ml-2 px-2 py-0.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-[10px] font-semibold rounded transition-colors duration-200"
                                    >
                                        {disconnecting ? '...' : 'Desconectar'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <img
                        src="/images/nettidev.svg"
                        alt="Logo"
                        className="h-16 w-16 opacity-20"
                    />
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-[#064A6F] to-[#0a5a87] overflow-hidden shadow-lg rounded-lg transform transition-transform hover:scale-105">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-[#A7CF3B] truncate uppercase tracking-wide">Total Leads</dt>
                        <dd className="mt-2 text-4xl font-bold text-white">{stats.total}</dd>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Chart: Daily Interactions */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Interacciones Diarias</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={history}
                                margin={{
                                    top: 5,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="inbound" name="Recibidos" fill="#064A6F" />
                                <Bar dataKey="outbound" name="Enviados" fill="#A7CF3B" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chart: Leads by Career */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Leads por Carrera</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={stats.byCareer.map((c: any) => ({ name: c.careerInterest || 'Sin definir', count: c._count.careerInterest }))}
                                margin={{
                                    top: 5,
                                    right: 30,
                                    left: 40,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Bar dataKey="count" name="Interesados" fill="#064A6F" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* List: Leads by Status */}
                <div className="bg-white shadow rounded-lg p-6 lg:col-span-2">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Leads por Estado</h3>
                    <div className="overflow-hidden">
                        <ul className="divide-y divide-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {stats.byStatus.map((s: any) => (
                                <li key={s.status} className="py-4 flex justify-between border-b border-gray-200 hover:bg-gray-50 px-4 rounded transition-colors">
                                    <span className="text-sm font-medium text-[#064A6F]">{s.status}</span>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#A7CF3B] text-[#064A6F]">
                                        {s._count.status}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
