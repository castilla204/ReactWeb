import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { mfaService } from '../services/mfaService';
import { authService } from '../services/authService';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { showToast } from '../lib/toast';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
    InputOTPSeparator,
} from './ui/input-otp';

interface MFAVerifyProps {
    onSuccess: () => void;
    onCancel: () => void; // ✅ Ahora es requerido
    onVerificationStarted?: () => void; // ✅ Callback cuando se inicia la verificación
    onVerificationCompleted?: () => void; // ✅ Callback cuando se completa
}

export function MFAVerify({ onSuccess, onCancel, onVerificationStarted, onVerificationCompleted }: MFAVerifyProps) {
    const [code, setCode] = useState('');
    const [useRecoveryCode, setUseRecoveryCode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    // ✅ Notificar que se inició la verificación
    React.useEffect(() => {
        if (onVerificationStarted) {
            onVerificationStarted();
        }
        // ✅ Marcar que hay verificación pendiente
        localStorage.setItem('mfa-verification-pending', 'true');
    }, [onVerificationStarted]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            console.log('[MFAVerify] Starting verification...');
            const result = await mfaService.verifyMFA(code, useRecoveryCode);
            console.log('[MFAVerify] Verification result:', result);

            if (result.isValid && result.accessToken && result.refreshToken) {
                // Guardar nuevos tokens
                authService.setTokens(result.accessToken, result.refreshToken);
                authService.scheduleTokenRefresh();

                // Mostrar mensaje si quedan pocos recovery codes
                if (result.message) {
                    showToast('warning', result.message, 8000);
                }

                showToast('success', 'Verificación exitosa');
                setIsVerified(true);
                // ✅ Limpiar verificación pendiente ANTES de disparar eventos
                console.log('[MFAVerify] Removing mfa-verification-pending from localStorage');
                localStorage.removeItem('mfa-verification-pending');
                // ✅ Disparar evento inmediatamente
                window.dispatchEvent(new CustomEvent('mfaVerificationCleared'));
                if (onVerificationCompleted) {
                    onVerificationCompleted();
                }
                setLoading(false); // ✅ Asegurar que se detiene el loading antes de onSuccess
                // ✅ Llamar a onSuccess que cerrará el modal/drawer automáticamente
                onSuccess();
            } else {
                console.warn('[MFAVerify] Invalid result:', result);
                setLoading(false); // ✅ Detener loading inmediatamente
                showToast('error', 'Código inválido');
            }
        } catch (err: any) {
            // ✅ Asegurar que el loading se detiene SIEMPRE, incluso si hay un error inesperado
            console.error('[MFAVerify] Error caught:', err);
            setLoading(false); // ✅ Detener loading inmediatamente en caso de error
            
            // ✅ Intentar extraer el mensaje de error de diferentes formas
            let errorMessage = 'Error al verificar código';
            
            if (err?.message) {
                errorMessage = err.message;
            } else if (err?.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (typeof err === 'string') {
                errorMessage = err;
            }
            
            // Filtrar mensajes de rate limiting
            const filteredMessage = errorMessage.includes('Rate limited') || errorMessage.includes('429')
                ? 'Error temporal. Por favor intenta de nuevo en un momento.'
                : errorMessage;
            
            // ✅ Mostrar error solo como notificación (toast), no en el popup
            showToast('error', filteredMessage);
        } finally {
            // ✅ Asegurar que el loading se detiene en cualquier caso
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h3 className="text-lg font-semibold">Verificación de Dos Factores</h3>
                <p className="text-sm text-muted-foreground">
                    Ingresa el código de tu app de autenticación para completar el inicio de sesión.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-sm font-medium">
                        {useRecoveryCode ? 'Código de recuperación' : 'Código de 6 dígitos'}
                    </Label>
                    {useRecoveryCode ? (
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => {
                                const value = e.target.value.toUpperCase();
                                setCode(value.slice(0, 9));
                            }}
                            placeholder="XXXX-XXXX"
                            maxLength={9}
                            required
                            autoFocus
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                    ) : (
                        <div className="flex justify-center">
                            <InputOTP
                                maxLength={6}
                                value={code}
                                onChange={(value) => setCode(value)}
                                disabled={loading}
                            >
                                <InputOTPGroup>
                                    <InputOTPSlot index={0} />
                                    <InputOTPSlot index={1} />
                                    <InputOTPSlot index={2} />
                                </InputOTPGroup>
                                <InputOTPSeparator />
                                <InputOTPGroup>
                                    <InputOTPSlot index={3} />
                                    <InputOTPSlot index={4} />
                                    <InputOTPSlot index={5} />
                                </InputOTPGroup>
                            </InputOTP>
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    <Button
                        type="submit"
                        disabled={loading || (!useRecoveryCode && code.length !== 6) || (useRecoveryCode && code.length < 8)}
                        className="flex-1"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Verificando...
                            </>
                        ) : (
                            'Verificar'
                        )}
                    </Button>
                    <Button 
                        type="button"
                        variant="outline" 
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                </div>
            </form>

            <Button
                variant="ghost"
                onClick={() => {
                    setUseRecoveryCode(!useRecoveryCode);
                    setCode('');
                }}
                className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
                {useRecoveryCode ? '← Usar código de la app' : 'Usar código de recuperación →'}
            </Button>
        </div>
    );
}

