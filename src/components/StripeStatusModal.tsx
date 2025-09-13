import React, { useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, Clock, XCircle, UserX } from 'lucide-react';
import { STRIPE_STATUS } from '../hooks/useExpertStripeStatus';

interface StripeStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    action: 'setup' | 'wait' | 'success' | 'retry' | 'contact';
    canRetry?: boolean;
    stripeStatus?: string;
    statusInfo?: any;
    onAction?: () => void;
}

const getStatusIcon = (action: string) => {
    switch (action) {
        case 'success':
            return <CheckCircle className="w-12 h-12 text-green-600" />;
        case 'wait':
            return <Clock className="w-12 h-12 text-blue-600" />;
        case 'retry':
            return <XCircle className="w-12 h-12 text-red-600" />;
        case 'contact':
            return <UserX className="w-12 h-12 text-purple-600" />;
        default:
            return <AlertTriangle className="w-12 h-12 text-orange-600" />;
    }
};

const getButtonClass = (action: string) => {
    switch (action) {
        case 'setup':
        case 'retry':
            return 'bg-orange-600 hover:bg-orange-700 text-white';
        case 'wait':
            return 'bg-blue-600 hover:bg-blue-700 text-white';
        case 'success':
            return 'bg-green-600 hover:bg-green-700 text-white';
        case 'contact':
            return 'bg-purple-600 hover:bg-purple-700 text-white';
        default:
            return 'bg-gray-600 hover:bg-gray-700 text-white';
    }
};

const getButtonText = (action: string) => {
    switch (action) {
        case 'setup':
            return 'Configurar Cuenta Stripe';
        case 'retry':
            return 'Intentar de Nuevo';
        case 'wait':
            return 'Verificar Estado';
        case 'success':
            return 'Acceder al Dashboard';
        case 'contact':
            return 'Contactar Soporte';
        default:
            return 'Continuar';
    }
};

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
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleAction = () => {
        if (onAction) {
            onAction();
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
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
                        
                        {/* Display detailed status information if available */}
                        {stripeStatus && statusInfo?.stripeStatusDetails && statusInfo.stripeStatusDetails !== message && (
                            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    <span className="font-medium">Información adicional:</span> {statusInfo.stripeStatusDetails}
                                </p>
                            </div>
                        )}
                        
                        {stripeStatus && (
                            <div className="mb-4">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                    stripeStatus === STRIPE_STATUS.APPROVED ? 'bg-green-100 text-green-800' :
                                    stripeStatus === STRIPE_STATUS.PENDING ? 'bg-blue-100 text-blue-800' :
                                    stripeStatus === STRIPE_STATUS.REJECTED ? 'bg-red-100 text-red-800' :
                                    stripeStatus === STRIPE_STATUS.DEAUTHORIZED ? 'bg-purple-100 text-purple-800' :
                                    'bg-orange-100 text-orange-800'
                                }`}>
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
        action: 'setup' | 'wait' | 'success' | 'retry' | 'contact';
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


