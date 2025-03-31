import React, { useState } from 'react';
import { Phone, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { getAuthToken } from '../lib/auth';
import { useAuth } from '../contexts/AuthContext';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

interface PhoneVerificationProps {
    onVerificationComplete: () => void;
}

export function PhoneVerification({ onVerificationComplete }: PhoneVerificationProps) {
    const { setUser } = useAuth();
    const [step, setStep] = useState<'phone' | 'code'>('phone');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const formattedPhone = '+' + phoneNumber;
            const response = await fetch('http://localhost:7124/api/User/send-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`,
                },
                body: JSON.stringify({ phoneNumber: formattedPhone })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to send verification code');
            }

            setStep('code');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send verification code');
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
            const response = await fetch('http://localhost:7124/api/User/verify-code', {
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
                throw new Error(data.message || 'Invalid verification code');
            }

            setUser(prev => prev ? { ...prev, phoneVerified: true } : null);
            onVerificationComplete();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to verify code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-900/90 p-8 rounded-2xl shadow-xl max-w-md w-full mx-4 border border-gray-800">
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    {step === 'phone' ? (
                        <Phone className="w-8 h-8 text-blue-400" />
                    ) : (
                        <Shield className="w-8 h-8 text-blue-400" />
                    )}
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                    Phone Verification
                </h2>
                <p className="text-gray-400 text-sm">
                    {step === 'phone'
                        ? 'Enter your phone number to receive a verification code'
                        : 'Enter the code we sent to your phone'}
                </p>
            </div>

            <form onSubmit={step === 'phone' ? handlePhoneSubmit : handleCodeSubmit} className="space-y-6">
                {step === 'phone' ? (
                    <div className="relative">
                        <PhoneInput
                            country={'es'}
                            value={phoneNumber}
                            onChange={setPhoneNumber}
                            inputClass="!w-full !h-12 !text-white !bg-gray-800 !border-gray-700 !pl-12 !rounded-lg"
                            containerClass="!bg-transparent"
                            buttonClass="!bg-gray-800 !border-gray-700 !rounded-l-lg"
                            dropdownClass="!bg-gray-800 !text-white"
                            searchClass="!bg-gray-800 !text-white"
                            enableSearch={true}
                            searchPlaceholder="Search country..."
                        />
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="flex justify-center gap-2">
                            <input
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="Enter code"
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-center text-lg tracking-wider"
                                maxLength={6}
                            />
                        </div>
                    </div>
                )}

                {error && (
                    <div className="text-red-400 text-sm bg-red-500/10 px-4 py-3 rounded-lg flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || (step === 'phone' && !phoneNumber) || (step === 'code' && verificationCode.length !== 6)}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            {step === 'phone' ? (
                                <>
                                    <Phone className="w-5 h-5" />
                                    Send Code
                                </>
                            ) : (
                                <>
                                    <Shield className="w-5 h-5" />
                                    Verify Code
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
                        className="w-full text-gray-400 hover:text-white text-sm transition-colors"
                    >
                        Change phone number
                    </button>
                )}
            </form>
        </div>
    );
}