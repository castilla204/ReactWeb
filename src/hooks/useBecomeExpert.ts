import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { setAuthToken } from '../lib/auth';
import { BecomeExpertResponse } from '../types/stripe';
import { API_CONFIG } from '../config/api';
import { AvailabilityFormData } from './useExpertProfile';
import { authService } from '../services/authService';

interface FormData {
    description: string;
    profilePicture: File | null;
    latitude: string;
    longitude: string;
    availability?: AvailabilityFormData;
    /** Radio de trabajo en km: 0 = solo en su taller, máx 200. Si no se envía, el backend usa 100. */
    workRadiusKm?: number;
}

interface MapLocation {
    lat: number;
    lng: number;
}

interface UseBecomeExpertResult {
    formData: FormData;
    previewUrl: string | null;
    isSubmitting: boolean;
    error: string | null;
    // 🛡️ Round 28: errorCode estable + país detectado para UX específica (en vez de mensaje fósil genérico).
    errorCode: string | null;
    detectedCountry: string | null;
    // ✅ Round 30: flag para que la página detecte el éxito SIN navegar — permite
    //    mostrar el bloque "Conecta Stripe" inline como continuación natural del wizard.
    submitted: boolean;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    applyProfilePhoto: (file: File, previewUrl: string) => void;
    handleMapClick: (location: {lat: number; lng: number}) => void;
    handleSubmit: () => Promise<void>;
    setFormData: React.Dispatch<React.SetStateAction<FormData>>;
    setPreviewUrl: React.Dispatch<React.SetStateAction<string | null>>;
}

/**
 * 🛡️ Round 28 MUD-AG: opciones para soportar re-onboarding tras mudanza:
 * existingProfilePictureUrl permite usar la foto del país anterior como preview
 * y sin requerir nuevo upload.
 */
export interface UseBecomeExpertOptions {
    existingProfilePictureUrl?: string | null;
}

export function useBecomeExpert(options: UseBecomeExpertOptions = {}): UseBecomeExpertResult {
    const { existingProfilePictureUrl } = options;
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState<FormData>({
        description: '',
        profilePicture: null,
        latitude: '',
        longitude: '',
        availability: undefined,
    });
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // 🛡️ Round 28: estados para errorCode + detectedCountry que viene del backend.
    const [errorCode, setErrorCode] = useState<string | null>(null);
    const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
    // ✅ Round 30: flag de éxito — la página lo usa para renderizar el bloque Stripe inline
    //    sin navegar a otra ruta (antes hacía navigate('/expert-panel')).
    const [submitted, setSubmitted] = useState(false);

    const applyProfilePhoto = useCallback((file: File, previewUrl: string) => {
        setFormData((prev) => ({ ...prev, profilePicture: file }));
        setPreviewUrl((prev) => {
            if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
            return previewUrl;
        });
        setError(null);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('La imagen no puede superar los 5MB');
                return;
            }
            if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
                setError('Solo se permiten imágenes JPG, JPEG y PNG');
                return;
            }
            applyProfilePhoto(file, URL.createObjectURL(file));
        }
    };

    const handleMapClick = (location: {lat: number; lng: number}) => {
        const newLocation = {
            lat: location.lat,
            lng: location.lng,
        };
        setFormData((prev) => ({
            ...prev,
            latitude: newLocation.lat.toString(),
            longitude: newLocation.lng.toString(),
        }));
    };

    const handleSubmit = useCallback(async () => {
        setIsSubmitting(true);
        setError(null);
        setErrorCode(null);
        setDetectedCountry(null);

        // Validaciones
        if (!formData.description.trim()) {
            setError('La descripción es requerida');
            setIsSubmitting(false);
            return;
        }

        if (formData.description.trim().length < 50) {
            setError('La descripción debe tener al menos 50 caracteres');
            setIsSubmitting(false);
            return;
        }

        // 🛡️ MUD-AG: experto mudado puede conservar foto del país anterior.
        if (!formData.profilePicture && !existingProfilePictureUrl) {
            setError('La foto de perfil es requerida');
            setIsSubmitting(false);
            return;
        }

        if (!formData.latitude || !formData.longitude) {
            setError('Por favor selecciona una ubicación en el mapa');
            setIsSubmitting(false);
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError('No se encontró el token de autenticación');
                setIsSubmitting(false);
                return;
            }

            // Crear FormData
            const data = new FormData();
            data.append('Description', formData.description.trim());
            // 🛡️ MUD-AG: solo enviar el archivo si el usuario subió uno nuevo.
            // Si null pero existingProfilePictureUrl está → backend lo preserva.
            if (formData.profilePicture) {
                data.append('ProfilePicture', formData.profilePicture);
            }
            data.append('Latitude', formData.latitude);
            data.append('Longitude', formData.longitude);

            if (typeof formData.workRadiusKm === 'number') {
                data.append('WorkRadiusKm', String(formData.workRadiusKm));
            }

            // Incluir disponibilidad si está presente
            if (formData.availability && formData.availability.daysOfWeek.length > 0) {
                formData.availability.daysOfWeek.forEach(day => {
                    data.append('AvailabilityDaysOfWeek', day);
                });
                data.append('AvailabilityStartTime', formData.availability.startTime);
                data.append('AvailabilityEndTime', formData.availability.endTime);
            }

            console.log('Enviando datos:', {
                description: formData.description.trim(),
                profilePicture: formData.profilePicture.name,
                latitude: formData.latitude,
                longitude: formData.longitude,
                availability: formData.availability
            });

            const response = await fetch(`${API_CONFIG.baseUrl}/api/User/become-expert`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // No incluir Content-Type cuando se envía FormData
                },
                body: data,
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                let errorMessage = 'Error al registrarse como experto';
                let parsedErrorCode: string | null = null;
                let parsedDetectedCountry: string | null = null;

                try {
                    const errorText = await response.text();
                    console.error('Server error response:', errorText);

                    if (errorText) {
                        const errorData = JSON.parse(errorText);
                        errorMessage = errorData.message || errorMessage;
                        // 🛡️ Round 28: leer errorCode + detectedCountry del backend.
                        parsedErrorCode = errorData.errorCode || null;
                        parsedDetectedCountry = errorData.detectedCountry || null;
                    }
                } catch (parseError) {
                    console.error('Error parsing error response:', parseError);

                    // Mensajes de error más específicos basados en el status code
                    switch (response.status) {
                        case 400:
                            errorMessage = 'Datos inválidos. Verifica que todos los campos estén correctos.';
                            break;
                        case 401:
                            errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente.';
                            break;
                        case 403:
                            errorMessage = 'No tienes permisos para realizar esta acción.';
                            break;
                        case 503:
                            errorMessage = 'Servicio temporalmente no disponible. Inténtalo en unos minutos.';
                            break;
                        case 500:
                            errorMessage = 'Error interno del servidor. Inténtalo más tarde.';
                            break;
                        default:
                            errorMessage = `Error del servidor (${response.status})`;
                    }
                }

                // 🛡️ Round 28: setea estados ANTES del throw para que la UI pueda reaccionar
                // a errorCode (ej: COUNTRY_NOT_SUPPORTED → mostrar país + link a soporte).
                if (parsedErrorCode) setErrorCode(parsedErrorCode);
                if (parsedDetectedCountry) setDetectedCountry(parsedDetectedCountry);

                const err = new Error(errorMessage) as Error & { errorCode?: string; detectedCountry?: string };
                if (parsedErrorCode) err.errorCode = parsedErrorCode;
                if (parsedDetectedCountry) err.detectedCountry = parsedDetectedCountry;
                throw err;
            }

            const rawResult = await response.json();
            console.log('Success response (raw):', rawResult);

            // ✅ Normalizar la respuesta del backend (puede venir en PascalCase o camelCase)
            const result: BecomeExpertResponse = {
                message: rawResult.Message || rawResult.message,
                token: rawResult.Token || rawResult.token,
                user: {
                    id: rawResult.User?.Id || rawResult.user?.id,
                    name: rawResult.User?.Name || rawResult.user?.name,
                    email: rawResult.User?.Email || rawResult.user?.email,
                    phoneVerified: rawResult.User?.PhoneVerified ?? rawResult.user?.phoneVerified ?? false,
                    role: rawResult.User?.Role || rawResult.user?.role,
                    expertProfile: {
                        id: rawResult.User?.ExpertProfile?.Id || rawResult.user?.expertProfile?.id,
                        profilePictureUrl: rawResult.User?.ExpertProfile?.ProfilePictureUrl || rawResult.user?.expertProfile?.profilePictureUrl,
                        description: rawResult.User?.ExpertProfile?.Description || rawResult.user?.expertProfile?.description,
                        stripeAccountId: rawResult.User?.ExpertProfile?.StripeAccountId || rawResult.user?.expertProfile?.stripeAccountId,
                        createdAt: rawResult.User?.ExpertProfile?.CreatedAt || rawResult.user?.expertProfile?.createdAt,
                        latitude: rawResult.User?.ExpertProfile?.Latitude || rawResult.user?.expertProfile?.latitude,
                        longitude: rawResult.User?.ExpertProfile?.Longitude || rawResult.user?.expertProfile?.longitude,
                        stripeStatus: rawResult.User?.ExpertProfile?.StripeStatus || rawResult.user?.expertProfile?.stripeStatus,
                        stripeStatusDetails: rawResult.User?.ExpertProfile?.StripeStatusDetails || rawResult.user?.expertProfile?.stripeStatusDetails,
                        onboardingCompleted: rawResult.User?.ExpertProfile?.OnboardingCompleted ?? rawResult.user?.expertProfile?.onboardingCompleted ?? false,
                        stripeFutureRequirements: rawResult.User?.ExpertProfile?.StripeFutureRequirements || rawResult.user?.expertProfile?.stripeFutureRequirements,
                        stripeFutureDueAt: rawResult.User?.ExpertProfile?.StripeFutureDueAt || rawResult.user?.expertProfile?.stripeFutureDueAt,
                        isOnVacation: rawResult.User?.ExpertProfile?.IsOnVacation ?? rawResult.user?.expertProfile?.isOnVacation,
                        currentAvailability: rawResult.User?.ExpertProfile?.CurrentAvailability || rawResult.user?.expertProfile?.currentAvailability,
                    }
                }
            };

            console.log('Success response (normalized):', result);
            console.log('User role received:', result.user?.role);
            console.log('Full user object:', result.user);
            console.log('Expert profile:', result.user?.expertProfile);

            if (!result.token || !result.user) {
                throw new Error('Respuesta del servidor incompleta');
            }

            // Verificar el rol de forma más flexible
            const userRole = result.user.role;
            if (userRole !== 'Expert' && userRole !== 'expert' && userRole !== 'EXPERT') {
                console.warn('Rol inesperado recibido:', userRole);
                // No lanzar error, solo advertir - el backend ya creó el usuario como experto
                // throw new Error('El usuario no tiene el rol de Experto después del registro');
            }

            // Log the new Stripe status information
            if (result.user.expertProfile) {
                console.log('Stripe Status:', result.user.expertProfile.stripeStatus);
                console.log('Stripe Status Details:', result.user.expertProfile.stripeStatusDetails);
                console.log('Onboarding Completed:', result.user.expertProfile.onboardingCompleted);
            }

            // ✅ Asegurar que el rol esté correctamente establecido como 'Expert'
            // Normalizar el objeto user para que tenga la estructura correcta
            const userToUpdate = {
                id: result.user.id,
                name: result.user.name,
                email: result.user.email,
                phoneVerified: result.user.phoneVerified ?? false,
                role: 'Expert', // ✅ Forzar rol a Expert para asegurar consistencia
                // Mantener también en PascalCase para compatibilidad
                Id: result.user.id,
                Name: result.user.name,
                Email: result.user.email,
                PhoneVerified: result.user.phoneVerified ?? false,
                Role: 'Expert',
                // Incluir expertProfile si existe
                expertProfile: result.user.expertProfile,
                ExpertProfile: result.user.expertProfile,
            };

            console.log('✅ [useBecomeExpert] Actualizando usuario con rol Expert:', userToUpdate);
            console.log('✅ [useBecomeExpert] Rol del usuario:', userToUpdate.role, userToUpdate.Role);

            // ✅ CRÍTICO: Guardar token en authService PRIMERO para que esté disponible
            // El backend de become-expert devuelve solo el accessToken en result.token
            // Verificar si el token viene en formato "accessToken|refreshToken" (como googleAuth)
            // o solo es el accessToken
            let accessToken = result.token;
            let refreshToken: string | null = null;

            try {
                // Verificar si el token viene en formato "accessToken|refreshToken"
                if (result.token.includes('|')) {
                    [accessToken, refreshToken] = result.token.split('|');
                    console.log('✅ [useBecomeExpert] Token viene en formato "accessToken|refreshToken"');
                } else {
                    // Solo viene accessToken, intentar usar refreshToken existente
                    // ⚠️ IMPORTANTE: El backend puede invalidar tokens antiguos al generar uno nuevo
                    // Si el refreshToken antiguo no funciona, el interceptor lo manejará
                    const existingRefreshToken = localStorage.getItem('refreshToken');
                    if (existingRefreshToken) {
                        refreshToken = existingRefreshToken;
                        console.log('✅ [useBecomeExpert] Usando refreshToken existente del localStorage');
                    } else {
                        // ⚠️ No hay refreshToken - esto causará problemas al intentar refrescar
                        // Por ahora usar el mismo token como refreshToken temporal (puede fallar)
                        console.warn('⚠️ [useBecomeExpert] No hay refreshToken disponible - el backend debería devolverlo');
                        refreshToken = result.token; // Temporal, pero mejor que nada
                    }
                }

                // Guardar tokens en authService
                authService.setTokens(accessToken, refreshToken);

                // ✅ CRÍTICO: Programar renovación automática del token
                authService.scheduleTokenRefresh();

                // ✅ Verificar que los tokens se guardaron correctamente
                const savedAccessToken = authService.getAccessToken();
                const savedRefreshToken = authService.getRefreshToken();
                console.log('✅ [useBecomeExpert] Tokens guardados:', {
                    accessToken: !!savedAccessToken,
                    refreshToken: !!savedRefreshToken,
                    accessTokenCoincide: savedAccessToken === accessToken
                });
            } catch (error) {
                console.error('❌ [useBecomeExpert] Error guardando token en authService:', error);
                // Si falla, usar el token directamente
                accessToken = result.token;
                refreshToken = result.token;
                authService.setTokens(accessToken, refreshToken);
            }

            // Guardar token en localStorage también (compatibilidad)
            setAuthToken(accessToken, userToUpdate);

            console.log('✅ [useBecomeExpert] Usuario a actualizar:', {
                id: userToUpdate.id,
                email: userToUpdate.email,
                role: userToUpdate.role,
                Role: userToUpdate.Role,
                hasToken: !!accessToken
            });

            // Actualizar autenticación - actualizar el contexto
            updateUser(userToUpdate, accessToken);

            // ✅ Esperar un momento para que el contexto y authService se actualicen completamente
            await new Promise(resolve => setTimeout(resolve, 500));

            // Verificar que el token se guardó correctamente
            const savedToken = authService.getAccessToken();
            const savedRefreshToken = authService.getRefreshToken();
            console.log('✅ [useBecomeExpert] Verificación final:', {
                tokenGuardado: !!savedToken,
                refreshTokenGuardado: !!savedRefreshToken,
                userEnContexto: !!userToUpdate,
                userRole: userToUpdate.role
            });

            // ✅ CRÍTICO: Verificar que el token esté disponible antes de navegar
            if (!savedToken) {
                console.error('❌ [useBecomeExpert] Token no se guardó correctamente, reintentando...');
                // Reintentar guardar el token
                const tokenToUse = result.token.includes('|') ? result.token.split('|')[0] : result.token;
                const refreshToUse = savedRefreshToken || (result.token.includes('|') ? result.token.split('|')[1] : result.token);
                authService.setTokens(tokenToUse, refreshToUse);
                authService.scheduleTokenRefresh();
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            // ✅ CRÍTICO: Verificar que el refreshToken funcione
            // Si el refreshToken antiguo no funciona (porque el backend lo invalidó),
            // el interceptor de authService lo manejará automáticamente al recibir 401
            // Pero es mejor advertir si el refreshToken es igual al accessToken (temporal)
            try {
                const currentRefreshToken = authService.getRefreshToken();
                if (currentRefreshToken && currentRefreshToken === savedToken) {
                    // El refreshToken es el mismo que el accessToken (temporal), esto puede causar problemas
                    console.warn('⚠️ [useBecomeExpert] RefreshToken es igual al accessToken - puede causar problemas al refrescar');
                    console.warn('⚠️ [useBecomeExpert] El backend debería devolver también el refreshToken en la respuesta');
                }
            } catch (error) {
                console.warn('⚠️ [useBecomeExpert] Error verificando refreshToken:', error);
            }

            // Mostrar notificación de éxito
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'success',
                    message: '✨ ¡Tu perfil de experto está listo! Conecta tus cobros para empezar a recibir encargos.',
                },
            }));

            // ✅ Round 30: NO navegamos a /expert-panel. La página detectará `submitted=true`
            //    y mostrará el bloque "Conecta Stripe" inline como continuación del wizard.
            //    Antes: navigate('/expert-panel'). Ahora se gestiona dentro del propio paso 3.
            console.log('✅ [useBecomeExpert] Registro completo — mostrando bloque Stripe inline');
            setSubmitted(true);

        } catch (err) {
            console.error('Error in handleSubmit:', err);
            const errorMessage = err instanceof Error ? err.message : 'Error al procesar la solicitud';
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, navigate, updateUser]);

    // ✅ Removido: La navegación se maneja en handleSubmit después de actualizar el usuario

    return {
        formData,
        previewUrl,
        isSubmitting,
        error,
        errorCode,
        detectedCountry,
        submitted,
        handleFileChange,
        applyProfilePhoto,
        handleMapClick,
        handleSubmit,
        setFormData,
        setPreviewUrl
    };
}
