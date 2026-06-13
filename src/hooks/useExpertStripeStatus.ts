import { useState, useEffect, useCallback, useRef } from 'react';
import i18n from '../i18n';
import { getAuthToken } from '../lib/auth';
import { API_CONFIG } from '../config/api';
import { ExpertStatusResponse, StripeSyncStatusResponse, StripeStatus } from '../types/stripe';
import { handleStripeStatusChange } from '../utils/stripeNotifications';
import { STRIPE_STATUS } from '../constants/stripeStatus';

const POLLING_STATUSES = new Set<string>([
    STRIPE_STATUS.PENDING,
    STRIPE_STATUS.ACTION_REQUIRED,
    STRIPE_STATUS.PENDING_VERIFICATION,
    STRIPE_STATUS.REQUIREMENTS_DUE,
    STRIPE_STATUS.REQUIREMENTS_PAST_DUE,
    STRIPE_STATUS.RESTRICTED_SOON,
    STRIPE_STATUS.RESTRICTED
]);

export interface StatusInfo {
    canCreateServices: boolean;
    canRetry: boolean;
    message: string;
    action: 'setup' | 'wait' | 'success' | 'retry' | 'contact' | 'complete_requirements' | 'edit_account';
    buttonText: string;
    color: string;
    bgColor: string;
    deadlineText?: string | null;
    futureRequirementsText?: string | null;
}

