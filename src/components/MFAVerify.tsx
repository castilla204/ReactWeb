import React, { useState } from 'react';
import { Shield, AlertCircle, RefreshCw } from 'lucide-react';
import { mfaService } from '../services/mfaService';
import { authService } from '../services/authService';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { showToast } from '../lib/toast';

interface MFAVerifyProps {
    onSuccess: () => void;
    onCancel?: () => void;
}

export function MFAVerify({ onSuccess, onCancel }: MFAVerifyProps) {
    const [code, setCode] = useState('');
    const [useRecoveryCode, setUseRecoveryCode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await mfaService.verifyMFA(code, useRecoveryCode);

            if (result.isValid && result.accessToken && result.refreshToken) {
                // Guardar nuevos tokens
                authService.setTokens(result.accessToken, result.refreshToken);
                authService.scheduleTokenRefresh();

                // Mostrar mensaje si quedan pocos recovery codes
                if (result.message) {
                    showToast('warning', result.message, 8000);
                }

                showToast('success', 'Verificación exitosa');
                onSuccess();
            } else {
                setError('Código inválido');
                showToast('error', 'Código inválido');
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Error al verificar código';
            // Filtrar mensajes de rate limiting
            const filteredMessage = errorMessage.includes('Rate limited') || errorMessage.includes('429')
                ? 'Error temporal. Por favor intenta de nuevo en un momento.'
                : errorMessage;
            setError(filteredMessage);
            // ❌ TEMPORALMENTE DESHABILITADO: No mostrar toast de error para rate limiting
            if (!errorMessage.includes('Rate limited') && !errorMessage.includes('429')) {
                showToast('error', filteredMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Verificación de Dos Factores
                </CardTitle>
                <CardDescription>
                    Ingresa el código de tu app de autenticación para completar el inicio de sesión.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="mfaCode">
                            {useRecoveryCode ? 'Código de recuperación' : 'Código de 6 dígitos'}
                        </Label>
                        <Input
                            id="mfaCode"
                            type="text"
                            value={code}
                            onChange={(e) => {
                                const value = e.target.value.toUpperCase();
                                setCode(useRecoveryCode ? value : value.replace(/\D/g, '').slice(0, 6));
                            }}
                            placeholder={useRecoveryCode ? 'XXXX-XXXX' : '123456'}
                            maxLength={useRecoveryCode ? 9 : 6}
                            required
                            className="text-center text-2xl tracking-widest font-mono"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading || (!useRecoveryCode && code.length !== 6) || (useRecoveryCode && code.length < 8)}
                        className="w-full"
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
                </form>

                {/* Toggle recovery code */}
                <Button
                    variant="ghost"
                    onClick={() => {
                        setUseRecoveryCode(!useRecoveryCode);
                        setCode('');
                        setError('');
                    }}
                    className="w-full text-sm"
                >
                    {useRecoveryCode ? '← Usar código de la app' : 'Usar código de recuperación →'}
                </Button>

                {/* Cancelar */}
                {onCancel && (
                    <Button variant="outline" onClick={onCancel} className="w-full">
                        Cancelar
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

