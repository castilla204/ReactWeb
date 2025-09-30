import React from 'react';
import { CheckCircle, AlertTriangle, Clock, XCircle, UserX } from 'lucide-react';
import { STRIPE_STATUS } from '../hooks/useExpertStripeStatus';

interface StripeStatusComponentProps {
    stripeStatus: string;
    stripeStatusDetails: string | null;
    className?: string;
    showIcon?: boolean;
    showDetails?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const getStatusIcon = (status: string, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    };
    
    const iconClass = sizeClasses[size];
    
    switch (status) {
        case STRIPE_STATUS.APPROVED:
            return <CheckCircle className={`${iconClass} text-green-600`} />;
        case STRIPE_STATUS.PENDING:
            return <Clock className={`${iconClass} text-blue-600`} />;
        case STRIPE_STATUS.REJECTED:
            return <XCircle className={`${iconClass} text-red-600`} />;
        case STRIPE_STATUS.DEAUTHORIZED:
            return <UserX className={`${iconClass} text-purple-600`} />;
        case STRIPE_STATUS.NOT_REQUESTED:
            return null; // Sin icono para NotRequested
        default:
            return <AlertTriangle className={`${iconClass} text-orange-600`} />;
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case STRIPE_STATUS.APPROVED:
            return 'text-green-600 bg-green-100 border-green-200';
        case STRIPE_STATUS.PENDING:
            return 'text-blue-600 bg-blue-100 border-blue-200';
        case STRIPE_STATUS.REJECTED:
            return 'text-red-600 bg-red-100 border-red-200';
        case STRIPE_STATUS.DEAUTHORIZED:
            return 'text-purple-600 bg-purple-100 border-purple-200';
        case STRIPE_STATUS.NOT_REQUESTED:
            return 'text-gray-600 bg-gray-100 border-gray-200';
        default:
            return 'text-orange-600 bg-orange-100 border-orange-200';
    }
};

const getStatusText = (status: string) => {
    switch (status) {
        case STRIPE_STATUS.APPROVED:
            return 'Aprobado';
        case STRIPE_STATUS.PENDING:
            return 'Pendiente';
        case STRIPE_STATUS.REJECTED:
            return 'Rechazado';
        case STRIPE_STATUS.DEAUTHORIZED:
            return 'Desautorizado';
        case STRIPE_STATUS.NOT_REQUESTED:
            return 'No configurado';
        default:
            return 'Desconocido';
    }
};

const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
        case 'sm':
            return {
                container: 'px-2 py-1 text-xs',
                icon: 'w-3 h-3',
                text: 'text-xs'
            };
        case 'md':
            return {
                container: 'px-3 py-1 text-sm',
                icon: 'w-4 h-4',
                text: 'text-sm'
            };
        case 'lg':
            return {
                container: 'px-4 py-2 text-base',
                icon: 'w-5 h-5',
                text: 'text-base'
            };
    }
};

export const StripeStatusComponent: React.FC<StripeStatusComponentProps> = ({
    stripeStatus,
    stripeStatusDetails,
    className = '',
    showIcon = true,
    showDetails = false,
    size = 'md'
}) => {
    const sizeClasses = getSizeClasses(size);
    const statusColor = getStatusColor(stripeStatus);
    const statusText = getStatusText(stripeStatus);
    const statusIcon = getStatusIcon(stripeStatus, size);

    return (
        <div className={`inline-flex items-center gap-2 ${className}`}>
            {/* Status Badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-medium ${statusColor} ${sizeClasses.container}`}>
                {showIcon && statusIcon && (
                    <span className="flex-shrink-0">
                        {statusIcon}
                    </span>
                )}
                <span className={sizeClasses.text}>
                    {statusText}
                </span>
            </div>
            
            {/* Detailed Information */}
            {showDetails && stripeStatusDetails && (
                <div className="text-gray-600">
                    <span className={`${sizeClasses.text} font-medium`}>Detalles:</span>
                    <span className={`${sizeClasses.text} ml-1`}>{stripeStatusDetails}</span>
                </div>
            )}
        </div>
    );
};

// Hook for managing Stripe status display
export const useStripeStatusDisplay = () => {
    const getStatusInfo = (status: string, details: string | null) => {
        return {
            status,
            details,
            isApproved: status === STRIPE_STATUS.APPROVED,
            isPending: status === STRIPE_STATUS.PENDING,
            isRejected: status === STRIPE_STATUS.REJECTED,
            isDeauthorized: status === STRIPE_STATUS.DEAUTHORIZED,
            isNotRequested: status === STRIPE_STATUS.NOT_REQUESTED,
            canCreateServices: status === STRIPE_STATUS.APPROVED,
            needsOnboarding: status === STRIPE_STATUS.NOT_REQUESTED || status === STRIPE_STATUS.REJECTED,
            shouldShowDetails: details && details.trim().length > 0
        };
    };

    const getNotificationMessage = (status: string, details: string | null) => {
        const baseMessage = details || 'Estado de cuenta actualizado';
        
        switch (status) {
            case STRIPE_STATUS.APPROVED:
                return {
                    type: 'success' as const,
                    title: '¡Cuenta Aprobada!',
                    message: baseMessage
                };
            case STRIPE_STATUS.REJECTED:
                return {
                    type: 'error' as const,
                    title: 'Cuenta Rechazada',
                    message: baseMessage
                };
            case STRIPE_STATUS.PENDING:
                return {
                    type: 'info' as const,
                    title: 'Verificación en Proceso',
                    message: baseMessage
                };
            case STRIPE_STATUS.DEAUTHORIZED:
                return {
                    type: 'warning' as const,
                    title: 'Cuenta Desautorizada',
                    message: baseMessage
                };
            default:
                return {
                    type: 'info' as const,
                    title: 'Estado Actualizado',
                    message: baseMessage
                };
        }
    };

    return {
        getStatusInfo,
        getNotificationMessage
    };
};
















