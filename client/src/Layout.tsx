import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
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

    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const isActive = (path: string) => location.pathname === path;

    // Estilos comunes para los links del sidebar
    const navItemClass = (path: string) => `
        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
        ${isActive(path)
            ? 'bg-[#0c4a6f] text-white shadow-lg shadow-[#0c4a6f]/20'
            : 'text-gray-500 hover:bg-gray-100 hover:text-[#0c4a6f]'}
    `;

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

    const handleNotificationClick = (leadId: string) => {
        navigate(`/persons/${leadId}`);
        setShowNotifications(false);
    };

    return (
        <div className="flex min-h-screen bg-[#f8fafc] font-sans">
            <Toaster position="top-right" />

            {/* MODAL DE CONFIRMACIÓN DE LOGOUT */}
            {isLogoutModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Overlay oscuro */}
                    <div
                        className="absolute inset-0 bg-[#0c4a6f]/20 backdrop-blur-sm"
                        onClick={() => setIsLogoutModalOpen(false)}
                    ></div>

                    {/* Caja del Modal */}
                    <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-in fade-in zoom-in duration-200">
                        <div className="size-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-3xl">logout</span>
                        </div>

                        <h3 className="text-xl font-extrabold text-[#111518] mb-2">¿Cerrar sesión ahora?</h3>
                        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                            Tendrás que volver a ingresar tus credenciales para acceder a tu panel de Nettidev.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={logout}
                                className="w-full py-3.5 bg-red-500 text-white rounded-2xl font-medium text-sm hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                            >
                                Sí, cerrar sesión
                            </button>
                            <button
                                onClick={() => setIsLogoutModalOpen(false)}
                                className="w-full py-3.5 bg-gray-50 text-gray-500 rounded-2xl font-medium text-sm hover:bg-gray-100 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* SIDEBAR IZQUIERDO */}
            <aside className="w-64 border-r border-gray-200 bg-white fixed h-full z-30">
                <div className="flex flex-col h-full p-6">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-10 px-2">
                        <div className="size-10 bg-[#0c4a6f] rounded-xl flex items-center justify-center text-white shrink-0">
                            <img
                                src="/images/nettidev.svg"
                                alt="Logo"
                                className="h-10 w-10 object-contain p-1"
                            />
                        </div>
                        <div className="overflow-hidden">
                            <h1 className="text-[#111518] text-lg font-extrabold leading-none truncate">Nettidev</h1>
                            <p className="text-gray-400 text-[10px] font-medium uppercase tracking-wider">CRM Dashboard</p>
                        </div>
                    </div>

                    {/* Navegación */}
                    <nav className="flex-1 flex flex-col gap-1">
                        <Link to="/" className={navItemClass('/')}>
                            <span className="material-symbols-outlined">dashboard</span>
                            <span className="text-sm font-medium">Dashboard</span>
                        </Link>
                        <Link to="/persons" className={navItemClass('/persons')}>
                            <span className="material-symbols-outlined">groups</span>
                            <span className="text-sm font-medium">Leads</span>
                        </Link>
                        <Link to="/templates" className={navItemClass('/templates')}>
                            <span className="material-symbols-outlined">description</span>
                            <span className="text-sm font-medium">Templates</span>
                        </Link>
                        <Link to="/quick-replies" className={navItemClass('/quick-replies')}>
                            <span className="material-symbols-outlined">forum</span>
                            <span className="text-sm font-medium">Respuestas Rápidas</span>
                        </Link>

                        {user?.role === 'ADMIN' && (
                            <>
                                <div className="mt-6 mb-2 px-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Administración</div>
                                <Link to="/logs" className={navItemClass('/logs')}>
                                    <span className="material-symbols-outlined">list_alt</span>
                                    <span className="text-sm font-medium">Logs</span>
                                </Link>
                                <Link to="/users" className={navItemClass('/users')}>
                                    <span className="material-symbols-outlined">account_circle</span>
                                    <span className="text-sm font-medium">Usuarios</span>
                                </Link>
                                <Link to="/instances" className={navItemClass('/instances')}>
                                    <span className="material-symbols-outlined">hub</span>
                                    <span className="text-sm font-medium">Conexiones</span>
                                </Link>
                            </>
                        )}
                    </nav>

                    {/* Footer Sidebar */}
                    <div className="mt-auto pt-6 border-t border-gray-100 flex flex-col gap-1">
                        <Link to="/settings" className={navItemClass('/settings')}>
                            <span className="material-symbols-outlined">settings</span>
                            <span className="text-sm font-medium">Configuración</span>
                        </Link>
                        <button
                            onClick={() => setIsLogoutModalOpen(true)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                        >
                            <span className="material-symbols-outlined">logout</span>
                            <span className="text-sm font-medium">Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* CONTENIDO PRINCIPAL */}
            <main className="flex-1 ml-64 min-h-screen">
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex-1 max-w-lg relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                        <input
                            type="text"
                            placeholder="Buscar leads o mensajes..."
                            className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0c4a6f]/10 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Notificaciones */}
                        <div className="relative" ref={notificationRef}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="size-10 flex items-center justify-center bg-gray-50 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors relative"
                            >
                                <span className="material-symbols-outlined text-[22px]">notifications</span>
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white"></span>
                                )}
                            </button>
                            {showNotifications && (
                                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden py-2">
                                    <div className="px-4 py-2 font-medium text-xs text-gray-400 uppercase tracking-wider border-b border-gray-50">Alertas Recientes</div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.length > 0 ? notifications.map((n, i) => (
                                            <div key={i} onClick={() => handleNotificationClick(n.leadId)} className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                                                <p className="text-sm font-medium text-gray-800">{n.leadName || 'Lead'}</p>
                                                <p className="text-xs text-gray-500 truncate">{n.message}</p>
                                            </div>
                                        )) : <div className="p-8 text-center text-xs text-gray-400 italic">No hay alertas</div>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Perfil */}
                        <div className="relative ml-2" ref={profileRef}>
                            <button
                                onClick={() => setShowProfile(!showProfile)}
                                className="flex items-center gap-3 p-1.5 pr-4 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100"
                            >
                                <div className="size-10 bg-[#89c540]/10 text-[#89c540] rounded-xl flex items-center justify-center">
                                    <span className="material-symbols-outlined">person</span>
                                </div>
                                <div className="hidden md:flex flex-col items-start leading-tight">
                                    <span className="text-sm font-extrabold text-gray-900">{user?.fullName.split(' ')[0]}</span>
                                    <span className="text-[10px] font-medium text-[#89c540] uppercase">{user?.role}</span>
                                </div>
                            </button>

                            {showProfile && (
                                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden py-2">
                                    <div className="px-4 py-3 border-b border-gray-50 mb-1">
                                        <p className="text-sm font-medium truncate">{user?.fullName}</p>
                                        <p className="text-[10px] text-gray-400 font-medium truncate">{user?.email}</p>
                                    </div>
                                    <button onClick={() => navigate('/persons')} className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Mis Contactos</button>
                                    <button
                                        onClick={() => {
                                            setShowProfile(false);
                                            setIsLogoutModalOpen(true);
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-lg">logout_variant</span>
                                        Cerrar Sesión
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
