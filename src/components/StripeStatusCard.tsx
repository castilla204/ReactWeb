import React from 'react';
import { CheckCircle, AlertTriangle, Clock, XCircle, UserX, Loader2, Settings, RefreshCw, MessageCircle, HelpCircle } from 'lucide-react';
import type { ExpertStripeStatusResult } from '../hooks/useExpertStripeStatus';
import { STRIPE_STATUS } from '../constants/stripeStatus';
import { ErrorDisplay } from './ErrorDisplay';
import { Empty, EmptyMedia, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent } from './ui/empty';

interface StripeStatusCardProps {
    stripe: ExpertStripeStatusResult;
    onSetupStripe?: () => void;
    onAccessDashboard?: () => void;
    onContactSupport?: () => void;
    className?: string;
    isLoadingOnboarding?: boolean;
}

const getStatusIcon = (status: string) => {
    switch (status) {
        case STRIPE_STATUS.APPROVED:
            return <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-green-600" />;
        case STRIPE_STATUS.PENDING:
        case STRIPE_STATUS.PENDING_VERIFICATION:
            return <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" />;
        case STRIPE_STATUS.ACTION_REQUIRED:
        case STRIPE_STATUS.REQUIREMENTS_DUE:
        case STRIPE_STATUS.RESTRICTED_SOON:
            return <AlertTriangle className="w-4 h-4 lg:w-5 lg:h-5 text-amber-500" />;
        case STRIPE_STATUS.REQUIREMENTS_PAST_DUE:
        case STRIPE_STATUS.RESTRICTED:
            return <AlertTriangle className="w-4 h-4 lg:w-5 lg:h-5 text-orange-600" />;
        case STRIPE_STATUS.DISABLED:
        case STRIPE_STATUS.REJECTED:
            return <XCircle className="w-4 h-4 lg:w-5 lg:h-5 text-red-600" />;
        case STRIPE_STATUS.DEAUTHORIZED:
            return <UserX className="w-4 h-4 lg:w-5 lg:h-5 text-purple-600" />;
        case STRIPE_STATUS.NOT_REQUESTED:
            return <AlertTriangle className="w-4 h-4 lg:w-5 lg:h-5 text-gray-500" />;
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
        case 'complete_requirements':
            return <AlertTriangle className="w-4 h-4 lg:w-5 lg:h-5" />;
        case 'edit_account':
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

// 🛡️ Round 28 MUD-CA: helpers movidos a utils/stripeStatusStyles.ts para
// compartir con StripeStatusModal y StripeStatusBanner — antes había 3 copias
// con colores divergentes. Importamos del módulo central.
import { getStatusIconClass, getStatusBadgeClass, getButtonClass } from '../utils/stripeStatusStyles';

export const StripeStatusCard: React.FC<StripeStatusCardProps> = ({
    stripe,
    onSetupStripe,
    onAccessDashboard,
    onContactSupport,
    className = '',
    isLoadingOnboarding = false
}) => {
    const { status, loading, error, refetch, syncStatus, statusInfo, isPolling } = stripe;

    // 🛡️ Round 28 v2: parseamos el stripeStatusDetails una sola vez. Patrones del backend:
    //   - "Requisitos pendientes: A, B, C." → chips ámbar (currently_due)
    //   - "Stripe indicó requisitos vencidos: D, E." → chips ROJO (past_due)
    //   - "Errores a corregir: X (Y); Z (W)." → bullets rojos
    // El "headline" es todo lo que está ANTES del primer bloque (mensaje corto del backend).
    const parsedStatus = (() => {
        const details = status?.stripeStatusDetails || statusInfo?.message || '';
        const rxPending = /Requisitos pendientes:\s*([^.]+)\./i;
        const rxPastDue = /(?:Stripe indicó )?requisitos vencidos:\s*([^.]+)\./i;
        const rxErrors = /Errores a corregir:\s*([^.]+)\./i;
        const pending = rxPending.exec(details)?.[1]?.split(',').map(s => s.trim()).filter(Boolean) || [];
        const pastDue = rxPastDue.exec(details)?.[1]?.split(',').map(s => s.trim()).filter(Boolean) || [];
        const errors = rxErrors.exec(details)?.[1]?.split(';').map(s => s.trim()).filter(Boolean) || [];
        const totalPending = pending.length + pastDue.length;
        const headline = details.split(/Requisitos pendientes:|requisitos vencidos:|Errores a corregir:/i)[0].trim();
        return { headline, pending, pastDue, errors, totalPending };
    })();

    console.log('StripeStatusCard render:', {
        status: status?.stripeStatus,
        loading,
        error,
        statusInfo: statusInfo?.action,
        buttonText: statusInfo?.buttonText,
        parsedStatus
    });

    if (loading) {
        return (
            <Empty className={`py-12 ${className}`}>
                <EmptyMedia variant="icon">
                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                </EmptyMedia>
                <EmptyHeader>
                    <EmptyDescription className="text-xs text-gray-500">
                        Cargando estado de Stripe...
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    if (error) {
        return (
            <ErrorDisplay
                message={error}
                onRetry={refetch}
                fullScreen={false}
                className={className}
            />
        );
    }

    if (!status || !statusInfo) {
        return (
            <Empty className={`py-12 ${className}`}>
                <EmptyMedia variant="icon">
                    <AlertTriangle className="w-5 h-5 text-gray-400" />
                </EmptyMedia>
                <EmptyHeader>
                    <EmptyDescription className="text-xs text-gray-500">
                        No hay datos de estado disponibles
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
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
            case 'complete_requirements':
            case 'edit_account':
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

    const futureRequirementsText = status.stripeFutureRequirements || statusInfo.futureRequirementsText;

    // Para NOT_REQUESTED, usar diseño discreto con Empty
    if (status.stripeStatus === STRIPE_STATUS.NOT_REQUESTED) {
        return (
            <div className={`w-full max-w-4xl ${className}`}>
                <Empty className="py-12">
                    <EmptyMedia variant="icon">
                        <Settings className="w-5 h-5 text-gray-400" />
                    </EmptyMedia>
                    <EmptyHeader>
                        <EmptyTitle className="text-base font-medium text-gray-900">
                            Termina de Configurar tu Cuenta de Experto
                        </EmptyTitle>
                        <EmptyDescription className="text-sm text-gray-500 mt-2 max-w-md">
                            {statusInfo.message}
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        {/* Barra de progreso discreta */}
                        <div className="mt-6 mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-400">Paso 1: Registro</span>
                                <span className="text-xs font-medium text-gray-600">Paso 2: Configuración</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1">
                                <div className="bg-gray-400 h-1 rounded-full" style={{width: '50%'}}></div>
                            </div>
                        </div>
                        
                        {/* Botón de acción */}
                        {(status.stripeStatus !== STRIPE_STATUS.REJECTED || status.canRetryOnboarding !== false) && (
                            <button 
                                onClick={handleAction}
                                disabled={loading || isLoadingOnboarding}
                                className={`px-6 py-2.5 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 rounded-lg ${getButtonClass(statusInfo.action)} ${(loading || isLoadingOnboarding) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {(statusInfo.action === 'wait' || isLoadingOnboarding) && <Loader2 className="w-4 h-4 animate-spin" />}
                                {!isLoadingOnboarding && getActionIcon(statusInfo.action)}
                                {isLoadingOnboarding ? 'Cargando...' : statusInfo.buttonText}
                            </button>
                        )}
                        
                        {/* Documentación requerida - discreta */}
                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <p className="text-xs text-gray-500 mb-3">Documentación requerida:</p>
                            <ul className="space-y-1.5 text-xs text-gray-400">
                                <li>• Documento de identidad (DNI, pasaporte o carnet de conducir)</li>
                                <li>• Datos de tu cuenta bancaria para recibir pagos</li>
                                <li>• Proceso completado en aproximadamente 5 minutos</li>
                            </ul>
                        </div>
                    </EmptyContent>
                </Empty>
            </div>
        );
    }

    // Para otros estados, mantener el diseño original pero más discreto
    return (
        <div className={`w-full max-w-4xl ${className}`}>
            <Empty className="py-12">
                <EmptyMedia variant="icon">
                    {getStatusIcon(status.stripeStatus)}
                </EmptyMedia>
                <EmptyHeader>
                    <EmptyTitle className="text-base font-medium text-gray-900">
                        Estado de Cuenta de Pagos
                    </EmptyTitle>
                    <EmptyDescription className="text-sm text-gray-600 mt-2 max-w-md">
                        {parsedStatus.headline || statusInfo.message}
                    </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                    {parsedStatus.totalPending > 0 && (
                        <p className="text-sm font-semibold text-gray-900 mt-2">
                            Te falta{parsedStatus.totalPending !== 1 ? 'n' : ''} {parsedStatus.totalPending} {parsedStatus.totalPending === 1 ? 'detalle' : 'detalles'} por rellenar
                        </p>
                    )}

                    {/* Requisitos VENCIDOS (rojo) */}
                    {parsedStatus.pastDue.length > 0 && (
                        <div className="mt-3 text-left max-w-md mx-auto">
                            <p className="text-xs font-semibold uppercase tracking-wide text-red-700 mb-2">⏰ Vencidos · acción urgente</p>
                            <ul className="space-y-1.5">
                                {parsedStatus.pastDue.map((item, i) => (
                                    <li key={`past-${i}`} className="flex items-start gap-2 text-sm">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                                        <span className="text-red-900 font-medium">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Requisitos PENDIENTES (ámbar) */}
                    {parsedStatus.pending.length > 0 && (
                        <div className="mt-3 text-left max-w-md mx-auto">
                            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-2">📋 Por completar</p>
                            <ul className="space-y-1.5">
                                {parsedStatus.pending.map((item, i) => (
                                    <li key={`pending-${i}`} className="flex items-start gap-2 text-sm">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                                        <span className="text-gray-800">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Errores específicos — fondo blanco siempre (preferencia usuario: sin amarillos/ámbares) */}
                    {parsedStatus.errors.length > 0 && (
                        <div className="mt-3 text-left max-w-md mx-auto bg-white border border-gray-200 rounded-lg p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-red-700 mb-2">⚠️ Problemas detectados</p>
                            <ul className="space-y-1">
                                {parsedStatus.errors.map((err, i) => (
                                    <li key={`err-${i}`} className="text-xs text-red-700 leading-snug">
                                        {err}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Mensaje tranquilizador cuando hay requirements pendientes */}
                    {parsedStatus.totalPending > 0 && (
                        <p className="text-xs text-gray-500 mt-4 italic max-w-md mx-auto">
                            ✨ En cuanto rellenes estos datos en Stripe, tu cuenta se activará <strong>automáticamente</strong>.
                        </p>
                    )}

                    {(statusInfo.deadlineText || futureRequirementsText) && (
                        <div className="mt-3 space-y-2 max-w-md mx-auto">
                            {statusInfo.deadlineText && (
                                <p className="text-xs inline-flex items-center gap-1.5 bg-white border border-gray-200 px-2.5 py-1 rounded-full">
                                    <Clock className="w-3 h-3 text-orange-600" />
                                    <span className="font-medium text-gray-900">{statusInfo.deadlineText}</span>
                                </p>
                            )}
                            {futureRequirementsText && (
                                <p className="text-xs text-gray-500 text-left">
                                    <span className="font-medium">Próximos requisitos:</span> {futureRequirementsText}
                                </p>
                            )}
                        </div>
                    )}
                    
                    {/* Botón de acción */}
                    {(status.stripeStatus !== STRIPE_STATUS.REJECTED || status.canRetryOnboarding !== false) && (
                        <div className="mt-6">
                            <button 
                                onClick={handleAction}
                                disabled={loading || isLoadingOnboarding}
                                className={`px-6 py-2.5 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 rounded-lg ${getButtonClass(statusInfo.action)} ${(loading || isLoadingOnboarding) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {(statusInfo.action === 'wait' || isLoadingOnboarding) && <Loader2 className="w-4 h-4 animate-spin" />}
                                {!isLoadingOnboarding && getActionIcon(statusInfo.action)}
                                {isLoadingOnboarding ? 'Cargando...' : statusInfo.buttonText}
                            </button>
                        </div>
                    )}
                    
                    {/* Mostrar información de contacto cuando Rejected y canRetryOnboarding es false */}
                    {status.stripeStatus === STRIPE_STATUS.REJECTED && status.canRetryOnboarding === false && (
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <p className="text-xs text-gray-500">
                                <span className="font-medium">Soporte técnico:</span>{' '}
                                <a href="mailto:info@inspecciono.io" className="text-gray-600 hover:text-gray-700 underline">
                                    info@inspecciono.io
                                </a>
                            </p>
                        </div>
                    )}
                    
                    {/* Información adicional */}
                    {(status.stripeAccountId || status.canCreateServices || status.rejectionReason) && (
                        <div className="mt-6 pt-6 border-t border-gray-100 space-y-2">
                            {status.stripeAccountId && (
                                <p className="text-xs text-gray-500">
                                    <span className="font-medium">ID de Cuenta:</span> 
                                    <span className="ml-2 font-mono text-gray-600">{status.stripeAccountId}</span>
                                </p>
                            )}
                            
                            {status.canCreateServices && (
                                <p className="text-xs text-gray-500 flex items-center gap-2">
                                    <CheckCircle className="w-3 h-3 text-gray-400" />
                                    <span>Listo para trabajar - Puedes crear servicios y recibir pagos</span>
                                </p>
                            )}
                            
                            {!status.canReceivePayments && status.stripeStatus !== STRIPE_STATUS.NOT_REQUESTED && (
                                <p className="text-xs text-gray-500 flex items-center gap-2">
                                    <XCircle className="w-3 h-3 text-gray-400" />
                                    <span>Los pagos están bloqueados hasta completar los requisitos en Stripe</span>
                                </p>
                            )}
                            
                            {status.rejectionReason && (
                                <p className="text-xs text-gray-500">
                                    <span className="font-medium">Motivo del rechazo:</span> 
                                    <span className="ml-2">{status.rejectionReason}</span>
                                </p>
                            )}
                        </div>
                    )}
                </EmptyContent>
            </Empty>
        </div>
    );
};
