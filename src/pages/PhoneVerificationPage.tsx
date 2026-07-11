import React, { useState } from 'react';
import { Phone, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { getAuthToken, updateUserData } from '../lib/auth';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { API_CONFIG } from '../config/api';

export function PhoneVerification() {
    const { setUser } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState<'phone' | 'code'>('phone');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const formattedPhone = '+' + phoneNumber;
            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.sendVerification}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`,
                },
                body: JSON.stringify({ phoneNumber: formattedPhone })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Error al enviar el código de verificación');
            }

            setStep('code');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al enviar el código de verificación');
        } finally {
            setLoading(false);
        }
    };

    const handleCodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const formattedPhone = '+' + phoneNumber;
            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.verifyCode}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`,
                },
                body: JSON.stringify({
                    phoneNumber: formattedPhone,
                    code: verificationCode
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Código de verificación inválido');
            }

            const updatedUser = updateUserData({ phoneVerified: true });
            setUser(updatedUser);
            navigate('/');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al verificar el código');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
            <div className="w-full max-w-md mx-4 bg-white/95 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-2xl border border-gray-100">
                <div className="text-center mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl shadow-blue-500/20 transform -rotate-6">
                        {step === 'phone' ? (
                            <Phone className="w-6 h-6 text-white" />
                        ) : (
                            <Shield className="w-6 h-6 text-white" />
                        )}
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">
                        Verificación de Teléfono
                    </h2>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto">
                        {step === 'phone'
                            ? 'Introduce tu número de teléfono para recibir un código de verificación'
                            : 'Introduce el código que hemos enviado a tu teléfono'}
                    </p>
                </div>

                <form onSubmit={step === 'phone' ? handlePhoneSubmit : handleCodeSubmit} className="space-y-4">
                    {step === 'phone' ? (
                        <div className="relative">
                            <PhoneInput
                                country={'es'}
                                value={phoneNumber}
                                onChange={setPhoneNumber}
                                inputClass="!w-full !h-11 !text-gray-900 !bg-white !border-gray-200 !pl-12 !rounded-xl !focus:border-blue-500 !focus:ring-4 !focus:ring-blue-500/10 !text-base"
                                containerClass="!bg-transparent"
                                buttonClass="!bg-white !border-gray-200 !rounded-l-xl !h-11 !w-12"
                                dropdownClass="!bg-white !text-gray-900"
                                searchClass="!bg-gray-800 !text-white"
                                enableSearch={true}
                                searchPlaceholder="Buscar país..."
                            />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="Introduce el código"
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 text-center text-lg tracking-[0.5em] font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                maxLength={6}
                            />
                        </div>
                    )}

                    {step === 'phone' && (
                        <div className="space-y-2">
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    id="privacy"
                                    checked={acceptedPrivacy}
                                    onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors"
                                />
                                <label htmlFor="privacy" className="text-sm text-gray-600">
                                    He leído y acepto la <Link to="/privacy-policy.html" className="text-blue-600 hover:text-blue-700 underline">Política de Privacidad</Link>
                                </label>
                            </div>
                            <p className="text-xs text-gray-400 pl-7">
                                Al marcar esta casilla, aceptas que procesemos tus datos personales de acuerdo con nuestra política de privacidad.
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="text-red-600 text-sm bg-red-50 border border-red-100 px-4 py-3 rounded-xl flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || (step === 'phone' && (!phoneNumber || !acceptedPrivacy)) || (step === 'code' && verificationCode.length !== 6)}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-6 rounded-xl font-medium transition-all disabled:opacity-50 disabled:hover:from-blue-600 disabled:hover:to-blue-700 shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                {step === 'phone' ? (
                                    <>
                                        <Phone className="w-5 h-5" />
                                        Enviar Código
                                    </>
                                ) : (
                                    <>
                                        <Shield className="w-5 h-5" />
                                        Verificar Código
                                    </>
                                )}
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>

                    {step === 'code' && (
                        <button
                            type="button"
                            onClick={() => setStep('phone')}
                            className="w-full text-gray-500 hover:text-gray-700 text-sm transition-colors mt-2"
                        >
                            Cambiar número de teléfono
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}