const getStatusInfo = (
    status: string, 
    rejectionReason?: string, 
    stripeStatusDetails?: string | null, 
    canRetryOnboarding?: boolean,
    onboardingCompleted?: boolean,
    hasStripeAccount?: boolean,
    stripeFutureRequirements?: string | null,
    stripeFutureDueAt?: string | null
): StatusInfo => {
    // ✅ CRÍTICO: Normalizar el status a string y trim para evitar problemas
    const normalizedStatus = String(status || '').trim();
    
    // ✅ CRÍTICO: Log para depurar qué status está llegando
    console.log('🔍 [getStatusInfo] Called with status:', {
        originalStatus: status,
        normalizedStatus,
        statusType: typeof status,
        STRIPE_STATUS_APPROVED: STRIPE_STATUS.APPROVED,
        matchesApproved: normalizedStatus === STRIPE_STATUS.APPROVED,
        allStatuses: Object.values(STRIPE_STATUS)
    });
    const getRejectionMessage = (reason: string) => {
        switch (reason) {
            // 🛡️ MUD-CT: distinguir rechazos por STRIPE vs rechazos POR LA PLATAFORMA.
            // Los `rejected.platform_*` significan que NOSOTROS rechazamos al experto
            // (vía POST /accounts/{id}/reject o equivalente). El CTA debe apuntar a
            // nuestro soporte, no al de Stripe.
            case "rejected.fraud":
                return "Stripe rechazó tu cuenta por motivos de seguridad. Contacta con soporte de Stripe para más información.";
            case "rejected.terms_of_service":
                return "Stripe rechazó tu cuenta por incumplimiento de los términos de servicio de Stripe.";
            case "rejected.listed":
                return "Stripe rechazó tu cuenta por aparecer en una lista de cumplimiento normativo.";
            case "rejected.incomplete_verification":
                return "Stripe rechazó tu cuenta tras varios intentos fallidos de verificación de identidad. Contacta con soporte de Stripe.";
            case "rejected.other":
                return "Stripe rechazó tu cuenta. Contacta con soporte de Stripe para conocer el motivo.";
            case "rejected.platform_fraud":
                return "Hemos rechazado tu cuenta desde nuestra plataforma por sospecha de fraude. Contacta con nuestro soporte si crees que es un error.";
            case "rejected.platform_terms_of_service":
                return "Hemos rechazado tu cuenta desde nuestra plataforma por incumplimiento de nuestros términos. Contacta con nuestro soporte para apelar.";
            case "rejected.platform_other":
                return "Hemos rechazado tu cuenta desde nuestra plataforma. Contacta con nuestro soporte para más información.";
            case "platform_paused":
                return "La verificación de pagos está pausada. Contacta con soporte para conocer cuándo podrás continuar.";
            default:
                return "Tu solicitud de cuenta de pagos fue rechazada. Por favor, revisa la información proporcionada e intenta nuevamente.";
        }
    };

    // 🛡️ MUD-CZ: defensa contra `stripeStatusDetails` STALE.
    //
    // BUG REAL detectado: backend persistía StripeStatus=ActionRequired pero
    // StripeStatusDetails="Tu cuenta está activa y lista para cobrar." (mensaje
    // del estado anterior `Approved`, sin actualizar al re-evaluar). El frontend
    // confiaba ciegamente en el detail → banner naranja "Hay datos pendientes" +
    // texto verde "Tu cuenta está activa" → contradicción visual.
    //
    // Defensa: si el status es warning/error y el detail contiene marcadores de
    // éxito ("activa", "lista para cobrar", "approved", "verificada"), ignorar
    // y usar el default frontend. Solo aplica cuando hay incoherencia real.
    const isErrorOrWarningStatus = (s: string): boolean => {
        const errorWarningSet = new Set<string>([
            STRIPE_STATUS.ACTION_REQUIRED,
            STRIPE_STATUS.REQUIREMENTS_DUE,
            STRIPE_STATUS.REQUIREMENTS_PAST_DUE,
            STRIPE_STATUS.RESTRICTED_SOON,
            STRIPE_STATUS.RESTRICTED,
            STRIPE_STATUS.DISABLED,
            STRIPE_STATUS.REJECTED,
            STRIPE_STATUS.DEAUTHORIZED
        ]);
        return errorWarningSet.has(s);
    };
    const SUCCESS_MARKERS = /(activa\s+y\s+lista|lista\s+para\s+cobrar|cuenta\s+est[áa]\s+activa|approved|verificada|todo\s+est[áa]\s+correcto)/i;
    const getMessage = (defaultMessage: string) => {
        if (
            stripeStatusDetails &&
            isErrorOrWarningStatus(normalizedStatus) &&
            SUCCESS_MARKERS.test(stripeStatusDetails)
        ) {
            // Detail STALE detectado: backend dice warning/error pero el texto es de éxito.
            // Ignorar el detail y usar el mensaje por defecto coherente con el status.
            return defaultMessage;
        }
        return stripeStatusDetails || defaultMessage;
    };

    const formatDeadline = (): string | null => {
        if (!stripeFutureDueAt) return null;
        const date = new Date(stripeFutureDueAt);
        if (Number.isNaN(date.getTime())) return null;
        return `Fecha límite estimada: ${date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })}`;
    };

    // 🛡️ MUD-CT: lista completa de rejection reasons PERMANENTES.
    // Antes faltaban `rejected.platform_*`, `rejected.incomplete_verification` y
    // `rejected.other` → un experto con cuenta rechazada definitivamente veía
    // el botón "Reintentar" que SIEMPRE fallaba (Stripe no permite re-onboarding
    // tras `rejected.*`). UX confuso + tickets de soporte.
    // Fuente: https://docs.stripe.com/api/accounts/object#account_object-requirements-disabled_reason
    const isPermanentRejection = (details: string | null | undefined): boolean => {
        if (!details) return false;
        const permanentReasons = [
            "rejected.fraud",
            "rejected.terms_of_service",
            "rejected.unsupported_business",
            "rejected.listed",
            "rejected.incomplete_verification",
            "rejected.other",
            "rejected.platform_fraud",
            "rejected.platform_terms_of_service",
            "rejected.platform_other",
            "listed"
        ];
        return permanentReasons.some(reason => details.includes(reason));
    };

    const baseFutureDue = formatDeadline();
    const futureRequirementsText = stripeFutureRequirements || null;

    // ✅ CRÍTICO: Usar normalizedStatus en el switch
    switch (normalizedStatus) {
        case STRIPE_STATUS.NOT_REQUESTED:
            return {
                canCreateServices: false,
                canRetry: true,
                message: getMessage("Para completar tu registro como experto, necesitas configurar tu cuenta de pagos. Este proceso es obligatorio y te permitirá recibir pagos por los servicios que ofrezcas. El proceso es seguro y se completa en pocos minutos."),
                action: "setup",
                // 🛡️ LOTE D · D-18 FASE 1 — i18n del buttonText. FASE 2 (mensajes largos) pendiente.
                buttonText: i18n.t('stripe.status.notRequested.button'),
                color: "#3b82f6",
                bgColor: "#eff6ff",
                futureRequirementsText
            };
        
        case STRIPE_STATUS.PENDING:
            // Si onboardingCompleted es false, mostrar "Continuar Verificación"
            if (onboardingCompleted === false) {
                return {
                    canCreateServices: false,
                    canRetry: true,
                    message: getMessage("Tu proceso de verificación está en curso. Completa la configuración de tu cuenta de pagos para continuar."),
                    action: "setup",
                    buttonText: i18n.t('stripe.status.pending.buttonContinue'),
                    color: "#f59e0b",
                bgColor: "#fffbeb",
                futureRequirementsText
                };
            }
            // Si onboardingCompleted es true y tiene cuenta, mostrar "Completar Requisitos"
            if (onboardingCompleted === true && hasStripeAccount) {
                return {
                    canCreateServices: false,
                    canRetry: true,
                    message: getMessage("Stripe requiere información adicional para activar tu cuenta. Completa los requisitos pendientes."),
                    action: "complete_requirements",
                    buttonText: i18n.t('stripe.status.pending.buttonRequirements'),
                    color: "#f59e0b",
                bgColor: "#fffbeb",
                futureRequirementsText
                };
            }
            // Default: esperar
            return {
                canCreateServices: false,
                canRetry: false,
                message: getMessage("Tu solicitud está siendo revisada por nuestro equipo. Este proceso suele tomar entre 1-3 días hábiles. Te notificaremos cuando esté lista."),
                action: "wait",
                buttonText: i18n.t('stripe.status.pending.buttonWait'),
                color: "#f59e0b",
                bgColor: "#fffbeb",
                futureRequirementsText
            };

        case STRIPE_STATUS.ACTION_REQUIRED:
            return {
                canCreateServices: false,
                canRetry: true,
                message: getMessage("Stripe necesita documentación o datos adicionales de inmediato. Abre tu panel de Stripe y completa los campos marcados como \"currently_due\"."),
                action: "complete_requirements",
                buttonText: i18n.t('stripe.status.actionRequired.button'),
                color: "#f97316",
                bgColor: "#fff7ed",
                deadlineText: baseFutureDue,
                futureRequirementsText
            };

        case STRIPE_STATUS.PENDING_VERIFICATION:
            return {
                canCreateServices: false,
                canRetry: false,
                message: getMessage("Stripe está verificando la documentación enviada. Mientras tanto, los pagos seguirán bloqueados."),
                action: "wait",
                buttonText: i18n.t('stripe.status.pendingVerification.button'),
                color: "#3b82f6",
                bgColor: "#eff6ff",
                deadlineText: baseFutureDue,
                futureRequirementsText
            };

        case STRIPE_STATUS.REQUIREMENTS_DUE:
            return {
                canCreateServices: false,
                canRetry: true,
                message: getMessage("Stripe programó requisitos futuros. Actualiza tus datos antes de que la cuenta pase a un estado restrictivo."),
                action: "complete_requirements",
                buttonText: i18n.t('stripe.status.requirementsDue.button'),
                color: "#fbbf24",
                bgColor: "#fffbeb",
                deadlineText: baseFutureDue,
                futureRequirementsText
            };

        case STRIPE_STATUS.REQUIREMENTS_PAST_DUE:
            return {
                canCreateServices: false,
                canRetry: true,
                message: getMessage("Algunos requisitos vencieron y Stripe bloqueó tus cobros. Completa la información para reactivar los pagos."),
                action: "complete_requirements",
                buttonText: i18n.t('stripe.status.requirementsPastDue.button'),
                color: "#dc2626",
                bgColor: "#fef2f2",
                deadlineText: baseFutureDue,
                futureRequirementsText
            };

        case STRIPE_STATUS.RESTRICTED_SOON:
            return {
                canCreateServices: false,
                canRetry: true,
                message: getMessage("Stripe emitió una alerta: si no actualizas tus datos, restringirá tu cuenta en breve."),
                action: "complete_requirements",
                buttonText: i18n.t('stripe.status.restrictedSoon.button'),
                color: "#f97316",
                bgColor: "#fff7ed",
                deadlineText: baseFutureDue,
                futureRequirementsText
            };

        case STRIPE_STATUS.RESTRICTED:
            return {
                canCreateServices: false,
                canRetry: true,
                message: getMessage("Stripe limitó temporalmente tus cobros/payouts. Revisa el panel para completar los pasos pendientes."),
                action: "complete_requirements",
                buttonText: i18n.t('stripe.status.restricted.button'),
                color: "#f97316",
                bgColor: "#fff7ed",
                deadlineText: baseFutureDue,
                futureRequirementsText
            };

        case STRIPE_STATUS.DISABLED:
            return {
                canCreateServices: false,
                canRetry: false,
                message: getMessage("Stripe deshabilitó los pagos por un incidente o incumplimiento. Debes coordinar con Stripe para recuperar la cuenta."),
                action: "contact",
                buttonText: i18n.t('stripe.status.disabled.button'),
                color: "#7f1d1d",
                bgColor: "#fef2f2",
                deadlineText: baseFutureDue,
                futureRequirementsText
            };

        // 🛡️ Round 29 — FIX-UNDER-REVIEW: el backend mapea `disabled_reason="under_review"` a
        // StripeStatus.UnderReview pero el frontend no tenía case → caía al default "Estado no
        // reconocido. Contacta soporte" + icono naranja AlertTriangle + badge rojo "Bloqueado".
        // Resultado: UI contradictoria. Tratamiento como `PendingVerification` (wait, no acción)
        // porque la revisión manual de Stripe NO requiere acción del experto, solo paciencia.
        case STRIPE_STATUS.UNDER_REVIEW:
            return {
                canCreateServices: false,
                canRetry: false,
                message: getMessage("Stripe está revisando manualmente tu cuenta. Puede tardar varios días. No es necesaria ninguna acción por tu parte; te avisamos cuando termine."),
                action: "wait",
                buttonText: i18n.t('stripe.status.pendingVerification.button'),
                color: "#3b82f6",
                bgColor: "#eff6ff",
                futureRequirementsText
            };
        
        case STRIPE_STATUS.APPROVED:
            return {
                canCreateServices: true,
                canRetry: true,
                message: getMessage("¡Excelente! Tu cuenta de pagos está activa y lista para recibir pagos. Ya puedes empezar a ofrecer servicios y generar ingresos."),
                action: "edit_account",
                buttonText: i18n.t('stripe.status.approved.button'),
                color: "#10b981",
                bgColor: "#ecfdf5",
                futureRequirementsText
            };
        
        case STRIPE_STATUS.REJECTED:
            // Verificar si es rechazo permanente
            const isPermanent = isPermanentRejection(stripeStatusDetails) || canRetryOnboarding === false;
            let rejectedMessage = "Tu cuenta de pagos fue rechazada por Stripe.";
            
            // Agregar motivo del rechazo si está disponible
            if (rejectionReason) {
                rejectedMessage += `\n${getRejectionMessage(rejectionReason)}`;
            }
            
            // Si es permanente, agregar mensaje de contacto con soporte
            if (isPermanent) {
                rejectedMessage += "\nPor favor, contacta al soporte técnico para revisar tu situación.";
            }
            
            return {
                canCreateServices: false,
                canRetry: !isPermanent,
                message: rejectedMessage,
                action: isPermanent ? "contact" : "retry",
                buttonText: isPermanent
                    ? i18n.t('stripe.status.rejected.buttonContact')
                    : i18n.t('stripe.status.rejected.buttonRetry'),
                color: "#ef4444",
                bgColor: "#fef2f2",
                futureRequirementsText
            };
        
        case STRIPE_STATUS.DEAUTHORIZED:
            return {
                canCreateServices: false,
                canRetry: true,
                message: getMessage("Tu cuenta de pagos ha sido desactivada. Por favor, reconecta tu cuenta para continuar recibiendo pagos."),
                action: "setup",
                buttonText: i18n.t('stripe.status.deauthorized.button'),
                color: "#8b5cf6",
                bgColor: "#faf5ff",
                futureRequirementsText
            };
        
        default:
            return {
                canCreateServices: false,
                canRetry: true,
                message: getMessage("Estado de cuenta no reconocido. Por favor, contacta soporte para verificar tu estado."),
                action: "setup",
                buttonText: i18n.t('stripe.status.unknown.button'),
                color: "#6b7280",
                bgColor: "#f9fafb",
                futureRequirementsText
            };
    }
};

