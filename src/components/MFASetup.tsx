import React, { useState } from 'react';
import { Shield, CheckCircle, Download, Copy, AlertCircle } from 'lucide-react';
import { mfaService } from '../services/mfaService';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { showToast } from '../lib/toast';

interface MFASetupProps {
    onComplete: () => void;
    onCancel?: () => void;
}

export function MFASetup({ onComplete, onCancel }: MFASetupProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Setup, 2: Verify, 3: Recovery Codes
    const [qrCode, setQrCode] = useState<string>('');
    const [manualKey, setManualKey] = useState<string>('');
    const [totpCode, setTotpCode] = useState<string>('');
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');

    // ============================================
    // PASO 1: Obtener QR Code
    // ============================================
    const handleStartSetup = async () => {
        setLoading(true);
        setError('');

        try {
            const result = await mfaService.setupMFA();
            setQrCode(result.qrCodeBase64);
            setManualKey(result.manualEntryKey);
            setStep(2);
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Error al configurar MFA';
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

    // ============================================
    // PASO 2: Verificar código y habilitar MFA
    // ============================================
    const handleEnableMFA = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await mfaService.enableMFA(totpCode);
            setRecoveryCodes(result.recoveryCodes);
            setStep(3);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Código inválido');
            showToast('error', err.response?.data?.message || err.message || 'Código inválido');
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // PASO 3: Descargar códigos de recuperación
    // ============================================
    const downloadRecoveryCodes = () => {
        const blob = new Blob([recoveryCodes.join('\n')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mfa-recovery-codes.txt';
        a.click();
        URL.revokeObjectURL(url);
        showToast('success', 'Códigos de recuperación descargados');
    };

    const copyRecoveryCodes = () => {
        navigator.clipboard.writeText(recoveryCodes.join('\n'));
        showToast('success', 'Códigos copiados al portapapeles');
    };

    // ============================================
    // RENDER
    // ============================================
    return (
        <div className="space-y-6">
            {/* PASO 1: Iniciar */}
            {step === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Configurar Autenticación de Dos Factores
                        </CardTitle>
                        <CardDescription>
                            Aumenta la seguridad de tu cuenta con MFA. Necesitarás un código de tu app de autenticación además de tu contraseña.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                                {error}
                            </div>
                        )}
                        <Button onClick={handleStartSetup} disabled={loading} className="w-full">
                            {loading ? 'Cargando...' : 'Comenzar Configuración'}
                        </Button>
                        {onCancel && (
                            <Button variant="outline" onClick={onCancel} className="w-full">
                                Cancelar
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* PASO 2: Escanear QR y verificar */}
            {step === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Escanea el código QR</CardTitle>
                        <CardDescription>
                            Usa tu app de autenticación (Google Authenticator, Microsoft Authenticator, etc.) para escanear este código.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* QR Code */}
                        <div className="flex justify-center">
                            <div className="p-4 bg-white rounded-lg border-2 border-border">
                                <img
                                    src={`data:image/png;base64,${qrCode}`}
                                    alt="MFA QR Code"
                                    className="w-64 h-64"
                                />
                            </div>
                        </div>

                        {/* Clave manual */}
                        <details className="space-y-2">
                            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                                ¿No puedes escanear el código?
                            </summary>
                            <div className="mt-2 space-y-2">
                                <p className="text-sm text-muted-foreground">Ingresa esta clave manualmente en tu app:</p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 p-2 bg-muted rounded-md text-sm font-mono break-all">
                                        {manualKey}
                                    </code>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            navigator.clipboard.writeText(manualKey);
                                            showToast('success', 'Clave copiada');
                                        }}
                                    >
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </details>

                        {/* Instrucciones */}
                        <div className="space-y-2 text-sm">
                            <h3 className="font-semibold">Instrucciones:</h3>
                            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                                <li>Abre tu app de autenticación (Google Authenticator, Microsoft Authenticator, etc.)</li>
                                <li>Escanea el código QR o ingresa la clave manual</li>
                                <li>Ingresa el código de 6 dígitos que aparece en tu app</li>
                            </ol>
                        </div>

                        {/* Formulario de verificación */}
                        <form onSubmit={handleEnableMFA} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="totpCode">Código de 6 dígitos</Label>
                                <Input
                                    id="totpCode"
                                    type="text"
                                    value={totpCode}
                                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="123456"
                                    maxLength={6}
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

                            <div className="flex gap-2">
                                <Button type="submit" disabled={loading || totpCode.length !== 6} className="flex-1">
                                    {loading ? 'Verificando...' : 'Habilitar MFA'}
                                </Button>
                                {onCancel && (
                                    <Button type="button" variant="outline" onClick={onCancel}>
                                        Cancelar
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* PASO 3: Códigos de recuperación */}
            {step === 3 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="w-5 h-5" />
                            Guarda tus códigos de recuperación
                        </CardTitle>
                        <CardDescription>
                            IMPORTANTE: Guarda estos códigos en un lugar seguro. Solo se mostrarán una vez y los necesitarás si pierdes acceso a tu app de autenticación.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Códigos de recuperación */}
                        <div className="p-4 bg-muted rounded-lg border border-border space-y-2">
                            {recoveryCodes.map((code, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-2 bg-background rounded border border-border font-mono text-sm"
                                >
                                    <span className="text-muted-foreground">{index + 1}.</span>
                                    <span className="flex-1 text-center">{code}</span>
                                </div>
                            ))}
                        </div>

                        {/* Acciones */}
                        <div className="flex gap-2">
                            <Button onClick={downloadRecoveryCodes} variant="outline" className="flex-1">
                                <Download className="w-4 h-4 mr-2" />
                                Descargar códigos
                            </Button>
                            <Button onClick={copyRecoveryCodes} variant="outline" className="flex-1">
                                <Copy className="w-4 h-4 mr-2" />
                                Copiar códigos
                            </Button>
                        </div>

                        {/* Checkbox de confirmación */}
                        <div className="flex items-start gap-2 p-4 bg-muted/50 rounded-lg border border-border">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-muted-foreground">
                                Confirmo que he guardado mis códigos de recuperación de forma segura
                            </p>
                        </div>

                        <Button onClick={onComplete} className="w-full" size="lg">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Completar configuración
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

