import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Upload, Shield, CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Background from '../components/Background';
import { setAuthToken } from '../lib/auth';

export function BecomeExpertPage() {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        description: '',
        profilePicture: null as File | null,
    });
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        console.log('BecomeExpertPage - Current user:', user);
        if (user?.role === 'Expert') {
            console.log('User is already Expert, redirecting to expert-panel');
            navigate('/expert-panel');
        }
    }, [user, navigate]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('La imagen no puede superar los 5MB');
                return;
            }

            if (!['image/jpeg', 'image/png'].includes(file.type)) {
                setError('Solo se permiten imágenes JPG y PNG');
                return;
            }

            setFormData(prev => ({ ...prev, profilePicture: file }));
            setPreviewUrl(URL.createObjectURL(file));
            setError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        if (!formData.profilePicture) {
            setError('La foto de perfil es requerida');
            setIsSubmitting(false);
            return;
        }

        try {
            const data = new FormData();
            data.append('description', formData.description);
            if (formData.profilePicture) {
                data.append('profilePicture', formData.profilePicture);
            }

            const token = localStorage.getItem('authToken');
            console.log('Sending request to /api/User/become-expert with token:', token ? 'present' : 'missing');

            const response = await fetch('/api/User/become-expert', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: data,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al registrarse como experto');
            }

            const result = await response.json();
            console.log('BecomeExpert API response:', result);

            // Verificar que el usuario tiene rol Expert
            if (result.user?.role !== 'Expert') {
                throw new Error('El usuario no tiene el rol de Experto después del registro');
            }

            // Guardar el token y los datos del usuario explícitamente
            setAuthToken(result.token, result.user);
            console.log('Token saved, verifying:', localStorage.getItem('authToken'));

            // Actualizar el usuario y redirigir
            updateUser(result.user, result.token, () => {
                console.log('User updated, redirecting to expert-panel');
                navigate('/expert-panel');
            });

            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'success',
                    message: '✨ ¡Te has registrado exitosamente como buscador experto!',
                },
            }));
        } catch (err) {
            console.error('BecomeExpert error:', err);
            setError(err instanceof Error ? err.message : 'Error al procesar la solicitud');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">Por favor, inicia sesión para continuar</p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                        Volver al inicio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen">
            <Background />
            <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Volver
                </button>

                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Shield className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Conviértete en Buscador Experto</h1>
                            <p className="text-gray-500 text-sm">Ayuda a otros usuarios a encontrar lo que buscan</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Foto de Perfil
                            </label>
                            <div
                                className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {previewUrl ? (
                                    <div className="relative w-32 h-32 mx-auto">
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover rounded-xl"
                                        />
                                        <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                            <Upload className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                                        <div className="text-sm text-gray-600">
                                            Arrastra una imagen o haz clic para seleccionar
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            PNG o JPG (máx. 5MB)
                                        </div>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Descripción
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                rows={4}
                                placeholder="Cuéntanos sobre tu experiencia y especialidad..."
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting || !formData.profilePicture}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    Registrarme como Experto
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}