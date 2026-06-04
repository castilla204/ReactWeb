import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAuthToken } from '../lib/auth';
import { API_CONFIG } from '../config/api';
import { ExpertProfileResponse, OnboardingStatusResponse, CurrentExpertAvailabilityDto, StripeStatus } from '../types/stripe';

interface ExpertProfile {
    id: number;
    profilePictureUrl: string;
    description: string;
    stripeAccountId: string | null;
    pendingStripeAccountId: string | null;
    onboardingCompleted: boolean;
    canAccessStripe?: boolean;
    stripeStatus: StripeStatus;
    stripeStatusDetails: string | null; // Mensaje detallado del estado
    createdAt: string;
    isOnVacation: boolean;
    latitude?: string;
    longitude?: string;
    // 🛡️ Round 28: exponer country (ISO 3166-1 alpha-2) para derivar moneda del experto.
    country?: string | null;
    // 🛡️ Round 28 MUD-W: si !null, el experto está en proceso de mudanza
    // (cerró cuenta Stripe en país anterior). El frontend debe llevarlo a
    // /become-expert para re-elegir país, NO a Stripe onboarding directo.
    relocatedFromCountry?: string | null;
    relocatedAt?: string | null;
    currentAvailability?: CurrentExpertAvailabilityDto | null;
    stripeFutureRequirements?: string | null;
    stripeFutureDueAt?: string | null;
}

interface Search {
    id: number;
    client: { name: string; email: string };
    categoryId: number;
    status: string;
    createdAt: string;
}

interface ServiceType {
    id: number;
    name: string;
}

