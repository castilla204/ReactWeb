import { useRef } from 'react';
import { useDisputes } from './useDisputes';
import { useApi } from './useApi';
import { useNavigate } from 'react-router-dom';
import { showToast, NotificationType } from '../lib/toast';
import { API_CONFIG } from '../config/api';

export function useSearchActions() {
    const { createDispute, resolveDispute } = useDisputes();
    const { fetchApi } = useApi();
    const navigate = useNavigate();

    const addNotification = (type: NotificationType, message: string, duration?: number) => {
        showToast(type, message, duration);
    };

    // 🔁 Guard anti doble-submit: bloquea reentradas de la MISMA acción sobre el MISMO hire
    // (doble-clic / doble-tap) mientras la petición está en vuelo. Evita disputas/completados
    // duplicados y toasts de error confusos. El backend además es idempotente, esto es la 1ª línea.
    const inFlight = useRef<Record<string, boolean>>({});
    function guard<T extends (...args: any[]) => Promise<any>>(key: string, fn: T): T {
        return (async (...args: any[]) => {
            const id = `${key}-${args[0] ?? ''}`;
            if (inFlight.current[id]) {
                return undefined;
            }
            inFlight.current[id] = true;
            try {
                return await fn(...args);
            } finally {
                inFlight.current[id] = false;
            }
        }) as T;
    }

    const handleCancelService = async (searchHireId: number | undefined) => {
        try {
            if (!searchHireId) {
                throw new Error('SearchHire ID not found');
            }
            await fetchApi('/api/Subscription/cancel-service', {
                method: 'POST',
                body: JSON.stringify({ SearchHireId: searchHireId }),
            });
            addNotification('success', '✅ Servicio cancelado correctamente');
            navigate('/expert-panel');
        } catch (error) {
            console.error('Error canceling service:', error);
            addNotification('error', '❌ Error al cancelar el servicio');
        }
    };

    const handleForceFinalize = async (
        searchHireId: number | undefined,
        favorExpert: boolean,
        onSuccess: () => void
    ) => {
        try {
            if (!searchHireId) {
                throw new Error('SearchHire ID not found');
            }
            await fetchApi('/api/SearchHire/force-finalize', {
                method: 'POST',
                body: JSON.stringify({
                    SearchHireId: searchHireId,
                    ResolveInFavorOfClient: !favorExpert,
                }),
            });
            addNotification('success', '✅ Búsqueda finalizada exitosamente');
            onSuccess();
        } catch (error) {
            console.error('Error finalizing search:', error);
            addNotification('error', '❌ Error al finalizar la búsqueda');
        }
    };

    const handleCompleteService = async (searchHireId: number | undefined, onSuccess: () => void) => {
        try {
            if (!searchHireId) {
                throw new Error('SearchHire ID not found');
            }
            await fetchApi('/api/SearchHire/complete-service', {
                method: 'POST',
                body: JSON.stringify({
                    SearchHireId: searchHireId,
                    ClientApproved: true,
                }),
            });
            addNotification('success', '✅ Servicio completado exitosamente');
            onSuccess();
        } catch (error) {
            console.error('Error completing service:', error);
            addNotification('error', '❌ Error al completar el servicio');
        }
    };

    const handleDisputeSubmit = async (
        searchHireId: number | undefined,
        reason: string,
        files: File[] = [],
        onSuccess: () => void
    ) => {
        try {
            if (!searchHireId) {
                throw new Error('SearchHire ID not found');
            }
            if (!reason.trim()) {
                addNotification('error', '❌ Por favor, ingrese una razón para la disputa');
                return;
            }
            
            // Use the new dispute creation hook with file support
            await createDispute.mutateAsync({
                searchHireId,
                reason: reason.trim(),
                files: files.length > 0 ? files : undefined,
            });
            
            addNotification('success', '✅ Disputa iniciada exitosamente');
            onSuccess();
        } catch (error) {
            console.error('Error disputing service:', error);
            addNotification('error', '❌ Error al iniciar la disputa');
        }
    };

    const handleResolveDispute = async (
        searchHireId: number | undefined,
        resolveInFavorOfClient: boolean | null,
        resolution: string,
        onSuccess: () => void
    ) => {
        try {
            if (!searchHireId) {
                throw new Error('SearchHire ID not found');
            }
            if (!resolution.trim()) {
                addNotification('error', '❌ Por favor, ingrese una razón para la resolución');
                return;
            }
            if (resolveInFavorOfClient === null) {
                addNotification('error', '❌ Por favor, seleccione a quién dar la razón');
                return;
            }

            // First, get the dispute details to obtain the disputeId
            const disputeDetails = await fetchApi(API_CONFIG.endpoints.dispute.details(searchHireId));
            
            if (!disputeDetails || !disputeDetails.id) {
                throw new Error('Dispute not found for this service');
            }

            // Map the boolean to the correct action
            const action = resolveInFavorOfClient ? 'refund_client' : 'pay_expert';

            // Use the new dispute resolution endpoint
            await resolveDispute.mutateAsync({
                disputeId: disputeDetails.id,
                data: {
                    resolutionComments: resolution.trim(),
                    action: action
                }
            });

            addNotification('success', '✅ Disputa resuelta exitosamente');
            onSuccess();
        } catch (error: any) {
            console.error('Error resolving dispute:', error);
            // ✅ Extraer mensaje de error del servidor si está disponible
            // El error puede venir en diferentes formatos: error.message, error.response.data.message, etc.
            const errorMessage = error?.message || 
                                error?.response?.data?.message || 
                                error?.response?.data?.error || 
                                error?.data?.message || 
                                error?.data?.error ||
                                (typeof error === 'string' ? error : 'Error al resolver la disputa');
            addNotification('error', `❌ ${errorMessage}`);
        }
    };

    const handleAddAd = async (
        searchId: number,
        adData: {
            title: string;
            description: string;
            price: number;
            url: string;
            images: string[];
            category: string;
            province: string;
            city: string;
            sellerType: string;
            platformId: number;
        },
        onSuccess: () => void
    ) => {
        try {
            await fetchApi(`/api/SearchResult/${searchId}/manual-ad`, {
                method: 'POST',
                body: JSON.stringify(adData),
            });
            addNotification('success', '✅ Ad added successfully');
            onSuccess();
        } catch (error) {
            console.error('Error adding ad:', error);
            addNotification('error', '❌ Failed to add ad');
        }
    };

    return {
        // 🔁 envueltos con guard anti doble-submit (clave por acción + searchHireId)
        handleCancelService: guard('cancel', handleCancelService),
        handleForceFinalize: guard('forceFinalize', handleForceFinalize),
        handleCompleteService: guard('complete', handleCompleteService),
        handleDisputeSubmit: guard('dispute', handleDisputeSubmit),
        handleResolveDispute: guard('resolve', handleResolveDispute),
        handleAddAd,
    };
}