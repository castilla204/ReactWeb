import React from 'react';
import { CheckCircle, AlertTriangle, Clock, XCircle, UserX, Loader2, Settings, RefreshCw, MessageCircle, HelpCircle } from 'lucide-react';
import { useExpertStripeStatus, STRIPE_STATUS } from '../hooks/useExpertStripeStatus';

interface StripeStatusCardProps {
    onSetupStripe?: () => void;
    onAccessDashboard?: () => void;
    onContactSupport?: () => void;
    className?: string;
}

const getStatusIcon = (status: string) => {
    switch (status) {
        case STRIPE_STATUS.APPROVED:
            return <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-green-600" />;
        case STRIPE_STATUS.PENDING:
            return <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" />;
        case STRIPE_STATUS.REJECTED:
            return <XCircle className="w-4 h-4 lg:w-5 lg:h-5 text-red-600" />;
        case STRIPE_STATUS.DEAUTHORIZED:
            return <UserX className="w-4 h-4 lg:w-5 lg:h-5 text-purple-600" />;
        case STRIPE_STATUS.NOT_REQUESTED:
            return null; // Sin icono para NotRequested
        default:
            return <AlertTriangle className="w-4 h-4 lg:w-5 lg:h-5 text-orange-600" />;
    }
};

const getActionIcon = (action: string) => {
    switch (action) {
        case 'setup':
            return <Settings className="w-4 h-4 lg:w-5 lg:h-5" />;
        case 'wait':
            return <Clock className="w-4 h-4 lg:w-5 lg:h-5" />;
        case 'success':
            return <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5" />;
        case 'retry':
            return <RefreshCw className="w-4 h-4 lg:w-5 lg:h-5" />;
        case 'contact':
            return <MessageCircle className="w-4 h-4 lg:w-5 lg:h-5" />;
        default:
            return <HelpCircle className="w-4 h-4 lg:w-5 lg:h-5" />;
    }
};

const getStatusIconClass = (status: string) => {
    switch (status) {
        case STRIPE_STATUS.APPROVED:
            return 'bg-green-100 text-green-600';
        case STRIPE_STATUS.PENDING:
            return 'bg-blue-100 text-blue-600';
        case STRIPE_STATUS.REJECTED:
            return 'bg-red-100 text-red-600';
        case STRIPE_STATUS.DEAUTHORIZED:
            return 'bg-purple-100 text-purple-600';
        default:
            return 'bg-orange-100 text-orange-600';
    }
};