export const getExpertStatus = async (): Promise<ExpertStatusResponse> => {
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
        
        const rawData = await response.json();
        console.log('✅ expert-status raw data received:', rawData);
        
        // ✅ CRÍTICO: Normalizar la respuesta del backend (puede venir en PascalCase o camelCase)
        const data: ExpertStatusResponse = {
            hasStripeAccount: rawData.HasStripeAccount ?? rawData.hasStripeAccount ?? false,
            hasPendingOnboarding: rawData.HasPendingOnboarding ?? rawData.hasPendingOnboarding ?? false,
            onboardingCompleted: rawData.OnboardingCompleted ?? rawData.onboardingCompleted ?? false,
            stripeStatus: (rawData.StripeStatus ?? rawData.stripeStatus) as StripeStatus,
            stripeStatusDetails: rawData.StripeStatusDetails ?? rawData.stripeStatusDetails ?? null,
            stripeAccountId: rawData.StripeAccountId ?? rawData.stripeAccountId ?? null,
            canAccessStripe: rawData.CanAccessStripe ?? rawData.canAccessStripe ?? false,
            canCreateServices: rawData.CanCreateServices ?? rawData.canCreateServices ?? false,
            canReceivePayments: rawData.CanReceivePayments ?? rawData.canReceivePayments ?? false,
            statusMessage: rawData.StatusMessage ?? rawData.statusMessage ?? '',
            stripeFutureRequirements: rawData.StripeFutureRequirements ?? rawData.stripeFutureRequirements ?? null,
            stripeFutureDueAt: rawData.StripeFutureDueAt ?? rawData.stripeFutureDueAt ?? null,
            canRetryOnboarding: rawData.CanRetryOnboarding ?? rawData.canRetryOnboarding ?? false,
            rejectionReason: rawData.RejectionReason ?? rawData.rejectionReason ?? null
        };
        
        console.log('✅ expert-status normalized data:', data);
        return data;
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`❌ expert-status error after ${duration}ms:`, error);
        throw error;
    }
};

