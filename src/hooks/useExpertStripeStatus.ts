import { useState, useEffect, useCallback, useRef } from 'react';
import { getAuthToken } from '../lib/auth';
import { API_CONFIG } from '../config/api';

// Estados de Stripe y sus significados (actualizados según backend)
export const STRIPE_STATUS = {
    NOT_REQUESTED: 'NotRequested',    // 0 - No ha configurado Stripe
    PENDING: 'Pending',               // 1 - Cuenta en revisión por Stripe
    APPROVED: 'Approved',             // 2 - Cuenta aprobada y puede recibir pagos
    REJECTED: 'Rejected',             // 3 - Cuenta rechazada por Stripe
    DEAUTHORIZED: 'Deauthorized'      // 4 - Cuenta desautorizada
} as const;

export type StripeStatus = typeof STRIPE_STATUS[keyof typeof STRIPE_STATUS];

export interface ExpertStatus {
    hasStripeAccount: boolean;
    hasPendingOnboarding: boolean;
    onboardingCompleted: boolean;
    stripeStatus: string; // "NotRequested" | "Pending" | "Approved" | "Rejected" | "Deauthorized"
    stripeAccountId: string | null;
    canAccessStripe: boolean;
    canCreateServices: boolean;
    canReceivePayments: boolean;
    statusMessage: string;
    canRetryOnboarding: boolean;
    rejectionReason?: string; // Solo si stripeStatus = "Rejected"
}

export interface StatusInfo {
    canCreateServices: boolean;
    canRetry: boolean;
    message: string;
    action: 'setup' | 'wait' | 'success' | 'retry' | 'contact';
    buttonText: string;
    color: string;
    bgColor: string;
}

const getStatusInfo = (status: string, rejectionReason?: string): StatusInfo => {
    const getRejectionMessage = (reason: string) => {
        switch (reason) {
            case "rejected.fraud":
                return "Tu cuenta fue rechazada por motivos de seguridad. Por favor, contacta nuestro equipo de soporte para más información.";
            case "rejected.terms_of_service":
                return "Tu cuenta fue rechazada por incumplimiento de nuestros términos de servicio.";
            case "rejected.listed":
                return "Tu cuenta fue rechazada por problemas de cumplimiento normativo.";
            default:
                return "Tu solicitud de cuenta de pagos fue rechazada. Por favor, revisa la información proporcionada e intenta nuevamente.";
        }
    };

    switch (status) {
        case STRIPE_STATUS.NOT_REQUESTED:
            return {
                canCreateServices: false,
                canRetry: true,
                message: "Para completar tu registro como experto, necesitas configurar tu cuenta de pagos. Este proceso es obligatorio y te permitirá recibir pagos por los servicios que ofrezcas. El proceso es seguro y se completa en pocos minutos.",
                action: "setup",
                buttonText: "Configurar Cuenta de Pagos",
                color: "#3b82f6",
                bgColor: "#eff6ff"
            };
        
        case STRIPE_STATUS.PENDING:
            return {
                canCreateServices: false,
                canRetry: false,
                message: "Tu solicitud está siendo revisada por nuestro equipo. Este proceso suele tomar entre 1-3 días hábiles. Te notificaremos cuando esté lista.",
                action: "wait",
                buttonText: "Verificar Estado",
                color: "#f59e0b",
                bgColor: "#fffbeb"
            };
        
        case STRIPE_STATUS.APPROVED:
            return {
                canCreateServices: true,
                canRetry: false,
                message: "¡Excelente! Tu cuenta de pagos está activa y lista para recibir pagos. Ya puedes empezar a ofrecer servicios y generar ingresos.",
                action: "success",
                buttonText: "Acceder al Panel",
                color: "#10b981",
                bgColor: "#ecfdf5"
            };
        
        case STRIPE_STATUS.REJECTED:
            return {
                canCreateServices: false,
                canRetry: true,
                message: rejectionReason ? getRejectionMessage(rejectionReason) : "Tu solicitud de cuenta de pagos fue rechazada. Por favor, revisa la información proporcionada e intenta nuevamente.",
                action: "retry",
                buttonText: "Reintentar Solicitud",
                color: "#ef4444",
                bgColor: "#fef2f2"
            };
        
        case STRIPE_STATUS.DEAUTHORIZED:
            return {
                canCreateServices: false,
                canRetry: true,
                message: "Tu cuenta de pagos ha sido desactivada. Por favor, contacta nuestro equipo de soporte para reactivarla o configurar una nueva cuenta.",
                action: "contact",
                buttonText: "Contactar Soporte",
                color: "#8b5cf6",
                bgColor: "#faf5ff"
            };
        
        default:
            return {
                canCreateServices: false,
                canRetry: true,
                message: "Estado de cuenta no reconocido. Por favor, contacta soporte para verificar tu estado.",
                action: "setup",
                buttonText: "Verificar Estado",
                color: "#6b7280",
                bgColor: "#f9fafb"
            };
    }
};