const getStatusBadgeClass = (status: string) => {
    switch (status) {
        case STRIPE_STATUS.APPROVED:
            return 'bg-green-100 text-green-800 border-green-200';
        case STRIPE_STATUS.PENDING:
            return 'bg-blue-100 text-blue-800 border-blue-200';
        case STRIPE_STATUS.REJECTED:
            return 'bg-red-100 text-red-800 border-red-200';
        case STRIPE_STATUS.DEAUTHORIZED:
            return 'bg-purple-100 text-purple-800 border-purple-200';
        default:
            return 'bg-orange-100 text-orange-800 border-orange-200';
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

export const StripeStatusCard: React.FC<StripeStatusCardProps> = ({
    onSetupStripe,
    onAccessDashboard,
    onContactSupport,
    className = ''
}) => {
    const { status, loading, error, refetch, syncStatus, statusInfo, isPolling } = useExpertStripeStatus();
    
    console.log('StripeStatusCard render:', { 
        status: status?.stripeStatus, 
        loading, 
        error, 
        statusInfo: statusInfo?.action,
        buttonText: statusInfo?.buttonText 
    });

    if (loading) {
        return (
            <div className={`bg-white rounded-xl p-6 border border-gray-200 shadow-sm ${className}`}>
                <div className="flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Cargando estado de Stripe...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`bg-white rounded-xl p-6 border border-red-200 shadow-sm ${className}`}>
                <div className="text-center">
                    <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar estado</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={refetch}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    if (!status || !statusInfo) {
        return (
            <div className={`bg-white rounded-xl p-6 border border-gray-200 shadow-sm ${className}`}>
                <div className="text-center text-gray-500">
                    No hay datos de estado disponibles
                </div>
            </div>
        );
    }

    const handleAction = () => {
        console.log('StripeStatusCard: handleAction called with action:', statusInfo.action);
        switch (statusInfo.action) {
            case 'setup':
            case 'retry':
                console.log('StripeStatusCard: Calling onSetupStripe');
                onSetupStripe?.();
                break;
            case 'success':
                console.log('StripeStatusCard: Calling onAccessDashboard');
                onAccessDashboard?.();
                break;
            case 'wait':
                console.log('StripeStatusCard: Calling syncStatus');
                syncStatus();
                break;
            case 'contact':
                console.log('StripeStatusCard: Calling onContactSupport');
                onContactSupport?.();
                break;
        }
    };

    return (
        <div 
            className={`bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-lg p-8 lg:p-10 shadow-lg shadow-gray-200/30 w-full max-w-4xl ${className}`}
            style={{ 
                borderLeftColor: statusInfo.color,
                borderLeftWidth: '4px',
                background: `linear-gradient(135deg, ${statusInfo.bgColor}06 0%, rgba(255,255,255,0.95) 100%)`
            }}
        >
            <div className="mb-6 lg:mb-8">
                {/* Barra de progreso para NotRequested */}
                {status.stripeStatus === 'NotRequested' && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-500">Paso 1: Registro</span>
                            <span className="text-xs font-medium text-blue-600">Paso 2: Configuración</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{width: '50%'}}></div>
                        </div>
                    </div>
                )}
                
                <div className="mb-3 lg:mb-4">
                    <h3 className="text-lg lg:text-xl font-semibold text-gray-900">
                        {status.stripeStatus === 'NotRequested' ? 'Termina de Configurar tu Cuenta de Experto' : 'Estado de Cuenta de Pagos'}
                    </h3>
                </div>
                <p className="text-gray-600 text-xs lg:text-sm">
                    {status.stripeStatus === 'NotRequested' 
                        ? 'Completa la configuración de tu cuenta de pagos para finalizar tu registro como experto'
                        : 'Estado actual de tu cuenta de pagos de Atrapo'
                    }
                </p>
            </div>
            
            <div className="mb-6 lg:mb-8">
                <p className="text-gray-700 leading-relaxed text-sm lg:text-base">{statusInfo.message}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
                <button 
                    onClick={handleAction}
                    disabled={loading}
                    className={`px-4 lg:px-6 py-2 lg:py-3 text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 rounded-md shadow-sm hover:shadow-md transform hover:-translate-y-0.5 ${getButtonClass(statusInfo.action)} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {statusInfo.action === 'wait' && <Loader2 className="w-4 h-4 animate-spin" />}
                    {getActionIcon(statusInfo.action)}
                    {statusInfo.buttonText}
                </button>
                
                {statusInfo.action === 'wait' && (
                    <button 
                        onClick={syncStatus}
                        className="px-4 lg:px-6 py-2 lg:py-3 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-300 transition-all duration-300 flex items-center justify-center gap-2 rounded-md shadow-sm hover:shadow-md bg-white/80 backdrop-blur-sm transform hover:-translate-y-0.5"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Actualizar
                    </button>
                )}
            </div>
            
            {(status.stripeAccountId || status.canCreateServices || status.rejectionReason || status.stripeStatus === 'NotRequested') && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="space-y-4">
                        {status.stripeStatus === 'NotRequested' && (
                            <div className="bg-gray-50 rounded-lg p-4 lg:p-6 border border-gray-200">
                                <div className="text-xs lg:text-sm text-gray-700">
                                    <div className="font-semibold mb-2 lg:mb-3 text-sm lg:text-base text-gray-800">Documentación requerida</div>
                                    <ul className="space-y-1.5 lg:space-y-2 text-gray-600">
                                        <li className="text-xs lg:text-sm">• Documento de identidad (DNI, pasaporte o carnet de conducir)</li>
                                        <li className="text-xs lg:text-sm">• Datos de tu cuenta bancaria para recibir pagos</li>
                                        <li className="text-xs lg:text-sm">• Proceso completado en aproximadamente 5 minutos</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                        
                        {status.stripeAccountId && (
                            <div className="text-sm text-gray-600">
                                <span className="font-medium">ID de Cuenta:</span> 
                                <span className="ml-2 font-mono text-gray-800">{status.stripeAccountId}</span>
                            </div>
                        )}
                        
                        {status.canCreateServices && (
                            <div className="flex items-center gap-2 text-sm text-green-700">
                                <CheckCircle className="w-4 h-4" />
                                <span className="font-medium">Listo para trabajar - Puedes crear servicios y recibir pagos</span>
                            </div>
                        )}
                        
                        {status.rejectionReason && (
                            <div className="text-sm text-red-700">
                                <span className="font-medium">Motivo del rechazo:</span> 
                                <span className="ml-2">{status.rejectionReason}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