// NOTE: This function is currently not being used due to 400 Bad Request errors from the backend
// The sync-stripe-status endpoint appears to have issues or may have changed its requirements
// We're using the expert-status endpoint instead for status updates
export const syncStripeStatus = async (): Promise<StripeSyncStatusResponse> => {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    console.log('🔄 Calling sync-stripe-status endpoint...');
    const startTime = Date.now();

    try {
        const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.subscription.syncStripeStatus}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const duration = Date.now() - startTime;
        console.log(`⏱️ sync-stripe-status response time: ${duration}ms`);
        
        if (!response.ok) {
            console.error(`❌ sync-stripe-status failed: ${response.status} ${response.statusText}`);
            
            // Try to get the error details from the response
            let errorMessage = `Failed to sync status: ${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                console.error('Error response data:', errorData);
                if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                }
            } catch (parseError) {
                console.error('Could not parse error response:', parseError);
            }
            
            throw new Error(errorMessage);
        }
        
        const data: StripeSyncStatusResponse = await response.json();
        console.log('✅ sync-stripe-status data received:', data);
        return data;
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`❌ sync-stripe-status error after ${duration}ms:`, error);
        throw error;
    }
};

export const useExpertStripeStatus = () => {
    const [status, setStatus] = useState<ExpertStatusResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const [lastFetch, setLastFetch] = useState<number>(0);
    // Control de llamadas concurrentes usando ref
    const [hasInitialized, setHasInitialized] = useState(false); // Control de inicialización
    
    // Refs para acceder a valores actuales sin causar re-renders
    const statusRef = useRef<ExpertStatusResponse | null>(null);
    const lastFetchRef = useRef<number>(0);
    const isFetchingRef = useRef<boolean>(false);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const previousStatusRef = useRef<string | null>(null);
    
    const CACHE_DURATION = 60000; // ✅ Aumentado a 60 segundos para evitar llamadas repetidas

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
            if (!statusRef.current) {
                setLoading(true);
            }
            setError(null);
            const statusData = await getExpertStatus();

            // Check if status changed and notify
            const previousStatus = previousStatusRef.current;
            if (previousStatus === null) {
                // 🛡️ Round 29 FIX-POLL-STORM: primer fetch exitoso → sembrar el ref sin emitir
                // 'stripeStatusChanged'. ANTES: cuando `loadInitialStatus` no había completado
                // (p.ej. `fetchStatus(true)` desde el listener de focus durante el load), el ref
                // seguía `null` y `null !== "Approved"` disparaba evento artificial en CADA primer
                // fetch → fan-out a useExpert.fetchProfile + reset de toda su cache.
                previousStatusRef.current = statusData.stripeStatus;
            } else if (previousStatus !== statusData.stripeStatus) {
                handleStripeStatusChange({
                    stripeStatus: statusData.stripeStatus,
                    stripeStatusDetails: statusData.stripeStatusDetails,
                    previousStatus
                });
                previousStatusRef.current = statusData.stripeStatus;
            }

            setStatus(statusData);
            statusRef.current = statusData;
            setLastFetch(now);
            lastFetchRef.current = now;
            console.log('✅ useExpertStripeStatus: Status updated successfully');
        } catch (err: any) {
            setError(err.message);
            console.error('❌ useExpertStripeStatus: Error fetching status:', err);
            // ⚠️ A7: ante un error NO conservar la cache como válida durante todo el TTL (60s).
            // Marcarla obsoleta para forzar un re-fetch en el próximo acceso/poll, en lugar de
            // seguir mostrando un estado potencialmente caduco (p.ej. "Approved" tras una
            // restricción de Stripe). El backend es la autoridad real al cobrar; esto evita
            // engañar al experto en la UI.
            lastFetchRef.current = 0;
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    }, []); // Sin dependencias para evitar recreaciones

    const syncStatus = async () => {
        try {
            setLoading(true);
            
            // For now, use expert-status endpoint as the primary method since sync-stripe-status is failing
            // This gives us the most up-to-date information from the backend
            console.log('🔄 Syncing status using expert-status endpoint...');
            const fallbackData = await getExpertStatus();

            // Check if status changed and notify
            const previousStatus = previousStatusRef.current;
            if (previousStatus === null) {
                // 🛡️ Round 29 FIX-POLL-STORM: coherente con `fetchStatus`. Sin estado previo
                // conocido, sembrar el ref sin disparar evento. Evita fan-out artificial cuando
                // `syncStatus()` corre antes de que `loadInitialStatus` haya completado.
                previousStatusRef.current = fallbackData.stripeStatus;
            } else if (previousStatus !== fallbackData.stripeStatus) {
                handleStripeStatusChange({
                    stripeStatus: fallbackData.stripeStatus,
                    stripeStatusDetails: fallbackData.stripeStatusDetails,
                    previousStatus
                });
                previousStatusRef.current = fallbackData.stripeStatus;
            }
            
            setStatus(fallbackData);
            statusRef.current = fallbackData;
            const now = Date.now();
            setLastFetch(now);
            lastFetchRef.current = now;
            
            console.log('✅ Status synced successfully using expert-status endpoint');
            return fallbackData;
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

    // ✅ Cargar estado inicial solo una vez - usar ref para evitar múltiples ejecuciones
    const initializationRef = useRef(false);
    
    useEffect(() => {
        if (!hasInitialized && !initializationRef.current) {
            initializationRef.current = true;
            console.log('🚀 useExpertStripeStatus: Initial load (only once)');
            setHasInitialized(true);
            
            // Llamada directa sin usar fetchStatus para evitar dependencias
            const loadInitialStatus = async () => {
                try {
                    setLoading(true);
                    setError(null);
                    const statusData = await getExpertStatus();
                    
                    // Set initial previous status
                    previousStatusRef.current = statusData.stripeStatus;
                    
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

        // Hacer polling para estados que pueden cambiar automáticamente en Stripe
        const needsPolling = POLLING_STATUSES.has(status.stripeStatus) || 
                             (!status.onboardingCompleted && status.hasStripeAccount);

        if (needsPolling && !pollingIntervalRef.current) {
            console.log('🔄 useExpertStripeStatus: Starting polling for status:', status.stripeStatus);
            setIsPolling(true);
            pollingIntervalRef.current = setInterval(() => {
                console.log('⏰ useExpertStripeStatus: Polling check');
                fetchStatus(false); // Usar cache si está disponible
            }, 120000); // ✅ Aumentado a 2 minutos para reducir llamadas
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

    // ✅ A7: Re-verificar el estado al volver el foco a la pestaña/ventana. El onboarding de
    // Stripe es una navegación EXTERNA; al regresar (la pestaña recupera el foco) refrescamos
    // para no mostrar el estado previo al onboarding ni un estado caduco por la cache.
    useEffect(() => {
        const revalidate = () => {
            if (document.body.dataset.drawerOpen) {
                return;
            }
            if (document.visibilityState === 'visible') {
                // 🛡️ Round 29 FIX-POLL-STORM: respetar cache 60s en focus/visibility.
                //
                // ANTES: `fetchStatus(true)` forzaba bypass de cache en CADA cambio de foco
                // (DevTools, drawers que mueven el foco, alt-tab). Resultado: 28+ llamadas a
                // /expert-status en 2 minutos. Además cada fetch disparaba 'stripeStatusChanged'
                // → fan-out a useExpert.fetchProfile.
                //
                // AHORA: `fetchStatus(false)` — respeta cache de 60s. La frescura sigue cubierta por:
                //  (1) Polling de 120s para POLLING_STATUSES (línea ~642).
                //  (2) `useExpert.ts:666-681` con cooldown 5min para `checkOnboardingStatus`
                //      (cubre la vuelta del onboarding externo de Stripe).
                //  (3) Webhooks de Stripe → backend → próximo fetch revela el cambio.
                fetchStatus(false);
            }
        };
        window.addEventListener('focus', revalidate);
        document.addEventListener('visibilitychange', revalidate);
        return () => {
            window.removeEventListener('focus', revalidate);
            document.removeEventListener('visibilitychange', revalidate);
        };
    }, [fetchStatus]);

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

    // ✅ CRÍTICO: Agregar logs para depurar el problema
    const statusInfo = status ? (() => {
        console.log('🔍 [useExpertStripeStatus] Creating statusInfo with:', {
            stripeStatus: status.stripeStatus,
            stripeStatusType: typeof status.stripeStatus,
            STRIPE_STATUS_APPROVED: STRIPE_STATUS.APPROVED,
            matchesApproved: status.stripeStatus === STRIPE_STATUS.APPROVED,
            canAccessStripe: status.canAccessStripe,
            onboardingCompleted: status.onboardingCompleted
        });
        
        const info = getStatusInfo(
            status.stripeStatus, 
            status.rejectionReason || undefined, 
            status.stripeStatusDetails, 
            status.canRetryOnboarding,
            status.onboardingCompleted,
            status.hasStripeAccount,
            status.stripeFutureRequirements || null,
            status.stripeFutureDueAt || null
        );
        
        console.log('🔍 [useExpertStripeStatus] statusInfo result:', {
            action: info.action,
            buttonText: info.buttonText,
            message: info.message.substring(0, 50) + '...'
        });
        
        return info;
    })() : null;
    
    return {
        status,
        loading,
        error,
        refetch: () => fetchStatus(true),
        syncStatus,
        statusInfo,
        isPolling
    };
};

// Función de validación para usar antes de crear servicios
export const validateBeforeCreatingService = async (_cachedStatus?: ExpertStatusResponse | null): Promise<boolean> => {
    try {
        const status = await getExpertStatus();
        
        if (!status.canCreateServices) {
            const statusInfo = getStatusInfo(
                status.stripeStatus,
                status.rejectionReason || undefined,
                status.stripeStatusDetails,
                status.canRetryOnboarding,
                status.onboardingCompleted,
                status.hasStripeAccount,
                status.stripeFutureRequirements || null,
                status.stripeFutureDueAt || null
            );
            
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
        const statusInfo = getStatusInfo(
            error.stripeStatus,
            error.rejectionReason,
            error.stripeStatusDetails,
            error.canRetryOnboarding,
            error.onboardingCompleted,
            error.hasStripeAccount,
            error.stripeFutureRequirements,
            error.stripeFutureDueAt
        );
        
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

export type ExpertStripeStatusResult = ReturnType<typeof useExpertStripeStatus>;