export const getExpertStatus = async (): Promise<ExpertStatus> => {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    console.log('🔄 Calling expert-status endpoint...');
    const startTime = Date.now();

    try {
        const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.subscription.expertStatus}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const duration = Date.now() - startTime;
        console.log(`⏱️ expert-status response time: ${duration}ms`);
        
        if (!response.ok) {
            console.error(`❌ expert-status failed: ${response.status} ${response.statusText}`);
            throw new Error(`Failed to get expert status: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ expert-status data received:', data);
        return data;
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`❌ expert-status error after ${duration}ms:`, error);
        throw error;
    }
};

export const syncStripeStatus = async (): Promise<ExpertStatus> => {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.subscription.syncStripeStatus}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error('Failed to sync status');
    }
    
    return await response.json();
};

export const useExpertStripeStatus = () => {
    const [status, setStatus] = useState<ExpertStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const [lastFetch, setLastFetch] = useState<number>(0);
    // Control de llamadas concurrentes usando ref
    const [hasInitialized, setHasInitialized] = useState(false); // Control de inicialización
    
    // Refs para acceder a valores actuales sin causar re-renders
    const statusRef = useRef<ExpertStatus | null>(null);
    const lastFetchRef = useRef<number>(0);
    const isFetchingRef = useRef<boolean>(false);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    
    const CACHE_DURATION = 30000; // 30 segundos

    const fetchStatus = useCallback(async (force = false) => {
        const now = Date.now();
        
        // Evitar llamadas concurrentes
        if (isFetchingRef.current) {
            console.log('⏳ useExpertStripeStatus: Already fetching, skipping...');
            return;
        }
        
        // Verificar cache si no es forzado
        if (!force && statusRef.current && (now - lastFetchRef.current) < CACHE_DURATION) {
            console.log('📋 useExpertStripeStatus: Using cached data (age:', Math.round((now - lastFetchRef.current) / 1000), 's)');
            return;
        }

        console.log('🔄 useExpertStripeStatus: Fetching status (force:', force, ')');
        
        try {
            isFetchingRef.current = true;
            setLoading(true);
            setError(null);
            const statusData = await getExpertStatus();
            setStatus(statusData);
            statusRef.current = statusData;
            setLastFetch(now);
            lastFetchRef.current = now;
            console.log('✅ useExpertStripeStatus: Status updated successfully');
        } catch (err: any) {
            setError(err.message);
            console.error('❌ useExpertStripeStatus: Error fetching status:', err);
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    }, []); // Sin dependencias para evitar recreaciones

    const syncStatus = async () => {
        try {
            setLoading(true);
            const syncedData = await syncStripeStatus();
            setStatus(syncedData);
            statusRef.current = syncedData;
            const now = Date.now();
            setLastFetch(now);
            lastFetchRef.current = now;
            return syncedData;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Mantener refs sincronizados con el estado
    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    useEffect(() => {
        lastFetchRef.current = lastFetch;
    }, [lastFetch]);

    // Cargar estado inicial solo una vez
    useEffect(() => {
        if (!hasInitialized) {
            console.log('🚀 useExpertStripeStatus: Initial load');
            setHasInitialized(true);
            
            // Llamada directa sin usar fetchStatus para evitar dependencias
            const loadInitialStatus = async () => {
                try {
                    setLoading(true);
                    setError(null);
                    const statusData = await getExpertStatus();
                    setStatus(statusData);
                    statusRef.current = statusData;
                    const now = Date.now();
                    setLastFetch(now);
                    lastFetchRef.current = now;
                    console.log('✅ useExpertStripeStatus: Initial status loaded');
                } catch (err: any) {
                    setError(err.message);
                    console.error('❌ useExpertStripeStatus: Error loading initial status:', err);
                } finally {
                    setLoading(false);
                }
            };
            
            loadInitialStatus();
        }
    }, [hasInitialized]);

    // Polling automático solo para estados que pueden cambiar
    useEffect(() => {
        if (!status) return;

        // Solo hacer polling para PENDING, no para REJECTED
        const needsPolling = status.stripeStatus === STRIPE_STATUS.PENDING || 
                           (!status.onboardingCompleted && status.hasStripeAccount);

        if (needsPolling && !pollingIntervalRef.current) {
            console.log('🔄 useExpertStripeStatus: Starting polling for status:', status.stripeStatus);
            setIsPolling(true);
            pollingIntervalRef.current = setInterval(() => {
                console.log('⏰ useExpertStripeStatus: Polling check');
                fetchStatus(false);
            }, 60000); // 1 minuto
        } else if (!needsPolling && pollingIntervalRef.current) {
            console.log('⏹️ useExpertStripeStatus: Stopping polling');
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
            setIsPolling(false);
        }

        // Cleanup function
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, [status?.stripeStatus, status?.onboardingCompleted, status?.hasStripeAccount]);

    // Detener polling y limpiar cache cuando el estado es estable
    useEffect(() => {
        if (status?.stripeStatus === STRIPE_STATUS.APPROVED && status?.onboardingCompleted) {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
                setIsPolling(false);
            }
            
            // Limpiar cache cuando el estado cambia a aprobado
            console.log('🧹 useExpertStripeStatus: Clearing cache - status changed to APPROVED');
            lastFetchRef.current = 0;
            setLastFetch(0);
        }
    }, [status?.stripeStatus, status?.onboardingCompleted]);

    return {
        status,
        loading,
        error,
        refetch: () => fetchStatus(true),
        syncStatus,
        statusInfo: status ? getStatusInfo(status.stripeStatus, status.rejectionReason) : null,
        isPolling
    };
};

// Función de validación para usar antes de crear servicios
export const validateBeforeCreatingService = async (cachedStatus?: ExpertStatus | null): Promise<boolean> => {
    try {
        let status: ExpertStatus;
        
        // Usar status en cache si está disponible y es reciente (menos de 2 minutos)
        if (cachedStatus) {
            status = cachedStatus;
        } else {
            status = await getExpertStatus();
        }
        
        if (!status.canCreateServices) {
            const statusInfo = getStatusInfo(status.stripeStatus, status.rejectionReason);
            
            // Disparar evento para mostrar modal de estado
            window.dispatchEvent(new CustomEvent('showStripeStatusModal', {
                detail: {
                    title: "No se puede crear el servicio",
                    message: statusInfo.message,
                    action: statusInfo.action,
                    canRetry: statusInfo.canRetry,
                    stripeStatus: status.stripeStatus,
                    statusInfo
                }
            }));
            
            return false;
        }
        
        return true;
    } catch (error: any) {
        console.error('Error validating expert status:', error);
        window.dispatchEvent(new CustomEvent('showNotification', {
            detail: {
                type: 'error',
                message: 'No se pudo verificar el estado de tu cuenta. Por favor, inténtalo de nuevo.',
            },
        }));
        return false;
    }
};

// Función para manejar errores específicos de Stripe
export const handleStripeServiceError = (error: any) => {
    if (error.stripeStatus) {
        const statusInfo = getStatusInfo(error.stripeStatus);
        
        window.dispatchEvent(new CustomEvent('showStripeStatusModal', {
            detail: {
                title: "Problema con la cuenta",
                message: error.message || statusInfo.message,
                stripeStatus: error.stripeStatus,
                requiresStripeSetup: error.requiresStripeSetup,
                canRetry: error.canRetry,
                statusInfo,
                onAction: () => {
                    if (error.requiresStripeSetup || error.canRetry) {
                        // Redirigir a configuración de Stripe
                        window.location.href = '/become-expert';
                    }
                }
            }
        }));
    } else {
        window.dispatchEvent(new CustomEvent('showNotification', {
            detail: {
                type: 'error',
                message: error.message || 'Ocurrió un error inesperado',
            },
        }));
    }
};
