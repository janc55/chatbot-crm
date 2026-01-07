import { Outlet, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

export default function Layout() {
    const location = useLocation();
    
    const isActive = (path: string) => location.pathname === path;

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
                                    className={`flex h-full items-center justify-center px-8 text-sm font-medium transition-colors ${
                                        isActive('/') 
                                            ? 'bg-[#A7CF3B] text-[#064A6F]' 
                                            : 'text-white hover:bg-[#0a5a87]'
                                    }`}
                                >
                                    Dashboard
                                </Link>
                                <Link 
                                    to="/leads" 
                                    className={`flex h-full items-center justify-center px-8 text-sm font-medium transition-colors ${
                                        isActive('/leads') 
                                            ? 'bg-[#A7CF3B] text-[#064A6F]' 
                                            : 'text-white hover:bg-[#0a5a87]'
                                    }`}
                                >
                                    Leads
                                </Link>
                                <Link 
                                    to="/templates" 
                                    className={`flex h-full items-center justify-center px-8 text-sm font-medium transition-colors ${
                                        isActive('/templates') 
                                            ? 'bg-[#A7CF3B] text-[#064A6F]' 
                                            : 'text-white hover:bg-[#0a5a87]'
                                    }`}
                                >
                                    Templates
                                </Link>
                                <Link 
                                    to="/settings" 
                                    className={`flex h-full items-center justify-center px-8 text-sm font-medium transition-colors ${
                                        isActive('/settings') 
                                            ? 'bg-[#A7CF3B] text-[#064A6F]' 
                                            : 'text-white hover:bg-[#0a5a87]'
                                    }`}
                                >
                                    Settings
                                </Link>
                                <Link 
                                    to="/logs" 
                                    className={`flex h-full items-center justify-center px-8 text-sm font-medium transition-colors ${
                                        isActive('/logs') 
                                            ? 'bg-[#A7CF3B] text-[#064A6F]' 
                                            : 'text-white hover:bg-[#0a5a87]'
                                    }`}
                                >
                                    Logs
                                </Link>
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
