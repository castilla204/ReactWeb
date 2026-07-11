import React, { useState } from 'react';
import { Shield, AlertCircle } from 'lucide-react';
import { mfaService } from '../services/mfaService';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { showToast } from '../lib/toast';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
    InputOTPSeparator,
} from './ui/input-otp';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from './ui/drawer';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface DisableMFAModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function DisableMFAModal({ isOpen, onClose, onSuccess }: DisableMFAModalProps) {
    const [totpCode, setTotpCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const isDesktop = useMediaQuery('(min-width: 768px)');

    // ✅ Debug: Verificar que el modal se está renderizando
    React.useEffect(() => {
        console.log('[DisableMFAModal] Render - isOpen:', isOpen, 'isDesktop:', isDesktop);
    }, [isOpen, isDesktop]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validar que el código TOTP esté completo
        if (totpCode.length !== 6) {
            setError('Por favor ingresa el código de 6 dígitos');
            setLoading(false);
            return;
        }

        try {
            // ✅ Siempre enviar contraseña vacía ya que todos los usuarios se registran con Google
            await mfaService.disableMFA('', totpCode);
            showToast('success', 'MFA deshabilitado exitosamente');
            setTotpCode('');
            setError('');
            onSuccess();
            onClose();
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || err?.message || 'Error al deshabilitar MFA';
            setError(errorMessage);
            showToast('error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setTotpCode('');
            setError('');
            onClose();
        }
    };

    const content = (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Código TOTP */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Código de 6 dígitos *</Label>
                    <div className="flex justify-center">
                        <InputOTP
                            maxLength={6}
                            value={totpCode}
                            onChange={(value) => setTotpCode(value)}
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
                </div>

                {error && (
                    <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="flex gap-2 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={loading}
                        className="flex-1"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="destructive"
                        disabled={loading || totpCode.length !== 6}
                        className="flex-1"
                    >
                        {loading ? 'Deshabilitando...' : 'Deshabilitar MFA'}
                    </Button>
                </div>
            </form>
        </div>
    );

    // ✅ El Dialog ya usa Portal internamente, no necesitamos createPortal adicional
    if (isDesktop) {
        return (
            <Dialog open={isOpen} onOpenChange={(open) => {
                console.log('[DisableMFAModal] Dialog onOpenChange:', open, 'isOpen:', isOpen);
                if (!open) {
                    handleClose();
                }
            }}>
                <DialogContent className="sm:max-w-md" style={{ zIndex: 9999 }}>
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <Shield className="h-6 w-6 text-destructive" />
                            <DialogTitle>Deshabilitar Autenticación de Dos Factores</DialogTitle>
                        </div>
                        <DialogDescription>
                            Para deshabilitar MFA, necesitas ingresar el código de tu app de autenticación.
                        </DialogDescription>
                    </DialogHeader>
                    {content}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={isOpen} onOpenChange={(open) => {
            console.log('[DisableMFAModal] Drawer onOpenChange:', open);
            if (!open) {
                handleClose();
            }
        }}>
            <DrawerContent className="max-h-[96dvh]">
                <DrawerHeader>
                    <div className="flex items-center gap-3">
                        <Shield className="h-6 w-6 text-destructive" />
                        <DrawerTitle>Deshabilitar Autenticación de Dos Factores</DrawerTitle>
                    </div>
                    <DrawerDescription>
                        Para deshabilitar MFA, necesitas ingresar el código de tu app de autenticación.
                    </DrawerDescription>
                </DrawerHeader>
                <div className="overflow-y-auto p-4">
                    {content}
                </div>
            </DrawerContent>
        </Drawer>
    );
}

