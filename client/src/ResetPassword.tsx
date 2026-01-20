import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from './api';

const ResetPassword: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState('');
    const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const tokenFromUrl = searchParams.get('token');
        if (!tokenFromUrl) {
            toast.error('Token no válido');
            navigate('/login');
            return;
        }
        setToken(tokenFromUrl);
        // Aquí podrías validar el token con el backend si es necesario
        setIsValidToken(true);
    }, [searchParams, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            await api.post('/auth/reset-password', {
                token,
                newPassword: password,
            });

            toast.success('Contraseña actualizada exitosamente');
            navigate('/login');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al actualizar la contraseña');
        } finally {
            setLoading(false);
        }
    };

    if (isValidToken === null) {
        return (
            <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0c4a6f] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Verificando enlace...</p>
                </div>
            </div>
        );
    }

    if (isValidToken === false) {
        return (
            <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center p-6">
                <div className="text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-red-600 text-xl">error</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Enlace no válido</h2>
                    <p className="text-gray-600 mb-6">Este enlace ha expirado o no es válido.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-3 bg-[#0c4a6f] text-white rounded-xl font-semibold text-sm shadow-md shadow-[#0c4a6f]/20 hover:bg-[#08334d] transition-all"
                    >
                        Ir al login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f9fafb] flex flex-col items-center justify-center p-6 font-sans antialiased">
            {/* LOGO SUPERIOR */}
            <div className="mb-8 flex items-center gap-2">
                <img src="/images/nettidev.svg" alt="Nettidev" className="h-9 w-auto" />
                <span className="text-xl font-bold text-[#0c4a6f] tracking-tight">NettiDev<span className="text-[#89c540]"> CRM</span></span>
            </div>

            {/* TARJETA DE RESET PASSWORD */}
            <div className="w-full max-w-[440px] bg-white rounded-[24px] shadow-sm border border-gray-100 p-10">
                <div className="text-center mb-10">
                    <div className="w-12 h-12 bg-[#0c4a6f] rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-white text-xl">lock_reset</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Nueva contraseña</h2>
                    <p className="text-gray-500 text-sm mt-2 font-medium">Ingresa tu nueva contraseña</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Nueva contraseña</label>
                        <div className="relative flex items-center">
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

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Confirmar contraseña</label>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#0c4a6f]/5 focus:border-[#0c4a6f] placeholder:text-gray-300 font-medium transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-[#0c4a6f] text-white rounded-xl font-bold text-sm shadow-md shadow-[#0c4a6f]/20 hover:bg-[#08334d] transition-all disabled:opacity-50 active:scale-[0.98]"
                    >
                        {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-50 text-center">
                    <button
                        onClick={() => navigate('/login')}
                        className="text-xs text-[#0c4a6f] font-bold hover:underline"
                    >
                        ← Volver al login
                    </button>
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
        </div>
    );
};

export default ResetPassword;