export function useExpert() {
    const { user, signOut } = useAuth();
    const [profile, setProfile] = useState<ExpertProfile | null>(null);
    const [searches, setSearches] = useState<Search[]>([]);
    const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const [isLoadingSearches, setIsLoadingSearches] = useState(false);
    const [isLoadingServiceTypes, setIsLoadingServiceTypes] = useState(false);
    const [isStartingOnboarding, setIsStartingOnboarding] = useState(false);
    const [isRestartingOnboarding, setIsRestartingOnboarding] = useState(false);
    const [isCheckingOnboardingStatus, setIsCheckingOnboardingStatus] = useState(false);
    const [profileError, setProfileError] = useState<Error | null>(null);

    // Cache para evitar llamadas excesivas
    const lastFetchRef = useRef<{ [key: string]: number }>({});
    const CACHE_DURATION = 60000; // ✅ Aumentado a 60 segundos para evitar llamadas repetidas

    const fetchProfile = useCallback(async (
        force = false,
        options?: { silent?: boolean }
    ) => {
        if (!user) {
            console.log('No user, cannot fetch profile');
            return;
        }

        const now = Date.now();
        const cacheKey = 'profile';
        
        // Verificar cache si no es forzado
        if (!force && lastFetchRef.current[cacheKey] && (now - lastFetchRef.current[cacheKey]) < CACHE_DURATION) {
            console.log('Using cached profile data');
            return;
        }

        if (!options?.silent) {
            setIsLoadingProfile(true);
        }
        setProfileError(null);
        try {
            const token = getAuthToken();
            if (!token) {
                console.log('No token found, signing out');
                signOut();
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.expert.profile}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // ✅ No desloguear inmediatamente - dejar que el interceptor de authService maneje el refresh
                    // Solo desloguear si el refresh también falla
                    console.log('401 Unauthorized en fetchProfile - el interceptor manejará el refresh');
                    throw new Error('Request failed with status 401');
                }
                throw new Error(`Failed to fetch profile: ${response.statusText}`);
            }

            const data: any = await response.json();
            console.log('Fetched expert profile (raw):', data);
            console.log('🔍 useExpert: data.ProfilePictureUrl (principal):', data.ProfilePictureUrl);
            console.log('🔍 useExpert: data.profilePictureUrl (camelCase):', data.profilePictureUrl);
            
            // ✅ CRÍTICO: Normalizar de PascalCase a camelCase (el backend devuelve PascalCase)
            // ✅ IMPORTANTE: Usar ProfilePictureUrl del objeto principal (ExpertProfileDto), NO del objeto User
            // ✅ user.profilePictureUrl siempre será null para expertos según el cambio del backend
            // ✅ PRIORIZAR ProfilePictureUrl (PascalCase) del nivel superior
            const profilePictureUrl = data.ProfilePictureUrl ?? data.profilePictureUrl ?? '';
            console.log('🔍 useExpert: data.ProfilePictureUrl (PascalCase):', data.ProfilePictureUrl);
            console.log('🔍 useExpert: data.profilePictureUrl (camelCase):', data.profilePictureUrl);
            console.log('🔍 useExpert: Final profilePictureUrl to use:', profilePictureUrl);
            
            const mappedProfile: ExpertProfile = {
                id: data.id ?? data.Id ?? 0,
                profilePictureUrl: profilePictureUrl,
                description: data.description ?? data.Description ?? '',
                stripeAccountId: data.stripeAccountId ?? data.StripeAccountId ?? null,
                pendingStripeAccountId: null, // This field might not be in the new response
                onboardingCompleted: data.onboardingCompleted ?? data.OnboardingCompleted ?? false,
                canAccessStripe: true, // This might need to be determined from other fields
                stripeStatus: data.stripeStatus ?? data.StripeStatus ?? 0,
                stripeStatusDetails: data.stripeStatusDetails ?? data.StripeStatusDetails ?? null,
                stripeFutureRequirements: data.stripeFutureRequirements ?? data.StripeFutureRequirements ?? null,
                stripeFutureDueAt: data.stripeFutureDueAt ?? data.StripeFutureDueAt ?? null,
                createdAt: data.createdAt ?? data.CreatedAt ?? new Date().toISOString(),
                isOnVacation: data.isOnVacation ?? data.IsOnVacation ?? false,
                latitude: data.latitude ?? data.Latitude ?? null,
                longitude: data.longitude ?? data.Longitude ?? null,
                // 🛡️ Round 28: mapear country del backend (ISO 3166-1 alpha-2) para derivar moneda.
                country: data.country ?? data.Country ?? null,
                // 🛡️ MUD-W: relocation signal del backend (defensive: ambas casings).
                relocatedFromCountry: data.relocatedFromCountry ?? data.RelocatedFromCountry ?? null,
                relocatedAt: data.relocatedAt ?? data.RelocatedAt ?? null,
                // ✅ CRÍTICO: Transformar CurrentAvailability de PascalCase a camelCase
                currentAvailability: (() => {
                    const avail = data.currentAvailability ?? data.CurrentAvailability;
                    if (!avail) return null;
                    
                    return {
                        id: avail.id ?? avail.Id ?? 0,
                        daysOfWeek: avail.daysOfWeek ?? avail.DaysOfWeek ?? [],
                        startTime: avail.startTime ?? avail.StartTime ?? '',
                        endTime: avail.endTime ?? avail.EndTime ?? '',
                        effectiveFrom: avail.effectiveFrom ?? avail.EffectiveFrom ?? undefined
                    };
                })()
            };
            
            console.log('Fetched expert profile (mapped):', mappedProfile);
            
            // ✅ CRÍTICO: Validar que el ID sea válido
            if (!mappedProfile.id || mappedProfile.id === 0) {
                console.error('⚠️ Expert profile ID is invalid:', mappedProfile.id);
                throw new Error('Invalid expert profile ID received from server');
            }
            
            setProfile(mappedProfile);
            lastFetchRef.current[cacheKey] = now;
        } catch (error: any) {
            console.error('Error fetching profile:', error);
            setProfileError(error);
        } finally {
            if (!options?.silent) {
                setIsLoadingProfile(false);
            }
        }
    }, [user, signOut, CACHE_DURATION]);

    const fetchSearches = useCallback(async (force = false) => {
        if (!user) return;

        const now = Date.now();
        const cacheKey = 'searches';
        
        // Verificar cache si no es forzado
        if (!force && lastFetchRef.current[cacheKey] && (now - lastFetchRef.current[cacheKey]) < CACHE_DURATION) {
            console.log('Using cached searches data');
            return;
        }

        setIsLoadingSearches(true);
        try {
            const token = getAuthToken();
            if (!token) {
                console.log('No token found, signing out');
                signOut();
                throw new Error('No authentication token found');
            }

            // Agregar paginación (por ahora usamos valores por defecto, se puede hacer configurable después)
            const page = 1;
            const pageSize = 20;
            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.expert.hires.listAsExpert}?page=${page}&pageSize=${pageSize}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // ✅ No desloguear inmediatamente - dejar que el interceptor de authService maneje el refresh
                    console.log('401 Unauthorized en fetchSearches - el interceptor manejará el refresh');
                    throw new Error('Request failed with status 401');
                }
                throw new Error(`Failed to fetch searches: ${response.statusText}`);
            }

            const data = await response.json();
            // Manejar respuesta paginada o no paginada
            if (data.hires && data.pagination) {
                setSearches(data.hires);
            } else if (Array.isArray(data)) {
                setSearches(data);
            } else {
                setSearches([]);
            }
            lastFetchRef.current[cacheKey] = now;
        } catch (error) {
            console.error('Error fetching searches:', error);
        } finally {
            setIsLoadingSearches(false);
        }
    }, [user, signOut, CACHE_DURATION]);

    const fetchServiceTypes = useCallback(async (force = false) => {
        const now = Date.now();
        const cacheKey = 'serviceTypes';
        
        // Verificar cache si no es forzado
        if (!force && lastFetchRef.current[cacheKey] && (now - lastFetchRef.current[cacheKey]) < CACHE_DURATION) {
            console.log('Using cached service types data');
            return;
        }

        setIsLoadingServiceTypes(true);
        try {
            const token = getAuthToken();
            if (!token) {
                console.log('No token found, signing out');
                signOut();
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_CONFIG.baseUrl}/api/ServiceType`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // ✅ No desloguear inmediatamente - dejar que el interceptor de authService maneje el refresh
                    console.log('401 Unauthorized en fetchServiceTypes - el interceptor manejará el refresh');
                    throw new Error('Request failed with status 401');
                }
                throw new Error(`Failed to fetch service types: ${response.statusText}`);
            }

            const data = await response.json();
            setServiceTypes(data);
            lastFetchRef.current[cacheKey] = now;
        } catch (error) {
            console.error('Error fetching service types:', error);
        } finally {
            setIsLoadingServiceTypes(false);
        }
    }, [signOut, CACHE_DURATION]);

    const startOnboarding = async () => {
        console.log('🚀 useExpert: startOnboarding called');
        setIsStartingOnboarding(true);
        try {
            const token = getAuthToken();
            if (!token) {
                console.log('❌ No token found, signing out');
                signOut();
                throw new Error('No authentication token found');
            }

            // Determinar qué endpoint usar basado en el estado actual
            const hasPendingOnboarding = profile?.pendingStripeAccountId && profile?.onboardingCompleted !== true;
            const endpoint = hasPendingOnboarding 
                ? `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.subscription.restartOnboarding}`
                : `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.subscription.expertOnboarding}`;

            console.log('🔄 useExpert: Calling endpoint:', endpoint);
            console.log('📊 useExpert: Profile state:', { 
                hasPendingOnboarding, 
                pendingStripeAccountId: profile?.pendingStripeAccountId,
                onboardingCompleted: profile?.onboardingCompleted 
            });

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('📡 useExpert: Response status:', response.status);

            if (!response.ok) {
                if (response.status === 401) {
                    // ✅ No desloguear inmediatamente - dejar que el interceptor de authService maneje el refresh
                    console.log('❌ 401 Unauthorized en startOnboarding - el interceptor manejará el refresh');
                    throw new Error('Request failed with status 401');
                }
                if (response.status === 400) {
                    // Intentar extraer mensaje claro del backend
                    let backendMessage = 'Reinicia el onboarding para crear una cuenta nueva.';
                    try {
                        const errData = await response.json();
                        if (errData?.message) backendMessage = errData.message;
                    } catch {}
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: {
                            type: 'warning',
                            message: backendMessage,
                        },
                    }));
                    throw new Error(`Failed to start onboarding: Bad Request`);
                }
                // 🛡️ Round 28 Sprint US: para status 500 / otros, ANTES caíamos a response.statusText
                // ("Internal Server Error") perdiendo el mensaje específico de Stripe que el backend
                // serializa en el body como { error, message, code, type }. Ahora intentamos leer el body
                // primero y mostramos el error real al usuario (ej. "You cannot request the `transfers`
                // capability without the `card_payments` capability for accounts in US.").
                let backendDetail = response.statusText || 'Error desconocido al iniciar el onboarding.';
                try {
                    const errData = await response.json();
                    // Preferimos `error` (StripeError.Message) sobre `message` (label genérico).
                    backendDetail = errData?.error || errData?.message || backendDetail;
                } catch {
                    // body no era JSON → mantenemos statusText
                }
                throw new Error(backendDetail);
            }

            const { url, isLoginLink } = await response.json();
            console.log('✅ useExpert: Stripe response:', { url, isLoginLink });
            
            // Mostrar mensaje informativo según el tipo de enlace
            if (isLoginLink) {
                console.log('🔗 Redirigiendo a tu cuenta Stripe...');
            } else {
                console.log('🆕 Iniciando configuración de cuenta Stripe...');
            }
            
            // No resetear el estado de loading antes de redirigir - se mantendrá visible hasta que se abra Stripe
            window.location.href = url;
        } catch (error) {
            console.error('❌ useExpert: Error starting onboarding:', error);
            setIsStartingOnboarding(false);
            throw error;
        }
        // No usar finally aquí - queremos mantener el loading activo durante la redirección
    };

    // Helper para parsear errores del backend y devolver mensaje claro
    const safeFetch = async (url: string, options: RequestInit) => {
        const res = await fetch(url, options);
        if (!res.ok) {
            let msg = res.statusText;
            try {
                const j = await res.json();
                if ((j as any)?.message) msg = (j as any).message;
            } catch {}
            throw new Error(msg);
        }
        return res.json();
    };

    // Flujo recomendado: reiniciar y luego crear link de onboarding; redirigir a la URL
    const restartAndStartOnboarding = async () => {
        setIsStartingOnboarding(true);
        try {
            const token = getAuthToken();
            if (!token) {
                signOut();
                throw new Error('No authentication token found');
            }

            await safeFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.subscription.restartOnboarding}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            });

            const { url } = await safeFetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.subscription.expertOnboarding}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            });

            // No resetear el estado de loading antes de redirigir - se mantendrá visible hasta que se abra Stripe
            window.location.href = url;
        } catch (error) {
            // Solo resetear el estado si hay un error
            setIsStartingOnboarding(false);
            throw error;
        }
        // No usar finally aquí - queremos mantener el loading activo durante la redirección
    };

    const checkOnboardingStatus = async (force = false) => {
        const now = Date.now();
        const cacheKey = 'onboardingStatus';
        
        // Verificar cache si no es forzado
        if (!force && lastFetchRef.current[cacheKey] && (now - lastFetchRef.current[cacheKey]) < CACHE_DURATION) {
            console.log('Using cached onboarding status');
            return null; // No hay datos nuevos
        }

        setIsCheckingOnboardingStatus(true);
        try {
            const token = getAuthToken();
            if (!token) {
                console.log('No token found, signing out');
                signOut();
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.subscription.onboardingStatus}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // ✅ No desloguear inmediatamente - dejar que el interceptor de authService maneje el refresh
                    console.log('401 Unauthorized en checkOnboardingStatus - el interceptor manejará el refresh');
                    throw new Error('Request failed with status 401');
                }
                throw new Error(`Failed to check onboarding status: ${response.statusText}`);
            }

            const raw = await response.json();
            const statusData = raw as OnboardingStatusResponse & Record<string, unknown>;
            const stripeAccountId = (statusData.stripeAccountId ?? raw.StripeAccountId) as string | null | undefined;
            const onboardingCompleted = Boolean(statusData.onboardingCompleted ?? raw.OnboardingCompleted);
            const canAccessStripe = Boolean(statusData.canAccessStripe ?? raw.CanAccessStripe);
            const stripeStatus = (statusData.stripeStatus ?? raw.StripeStatus) as ExpertProfile['stripeStatus'];
            const stripeStatusDetails = (statusData.stripeStatusDetails ?? raw.StripeStatusDetails) as string | null | undefined;
            const hasPendingOnboarding = Boolean(statusData.hasPendingOnboarding ?? raw.HasPendingOnboarding);
            console.log('Onboarding status received:', { stripeAccountId, onboardingCompleted, stripeStatus });

            setProfile(prev => {
                if (!prev) return null;

                return {
                    ...prev,
                    stripeAccountId: stripeAccountId ?? prev.stripeAccountId,
                    onboardingCompleted,
                    canAccessStripe,
                    stripeStatus: stripeStatus ?? prev.stripeStatus,
                    stripeStatusDetails: stripeStatusDetails ?? prev.stripeStatusDetails,
                    pendingStripeAccountId: hasPendingOnboarding ? (stripeAccountId ?? prev.pendingStripeAccountId) : null,
                };
            });
            
            lastFetchRef.current[cacheKey] = now;
            return {
                stripeAccountId: stripeAccountId ?? null,
                onboardingCompleted,
                canAccessStripe,
                stripeStatus: stripeStatus as OnboardingStatusResponse['stripeStatus'],
                stripeStatusDetails: stripeStatusDetails ?? null,
                hasPendingOnboarding,
            } as OnboardingStatusResponse;
        } catch (error) {
            console.error('Error checking onboarding status:', error);
            throw error;
        } finally {
            setIsCheckingOnboardingStatus(false);
        }
    };

    const restartOnboarding = async () => {
        setIsRestartingOnboarding(true);
        try {
            const token = getAuthToken();
            if (!token) {
                console.log('No token found, signing out');
                signOut();
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.subscription.restartOnboarding}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // ✅ No desloguear inmediatamente - dejar que el interceptor de authService maneje el refresh
                    console.log('401 Unauthorized en restartOnboarding - el interceptor manejará el refresh');
                    throw new Error('Request failed with status 401');
                }
                throw new Error(`Failed to restart onboarding: ${response.statusText}`);
            }

            const { url, isLoginLink } = await response.json();
            console.log('Stripe restart response:', { url, isLoginLink });
            
            // Mostrar mensaje informativo según el tipo de enlace
            if (isLoginLink) {
                console.log('Redirigiendo a tu cuenta Stripe...');
            } else {
                console.log('Reiniciando configuración de cuenta Stripe...');
            }
            
            window.location.href = url;
        } catch (error) {
            console.error('Error restarting onboarding:', error);
            throw error;
        } finally {
            setIsRestartingOnboarding(false);
        }
    };

    const syncStripeStatus = async () => {
        try {
            const token = getAuthToken();
            if (!token) {
                console.log('No token found, signing out');
                signOut();
                throw new Error('No authentication token found');
            }

            console.log('Sincronizando estado con Stripe...');
            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.subscription.syncStripeStatus}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // ✅ No desloguear inmediatamente - dejar que el interceptor de authService maneje el refresh
                    console.log('401 Unauthorized en syncStripeStatus - el interceptor manejará el refresh');
                    throw new Error('Request failed with status 401');
                }
                throw new Error(`Failed to sync Stripe status: ${response.statusText}`);
            }

            const raw = await response.json();
            const syncedStatus = raw as Record<string, unknown>;
            const stripeAccountId = (syncedStatus.stripeAccountId ?? raw.StripeAccountId) as string | null | undefined;
            const onboardingCompleted = Boolean(syncedStatus.onboardingCompleted ?? raw.OnboardingCompleted);
            const canAccessStripe = Boolean(syncedStatus.canAccessStripe ?? raw.CanAccessStripe);
            const stripeStatus = (syncedStatus.stripeStatus ?? raw.StripeStatus) as ExpertProfile['stripeStatus'];
            const stripeStatusDetails = (syncedStatus.stripeStatusDetails ?? raw.StripeStatusDetails) as string | null | undefined;
            const hasPendingOnboarding = Boolean(syncedStatus.hasPendingOnboarding ?? raw.HasPendingOnboarding);
            console.log('Estado sincronizado:', { stripeAccountId, onboardingCompleted, stripeStatus });

            setProfile(prev => {
                if (!prev) return null;

                return {
                    ...prev,
                    stripeAccountId: stripeAccountId ?? prev.stripeAccountId,
                    onboardingCompleted,
                    canAccessStripe,
                    stripeStatus: stripeStatus ?? prev.stripeStatus,
                    stripeStatusDetails: stripeStatusDetails ?? prev.stripeStatusDetails,
                    pendingStripeAccountId: hasPendingOnboarding ? (stripeAccountId ?? prev.pendingStripeAccountId) : null,
                };
            });

            return raw;
        } catch (error) {
            console.error('Error syncing Stripe status:', error);
            throw error;
        }
    };

    // ✅ Ref para evitar que se ejecute múltiples veces
    const hasInitializedRef = useRef(false);
    const initializationInProgressRef = useRef(false);
    
    useEffect(() => {
        // ✅ Solo ejecutar una vez cuando el usuario es Expert y no se ha inicializado
        if (user?.role === 'Expert' && !hasInitializedRef.current && !initializationInProgressRef.current) {
            initializationInProgressRef.current = true;
            hasInitializedRef.current = true;
            console.log('🚀 useExpert: Initial load (only once)');
            
            // ✅ CRÍTICO: Verificar que el token esté disponible antes de hacer requests
            const token = getAuthToken();
            if (!token) {
                console.warn('⚠️ useExpert: No token available, waiting...');
                initializationInProgressRef.current = false;
                hasInitializedRef.current = false; // Permitir reintentar
                return;
            }
            
            // ✅ Pequeño delay para asegurar que el token esté completamente disponible
            setTimeout(() => {
                // Solo cargar profile inicial - los demás se cargan cuando se necesiten
                fetchProfile(false).finally(() => {
                    initializationInProgressRef.current = false;
                });
            }, 100);
            
            // No cargar serviceTypes aquí - se cargan con useServiceTypes hook
            // No cargar searches aquí - se cargan con useExpertHires hook
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.role]); // Solo depender del role, no de las funciones

    // Verificar el estado del onboarding automáticamente si hay un proceso pendiente
    useEffect(() => {
        if (profile?.pendingStripeAccountId && profile?.onboardingCompleted !== true) {
            // Verificar inmediatamente al cargar la página
            checkOnboardingStatus().catch(console.error);
            
            // Verificar el estado cada 60 segundos si hay onboarding pendiente (reducido de 30s)
            const interval = setInterval(async () => {
                try {
                    const newStatus = await checkOnboardingStatus();
                    if (newStatus && newStatus.onboardingCompleted) {
                        console.log('🎉 ¡Cuenta Stripe activada por Stripe!');
                        // Disparar evento para mostrar notificación de éxito
                        window.dispatchEvent(new CustomEvent('showNotification', {
                            detail: {
                                type: 'success',
                                message: '🎉 ¡Cuenta Stripe activada y verificada por Stripe!',
                            },
                        }));
                        // Limpiar cache para forzar actualización
                        lastFetchRef.current = {};
                    }
                } catch (error) {
                    console.error('Error checking onboarding status:', error);
                }
            }, 60000); // Aumentado a 60 segundos

            return () => clearInterval(interval);
        }
    }, [profile?.pendingStripeAccountId, profile?.onboardingCompleted]);

    // Verificar también si hay cuenta Stripe pero no está completada (puede estar en revisión)
    useEffect(() => {
        if (profile?.stripeAccountId && profile?.onboardingCompleted !== true) {
            console.log('🔍 Cuenta Stripe existe pero no está completada - verificando estado...');
            
            // Verificar cada 2 minutos si la cuenta se activa (reducido de 1 minuto)
            const interval = setInterval(async () => {
                try {
                    const newStatus = await checkOnboardingStatus();
                    if (newStatus && newStatus.onboardingCompleted) {
                        console.log('🎉 ¡Cuenta Stripe activada después de revisión!');
                        window.dispatchEvent(new CustomEvent('showNotification', {
                            detail: {
                                type: 'success',
                                message: '🎉 ¡Cuenta Stripe activada después de revisión por Stripe!',
                            },
                        }));
                        // Limpiar cache para forzar actualización
                        lastFetchRef.current = {};
                    }
                } catch (error) {
                    console.error('Error checking account activation:', error);
                }
            }, 120000); // Cada 2 minutos para cuentas en revisión

            return () => clearInterval(interval);
        }
    }, [profile?.stripeAccountId, profile?.onboardingCompleted]);

    // Verificar el estado cuando el usuario regresa a la página (después de completar onboarding en Stripe)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && profile?.pendingStripeAccountId && profile?.onboardingCompleted !== true) {
                // Usuario regresó a la página y hay onboarding pendiente
                // Solo verificar si han pasado más de 5 minutos desde la última verificación
                const now = Date.now();
                const lastCheck = lastFetchRef.current['onboardingStatus'] || 0;
                if ((now - lastCheck) > 300000) { // 5 minutos
                    checkOnboardingStatus().catch(console.error);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [profile?.pendingStripeAccountId, profile?.onboardingCompleted]);

    return {
        profile,
        isLoadingProfile,
        profileError,
        searches,
        isLoadingSearches,
        serviceTypes,
        isLoadingServiceTypes,
        startOnboarding,
        restartAndStartOnboarding,
        isStartingOnboarding,
        checkOnboardingStatus,
        isCheckingOnboardingStatus,
        restartOnboarding,
        isRestartingOnboarding,
        syncStripeStatus,
        fetchProfile,
        fetchSearches: () => fetchSearches(true), // Forzar refresh
        fetchServiceTypes: () => fetchServiceTypes(true), // Forzar refresh
    };
}