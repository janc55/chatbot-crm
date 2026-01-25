import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ForgotPasswordModal from './ForgotPasswordModal';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            toast.success('¡Bienvenido!');
            navigate('/');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f9fafb] flex flex-col items-center justify-center p-6 font-sans antialiased">
            {/* LOGO SUPERIOR */}
            <div className="mb-8 flex items-center gap-2">
                <img src="/images/nettidev.svg" alt="Nettidev" className="h-9 w-auto" />
                <span className="text-xl font-bold text-[#0c4a6f] tracking-tight">NettiDev<span className="text-[#89c540]"> CRM</span></span>
            </div>

            {/* TARJETA DE LOGIN */}
            <div className="w-full max-w-[440px] bg-white rounded-[24px] shadow-sm border border-gray-100 p-10">
                <div className="text-center mb-10">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Bienvenido de nuevo</h2>
                    <p className="text-gray-500 text-sm mt-2 font-medium">Ingresa tus credenciales para acceder</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Correo electrónico</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nombre@empresa.com"
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#0c4a6f]/5 focus:border-[#0c4a6f] placeholder:text-gray-300 font-medium transition-all"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between mb-2 ml-1">
                            <label className="text-sm font-semibold text-gray-700">Contraseña</label>
                            <button
                                type="button"
                                onClick={() => setShowForgotPassword(true)}
                                className="text-xs font-bold text-[#0c4a6f] hover:text-[#08334d] hover:underline"
                            >
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>
                        <div className="relative flex items-center"> {/* Agregado flex e items-center */}
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#0c4a6f]/5 focus:border-[#0c4a6f] placeholder:text-gray-300 font-medium transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-400 hover:text-gray-600"
                            >
                                <span className="material-symbols-outlined text-[22px] select-none">
                                    {showPassword ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-[#0c4a6f] text-white rounded-xl font-bold text-sm shadow-md shadow-[#0c4a6f]/20 hover:bg-[#08334d] transition-all disabled:opacity-50 active:scale-[0.98]"
                    >
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-50 text-center">
                    <p className="text-xs text-gray-400 font-medium">
                        ¿Nuevo en Nettidev? <button className="text-[#0c4a6f] font-bold hover:underline">Contactar soporte</button>
                    </p>
                </div>
            </div>

            {/* FOOTER */}
            <div className="mt-8 flex items-center gap-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                <button className="hover:text-gray-600 transition-colors">Privacidad</button>
                <button className="hover:text-gray-600 transition-colors">Términos</button>

                {/* Contenedor de idioma */}
                <div className="flex items-center gap-1.5 cursor-default">
                    <span className="material-symbols-outlined !text-[16px] flex items-center justify-center">
                        language
                    </span>
                    <span className="inline-block">Español (ES)</span>
                </div>
            </div>

            {/* MODAL DE RECUPERACIÓN DE CONTRASEÑA */}
            <ForgotPasswordModal
                isOpen={showForgotPassword}
                onClose={() => setShowForgotPassword(false)}
            />
        </div>
    );
};

export default Login;