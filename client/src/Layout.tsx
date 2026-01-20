import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { BellIcon, UserIcon } from '@heroicons/react/24/outline';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import api from './api';

interface HandoverAlert {
    leadId: string;
    leadPhone: string;
    leadName?: string;
    timestamp: string;
    message: string;
}

export default function Layout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // Estados para notificaciones
    const [notifications, setNotifications] = useState<HandoverAlert[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);

    const [showProfile, setShowProfile] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // Ref para cerrar al clic fuera
    const notificationRef = useRef<HTMLDivElement>(null);

    const isActive = (path: string) => location.pathname === path;

    // Fetch de notificaciones de handover
    useEffect(() => {
        if (!user) return;

        const fetchNotifications = async () => {
            try {
                const res = await api.get('/logs/handover-alerts/active');
                setNotifications(res.data);
                setUnreadCount(res.data.length);
            } catch (error) {
                console.error('Error fetching notifications:', error);
            }
        };

        fetchNotifications();

        // Polling cada 30 segundos
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [user]);

    // Cerrar dropdowns al clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfile(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString('es-ES', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleNotificationClick = (leadId: string) => {
        navigate(`/leads/${leadId}`);
        setShowNotifications(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#064A6F',
                        color: '#fff',
                    },
                    success: {
                        duration: 3000,
                        iconTheme: {
                            primary: '#A7CF3B',
                            secondary: '#064A6F',
                        },
                    },
                    error: {
                        duration: 4000,
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                        },
                    },
                }}
            />
            <nav className="bg-[#064A6F] shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-stretch">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <img
                                    src="/images/nettidev.svg"
                                    alt="Logo"
                                    className="h-10 w-10 mr-3"
                                />
                                <span className="font-bold text-xl text-white">Chatbot CRM</span>
                            </div>
                            <div className="hidden sm:ml-8 sm:flex sm:items-stretch">
                                <Link
                                    to="/"
                                    className={`flex h-full items-center justify-center px-8 text-sm font-medium transition-colors ${isActive('/')
                                        ? 'bg-[#A7CF3B] text-[#064A6F]'
                                        : 'text-white hover:bg-[#0a5a87]'
                                        }`}
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    to="/leads"
                                    className={`flex h-full items-center justify-center px-8 text-sm font-medium transition-colors ${isActive('/leads')
                                        ? 'bg-[#A7CF3B] text-[#064A6F]'
                                        : 'text-white hover:bg-[#0a5a87]'
                                        }`}
                                >
                                    Leads
                                </Link>
                                <Link
                                    to="/templates"
                                    className={`flex h-full items-center justify-center px-8 text-sm font-medium transition-colors ${isActive('/templates')
                                        ? 'bg-[#A7CF3B] text-[#064A6F]'
                                        : 'text-white hover:bg-[#0a5a87]'
                                        }`}
                                >
                                    Templates
                                </Link>
                                <Link
                                    to="/quick-replies"
                                    className={`flex h-full items-center justify-center px-8 text-sm font-medium transition-colors ${isActive('/quick-replies')
                                        ? 'bg-[#A7CF3B] text-[#064A6F]'
                                        : 'text-white hover:bg-[#0a5a87]'
                                        }`}
                                >
                                    Respuestas Rápidas
                                </Link>

                                {user?.role === 'ADMIN' && (
                                    <>
                                        <Link
                                            to="/logs"
                                            className={`flex h-full items-center justify-center px-8 text-sm font-medium transition-colors ${isActive('/logs')
                                                ? 'bg-[#A7CF3B] text-[#064A6F]'
                                                : 'text-white hover:bg-[#0a5a87]'
                                                }`}
                                        >
                                            Logs
                                        </Link>
                                        <Link
                                            to="/users"
                                            className={`flex h-full items-center justify-center px-8 text-sm font-medium transition-colors ${isActive('/users')
                                                ? 'bg-[#A7CF3B] text-[#064A6F]'
                                                : 'text-white hover:bg-[#0a5a87]'
                                                }`}
                                        >
                                            Usuarios
                                        </Link>
                                        <Link
                                            to="/instances"
                                            className={`flex h-full items-center justify-center px-8 text-sm font-medium transition-colors ${isActive('/instances') || isActive('/instances/') // Crude partial match or precise
                                                || location.pathname.startsWith('/instances')
                                                ? 'bg-[#A7CF3B] text-[#064A6F]'
                                                : 'text-white hover:bg-[#0a5a87]'
                                                }`}
                                        >
                                            Conexiones
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center">
                            {/* Campanita de notificaciones */}
                            <div className="relative" ref={notificationRef}>
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="relative p-2 text-white hover:bg-[#0a5a87] rounded-full transition-colors focus:outline-none"
                                    aria-label="Notificaciones"
                                >
                                    <BellIcon className="h-6 w-6" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {/* Dropdown de notificaciones */}
                                {showNotifications && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-gray-200">
                                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                                            <h3 className="text-sm font-medium text-gray-900">Alertas de Handover</h3>
                                        </div>
                                        <div className="max-h-96 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="px-4 py-6 text-center text-gray-500 text-sm">
                                                    No hay alertas pendientes
                                                </div>
                                            ) : (
                                                notifications.map((notif, index) => (
                                                    <div
                                                        key={index}
                                                        className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors"
                                                        onClick={() => handleNotificationClick(notif.leadId)}
                                                    >
                                                        <div className="flex items-start gap-2">
                                                            <div className="flex-shrink-0 mt-1">
                                                                <span className="inline-flex items-center justify-center h-2 w-2 rounded-full bg-red-500"></span>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                                    {notif.leadName || 'Lead'} necesita atención
                                                                </p>
                                                                <p className="text-xs text-gray-600 mt-1">
                                                                    {notif.message}
                                                                </p>
                                                                <p className="text-xs text-gray-400 mt-1">
                                                                    {formatTimestamp(notif.timestamp)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-center">
                                            <button
                                                onClick={() => {
                                                    navigate('/logs');
                                                    setShowNotifications(false);
                                                }}
                                                className="text-sm text-[#064A6F] hover:underline font-medium"
                                            >
                                                Ver todas las alertas
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Botón de perfil */}
                            <div className="relative ml-3" ref={profileRef}>
                                <button
                                    onClick={() => setShowProfile(!showProfile)}
                                    className="flex items-center max-w-xs text-sm text-white hover:bg-[#0a5a87] rounded-full p-1 focus:outline-none transition-colors"
                                    aria-label="Menú de perfil"
                                >
                                    <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
                                        <UserIcon className="h-5 w-5 text-[#064A6F]" />
                                    </div>
                                    <span className="ml-2 hidden md:block text-white font-medium mr-2">
                                        {user?.fullName.split(' ')[0]}
                                    </span>
                                </button>

                                {/* Dropdown de perfil */}
                                {showProfile && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-gray-200">
                                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                                            <p className="text-sm font-medium text-gray-900">{user?.fullName || 'Usuario'}</p>
                                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                            <div className="mt-1">
                                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${user?.role === 'ADMIN' ? 'bg-[#A7CF3B] text-[#064A6F]' : 'bg-gray-200 text-gray-700'}`}>
                                                    {user?.role}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="py-1">
                                            <button
                                                onClick={() => { navigate('/leads'); setShowProfile(false); }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                Mis Leads
                                            </button>
                                            {user?.role === 'ADMIN' && (
                                                <button
                                                    onClick={() => { navigate('/settings'); setShowProfile(false); }}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                >
                                                    Configuración
                                                </button>
                                            )}
                                            <div className="border-t border-gray-100 my-1"></div>
                                            <button
                                                onClick={logout}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                                            >
                                                Cerrar Sesión
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="py-10">
                <main>
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
