import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from './api';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post('/auth/request-password-reset', { email });
            toast.success('Si el correo existe, recibirás un enlace para restablecer tu contraseña');
            onClose();
            setEmail('');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al enviar la solicitud');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
                <div className="p-8">
                    <div className="text-center mb-6">
                        <div className="w-12 h-12 bg-[#0c4a6f] rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-white text-xl">lock_reset</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Recuperar contraseña</h2>
                        <p className="text-gray-600 text-sm mt-2">
                            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Correo electrónico
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nombre@empresa.com"
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#0c4a6f]/5 focus:border-[#0c4a6f] placeholder:text-gray-300 font-medium transition-all"
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-3 bg-[#0c4a6f] text-white rounded-xl font-semibold text-sm shadow-md shadow-[#0c4a6f]/20 hover:bg-[#08334d] transition-all disabled:opacity-50"
                            >
                                {loading ? 'Enviando...' : 'Enviar enlace'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordModal;