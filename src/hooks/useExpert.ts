import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAuthToken } from '../lib/auth';
import { API_CONFIG } from '../config/api';
import { ExpertProfileResponse, OnboardingStatusResponse } from '../types/stripe';

interface ExpertProfile {
    id: number;
    profilePictureUrl: string;
    description: string;
    stripeAccountId: string | null;
    pendingStripeAccountId: string | null;
    onboardingCompleted: boolean;
    canAccessStripe?: boolean;
    stripeStatus: "NotRequested" | "Pending" | "Approved" | "Rejected" | "Deauthorized";
    stripeStatusDetails: string | null; // Mensaje detallado del estado
    createdAt: string;
    isOnVacation: boolean;
    latitude?: string;
    longitude?: string;
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
    const CACHE_DURATION = 30000; // 30 segundos

    const fetchProfile = useCallback(async (force = false) => {
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

        setIsLoadingProfile(true);
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
                    console.log('401 Unauthorized, signing out');
                    signOut();
                    throw new Error('Request failed with status 401');
                }
                throw new Error(`Failed to fetch profile: ${response.statusText}`);
            }

            const data: ExpertProfileResponse = await response.json();
            console.log('Fetched expert profile:', data);
            
            // Map the new response structure to the existing interface
            const mappedProfile: ExpertProfile = {
                id: data.id,
                profilePictureUrl: data.profilePictureUrl,
                description: data.description,
                stripeAccountId: data.stripeAccountId,
                pendingStripeAccountId: null, // This field might not be in the new response
                onboardingCompleted: data.onboardingCompleted,
                canAccessStripe: true, // This might need to be determined from other fields
                stripeStatus: data.stripeStatus,
                stripeStatusDetails: data.stripeStatusDetails,
                createdAt: data.createdAt,
                isOnVacation: data.isOnVacation || false,
                latitude: data.latitude,
                longitude: data.longitude
            };
            
            setProfile(mappedProfile);
            lastFetchRef.current[cacheKey] = now;
        } catch (error: any) {
            console.error('Error fetching profile:', error);
            setProfileError(error);
        } finally {
            setIsLoadingProfile(false);
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

            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.expert.hires.listAsExpert}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.log('401 Unauthorized, signing out');
                    signOut();
                    throw new Error('Request failed with status 401');
                }
                throw new Error(`Failed to fetch searches: ${response.statusText}`);
            }

            const data = await response.json();
            setSearches(data);
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
                    console.log('401 Unauthorized, signing out');
                    signOut();
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
                    console.log('❌ 401 Unauthorized, signing out');
                    signOut();
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
                throw new Error(`Failed to start onboarding: ${response.statusText}`);
            }

            const { url, isLoginLink } = await response.json();
            console.log('✅ useExpert: Stripe response:', { url, isLoginLink });
            
            // Mostrar mensaje informativo según el tipo de enlace
            if (isLoginLink) {
                console.log('🔗 Redirigiendo a tu cuenta Stripe...');
            } else {
                console.log('🆕 Iniciando configuración de cuenta Stripe...');
            }
            
            window.location.href = url;
        } catch (error) {
            console.error('❌ useExpert: Error starting onboarding:', error);
            throw error;
        } finally {
            setIsStartingOnboarding(false);
        }
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

            window.location.href = url;
        } finally {
            setIsStartingOnboarding(false);
        }
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
                    console.log('401 Unauthorized, signing out');
                    signOut();
                    throw new Error('Request failed with status 401');
                }
                throw new Error(`Failed to check onboarding status: ${response.statusText}`);
            }

            const statusData: OnboardingStatusResponse = await response.json();
            console.log('Onboarding status received:', statusData);
            
            // Actualizar el perfil con la información más reciente del backend
            setProfile(prev => {
                if (!prev) return null;
                
                return {
                    ...prev,
                    stripeAccountId: statusData.stripeAccountId,
                    onboardingCompleted: statusData.onboardingCompleted,
                    canAccessStripe: statusData.canAccessStripe,
                    stripeStatus: statusData.stripeStatus,
                    stripeStatusDetails: statusData.stripeStatusDetails,
                    // Mapear los campos del backend a la estructura del frontend
                    pendingStripeAccountId: statusData.hasPendingOnboarding ? prev.pendingStripeAccountId : null
                };
            });
            
            lastFetchRef.current[cacheKey] = now;
            return statusData;
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
                    console.log('401 Unauthorized, signing out');
                    signOut();
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
                    console.log('401 Unauthorized, signing out');
                    signOut();
                    throw new Error('Request failed with status 401');
                }
                throw new Error(`Failed to sync Stripe status: ${response.statusText}`);
            }

            const syncedStatus = await response.json();
            console.log('Estado sincronizado:', syncedStatus);
            
            // Actualizar el perfil con la información sincronizada
            setProfile(prev => {
                if (!prev) return null;
                
                return {
                    ...prev,
                    stripeAccountId: syncedStatus.stripeAccountId,
                    onboardingCompleted: syncedStatus.onboardingCompleted,
                    canAccessStripe: syncedStatus.canAccessStripe,
                    stripeStatus: syncedStatus.stripeStatus,
                    stripeStatusDetails: syncedStatus.stripeStatusDetails,
                    pendingStripeAccountId: syncedStatus.hasPendingOnboarding ? prev.pendingStripeAccountId : null
                };
            });
            
            return syncedStatus;
        } catch (error) {
            console.error('Error syncing Stripe status:', error);
            throw error;
        }
    };

    useEffect(() => {
        if (user?.role === 'Expert') {
            // Solo cargar datos iniciales una vez
            fetchProfile(true); // Forzar carga inicial
            fetchServiceTypes(true); // Forzar carga inicial
            fetchSearches(true); // Forzar carga inicial
        }
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
        fetchProfile: () => fetchProfile(true), // Forzar refresh
        fetchSearches: () => fetchSearches(true), // Forzar refresh
        fetchServiceTypes: () => fetchServiceTypes(true), // Forzar refresh
    };
}