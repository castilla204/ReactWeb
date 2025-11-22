import React, { createContext, useContext, useState, useCallback } from 'react';
import { MFAVerify } from '../components/MFAVerify';
import { Dialog, DialogContent } from '../components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '../components/ui/drawer';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface MfaVerificationContextType {
    showVerification: (onSuccess?: () => void | Promise<any>) => void;
    hideVerification: () => void;
    isOpen: boolean;
    hasPendingVerification: () => boolean; // ✅ Verificar si hay verificación pendiente
}

const MfaVerificationContext = createContext<MfaVerificationContextType | undefined>(undefined);

export const MfaVerificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [onSuccessCallback, setOnSuccessCallback] = useState<(() => void | Promise<any>) | undefined>(undefined);
    const [isVerified, setIsVerified] = useState(false);
    const isDesktop = useMediaQuery('(min-width: 768px)');

    const showVerification = useCallback((onSuccess?: () => void | Promise<any>) => {
        setOnSuccessCallback(() => onSuccess);
        setIsOpen(true);
    }, []);

    const hideVerification = useCallback((force: boolean = false) => {
        // ✅ Solo permitir cerrar si está verificado, si se fuerza, o si el usuario cancela explícitamente
        if (!force && !isVerified) {
            // No cerrar si no está verificado - el usuario debe usar el botón cancelar
            return;
        }
        setIsOpen(false);
        setOnSuccessCallback(undefined);
        setIsVerified(false);
        localStorage.removeItem('mfa-verification-pending');
    }, [isVerified]);

    const handleSuccess = useCallback(async () => {
        setIsVerified(true);
        if (onSuccessCallback) {
            await onSuccessCallback();
        }
        // ✅ Limpiar verificación pendiente INMEDIATAMENTE
        console.log('[MfaVerificationContext] Removing mfa-verification-pending from localStorage');
        localStorage.removeItem('mfa-verification-pending');
        
        // ✅ Disparar evento múltiples veces para asegurar que se capture
        window.dispatchEvent(new CustomEvent('mfaVerificationCleared'));
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('mfaVerificationCleared'));
        }, 50);
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('mfaVerificationCleared'));
        }, 200);
        
        // ✅ Cerrar el modal/drawer después de verificación exitosa
        setTimeout(() => {
            setIsOpen(false);
            setOnSuccessCallback(undefined);
            setIsVerified(false);
        }, 100);
    }, [onSuccessCallback]);
    
    const handleCancel = useCallback(() => {
        // ✅ Permitir cancelar explícitamente
        setIsOpen(false);
        setOnSuccessCallback(undefined);
        setIsVerified(false);
        // ✅ Mantener verificación pendiente para mostrar botón en home
        localStorage.setItem('mfa-verification-pending', 'true');
    }, []);

    const hasPendingVerification = useCallback(() => {
        return localStorage.getItem('mfa-verification-pending') === 'true';
    }, []);

    // ✅ Escuchar eventos del interceptor
    React.useEffect(() => {
        const handleShowVerification = (event: CustomEvent) => {
            showVerification(event.detail?.onSuccess);
        };

        window.addEventListener('showMfaVerification', handleShowVerification as EventListener);
        
        return () => {
            window.removeEventListener('showMfaVerification', handleShowVerification as EventListener);
        };
    }, [showVerification]);

    const content = (
        <MFAVerify 
            onSuccess={handleSuccess} 
            onCancel={handleCancel}
            onVerificationStarted={() => setIsVerified(false)}
            onVerificationCompleted={() => setIsVerified(true)}
        />
    );

    return (
        <MfaVerificationContext.Provider value={{ showVerification, hideVerification, isOpen, hasPendingVerification }}>
            {children}
            {isDesktop ? (
                <Dialog open={isOpen} onOpenChange={(open) => {
                    // ✅ Prevenir cierre si no está verificado
                    if (!open && !isVerified) {
                        return; // No cerrar
                    }
                    if (!open) {
                        hideVerification();
                    }
                }}>
                    <DialogContent className="sm:max-w-md" onEscapeKeyDown={(e) => {
                        // ✅ Prevenir cierre con ESC si no está verificado
                        if (!isVerified) {
                            e.preventDefault();
                        }
                    }} onPointerDownOutside={(e) => {
                        // ✅ Prevenir cierre haciendo clic fuera si no está verificado
                        if (!isVerified) {
                            e.preventDefault();
                        }
                    }}>
                        {content}
                    </DialogContent>
                </Dialog>
            ) : (
                <Drawer 
                    open={isOpen} 
                    onOpenChange={(open) => {
                        // ✅ Prevenir cierre si no está verificado
                        if (!open && !isVerified) {
                            return; // No cerrar
                        }
                        if (!open) {
                            hideVerification();
                        }
                    }}
                    modal={true}
                    shouldScaleBackground={false}
                >
                    <DrawerContent 
                        className="max-h-[96vh]"
                        onPointerDownOutside={(e) => {
                            // ✅ Prevenir cierre haciendo clic fuera si no está verificado
                            if (!isVerified) {
                                e.preventDefault();
                            }
                        }}
                        onEscapeKeyDown={(e) => {
                            // ✅ Prevenir cierre con ESC si no está verificado
                            if (!isVerified) {
                                e.preventDefault();
                            }
                        }}
                    >
                        <DrawerHeader className="sr-only">
                            <DrawerTitle>Verificación de Dos Factores</DrawerTitle>
                            <DrawerDescription>Ingresa el código de tu app de autenticación</DrawerDescription>
                        </DrawerHeader>
                        <div className="overflow-y-auto p-4 max-h-[calc(96vh-56px)]">
                            {content}
                        </div>
                    </DrawerContent>
                </Drawer>
            )}
        </MfaVerificationContext.Provider>
    );
};

export const useMfaVerification = () => {
    const context = useContext(MfaVerificationContext);
    if (!context) {
        throw new Error('useMfaVerification must be used within MfaVerificationProvider');
    }
    return context;
};

