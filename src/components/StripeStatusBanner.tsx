import React from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Info, AlertTriangle, X } from 'lucide-react';
import { STRIPE_STATUS } from '../constants/stripeStatus';
import { Button } from './ui/button';

interface StripeStatusBannerProps {
    stripeStatus: string;
    statusMessage: string;
    canCreateServices: boolean;
    canReceivePayments: boolean;
    onDismiss?: () => void;
    dismissed?: boolean;
}

/**
 * ✅ Banner informativo para estados de Stripe
 * 
 * - Azul (informativo): Cuando está en PendingVerification pero puede operar
 * - Rojo (error): Cuando está bloqueado y no puede operar
 */
export const StripeStatusBanner: React.FC<StripeStatusBannerProps> = ({
    stripeStatus,
    statusMessage,
    canCreateServices,
    canReceivePayments,
    onDismiss,
    dismissed = false
}) => {
    // Si está dismissado, no mostrar
    if (dismissed) return null;

    // ✅ Banner informativo: PendingVerification pero puede operar
    if (stripeStatus === STRIPE_STATUS.PENDING_VERIFICATION && (canCreateServices || canReceivePayments)) {
        return (
            <Alert className="mb-4 border-blue-200 bg-blue-50" role="status" aria-live="polite">
                <div className="flex items-start gap-3">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <AlertDescription className="text-blue-800 flex-1">
                        <div 
                            dangerouslySetInnerHTML={{ 
                                __html: statusMessage.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                            }} 
                        />
                    </AlertDescription>
                    {onDismiss && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                            onClick={onDismiss}
                            aria-label="Cerrar banner"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </Alert>
        );
    }

    // ❌ Banner de error: Bloqueado y no puede operar
    if (!canCreateServices && !canReceivePayments) {
        return (
            <Alert variant="destructive" className="mb-4" role="alert">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <AlertDescription className="flex-1">
                        <div 
                            dangerouslySetInnerHTML={{ 
                                __html: statusMessage.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                            }} 
                        />
                    </AlertDescription>
                    {onDismiss && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-red-100"
                            onClick={onDismiss}
                            aria-label="Cerrar banner"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </Alert>
        );
    }

    // No mostrar banner para otros casos
    return null;
};

