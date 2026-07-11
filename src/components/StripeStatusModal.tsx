import React, { useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, Clock, XCircle, UserX } from 'lucide-react';
import { STRIPE_STATUS } from '../constants/stripeStatus';

interface StripeStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    action: 'setup' | 'wait' | 'success' | 'retry' | 'contact' | 'complete_requirements' | 'edit_account';
    canRetry?: boolean;
    stripeStatus?: string;
    statusInfo?: any;
    onAction?: () => void;
}

const getStatusIcon = (action: string) => {
    switch (action) {
        case 'success':
        case 'edit_account':
            return <CheckCircle className="w-12 h-12 text-green-600" />;
        case 'wait':
            return <Clock className="w-12 h-12 text-blue-600" />;
        case 'retry':
            return <XCircle className="w-12 h-12 text-red-600" />;
        case 'contact':
            return <UserX className="w-12 h-12 text-purple-600" />;
        case 'complete_requirements':
            return <AlertTriangle className="w-12 h-12 text-amber-500" />;
        default:
            return <AlertTriangle className="w-12 h-12 text-orange-600" />;
    }
};

// 🛡️ Round 28 MUD-CA: usar helper compartido. Antes era una copia local con
// colores divergentes (bg-orange-600/bg-amber-600/etc) → UI inconsistente
// con StripeStatusCard rebrandeada en R29.
import { getButtonClass } from '../utils/stripeStatusStyles';

const getButtonText = (action: string) => {
    switch (action) {
        case 'setup':
            return 'Configurar Cuenta Stripe';
        case 'retry':
            return 'Intentar de Nuevo';
        case 'wait':
            return 'Verificar Estado';
        case 'success':
        case 'edit_account':
            return 'Abrir panel de Stripe';
        case 'complete_requirements':
            return 'Resolver en Stripe';
        case 'contact':
            return 'Contactar Soporte';
        default:
            return 'Continuar';
    }
};

// 🛡️ MUD-CA: alias del helper compartido para mantener el nombre original
// `getStripeBadgeClass` que el componente usa abajo.
import { getStatusBadgeClass as getStripeBadgeClass } from '../utils/stripeStatusStyles';

export const StripeStatusModal: React.FC<StripeStatusModalProps> = ({
    isOpen,
    onClose,
    title,
    message,
    action,
    canRetry = false,
    stripeStatus,
    statusInfo,
    onAction
}) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            
            // Timeout de seguridad: restaurar después de 5 minutos si el modal no se cierra
            const safetyTimeout = setTimeout(() => {
                console.warn('[StripeStatusModal] Safety timeout - restoring body scroll');
                document.body.style.overflow = originalOverflow || '';
            }, 5 * 60 * 1000);

            return () => {
                document.removeEventListener('keydown', handleEscape);
                clearTimeout(safetyTimeout);
                document.body.style.overflow = originalOverflow || '';
            };
        }
    }, [isOpen, onClose]);

    // React manejará la eliminación del DOM cuando isOpen es false
    if (!isOpen) return null;

    const handleAction = () => {
        if (onAction) {
            onAction();
        }
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
            data-stripe-status-modal="true"
        >
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full my-8 max-h-[85dvh] overflow-y-auto transform transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                {/* Content */}
                <div className="p-6">
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            {getStatusIcon(action)}
                        </div>
                        
                        <p className="text-gray-700 leading-relaxed mb-6">
                            {message}
                        </p>
                        
                        {statusInfo?.deadlineText && (
                            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-sm text-amber-900">
                                    <span className="font-medium">Plazo:</span> {statusInfo.deadlineText}
                                </p>
                            </div>
                        )}
                        
                        {statusInfo?.futureRequirementsText && (
                            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-sm text-amber-900">
                                    <span className="font-medium">Requisitos detectados:</span> {statusInfo.futureRequirementsText}
                                </p>
                            </div>
                        )}
                        
                        {stripeStatus && (
                            <div className="mb-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStripeBadgeClass(stripeStatus)}`}>
                                    Estado: {stripeStatus}
                                </span>
                            </div>
                        )}
                        
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handleAction}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${getButtonClass(action)}`}
                            >
                                {getButtonText(action)}
                            </button>
                            
                            {action === 'wait' && (
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cerrar
                                </button>
                            )}
                        </div>
                        
                        {canRetry && action !== 'retry' && (
                            <div className="mt-4">
                                <button
                                    onClick={() => {
                                        // Redirigir a configuración de Stripe
                                        window.location.href = '/become-expert';
                                        onClose();
                                    }}
                                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                                >
                                    Configurar cuenta Stripe
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Hook para manejar el modal de estado de Stripe
export const useStripeStatusModal = () => {
    const [modalState, setModalState] = React.useState({
        isOpen: false,
        title: '',
        message: '',
        action: 'setup' as const,
        canRetry: false,
        stripeStatus: '',
        statusInfo: null,
        onAction: undefined as (() => void) | undefined
    });

    const showModal = (data: {
        title: string;
        message: string;
        action: 'setup' | 'wait' | 'success' | 'retry' | 'contact' | 'complete_requirements' | 'edit_account';
        canRetry?: boolean;
        stripeStatus?: string;
        statusInfo?: any;
        onAction?: () => void;
    }) => {
        setModalState({
            isOpen: true,
            ...data
        });
    };

    const hideModal = () => {
        setModalState(prev => ({ ...prev, isOpen: false }));
    };

    // Escuchar eventos del sistema
    React.useEffect(() => {
        const handleShowModal = (event: CustomEvent) => {
            showModal(event.detail);
        };

        window.addEventListener('showStripeStatusModal', handleShowModal as EventListener);
        
        return () => {
            window.removeEventListener('showStripeStatusModal', handleShowModal as EventListener);
        };
    }, []);

    return {
        modalState,
        showModal,
        hideModal
    };
};


