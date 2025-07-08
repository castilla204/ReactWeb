import { useSubscription } from './useSubscription.hooks';
import { useApi } from './useApi';
import { useNavigate } from 'react-router-dom';
import { NotificationType } from './Notification';

export function useSearchActions(setNotifications: React.Dispatch<React.SetStateAction<{ id: string; type: NotificationType; message: string; duration?: number }[]>>) {
    const { forceFinalize, completeService, disputeService, resolveDispute } = useSubscription();
    const { fetchApi } = useApi();
    const navigate = useNavigate();

    const addNotification = (type: NotificationType, message: string, duration?: number) => {
        const id = Math.random().toString(36).substring(2, 9);
        setNotifications((prev) => [...prev, { id, type, message, duration }]);
    };

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
            await forceFinalize({
                SearchHireId: searchHireId,
                ResolveInFavorOfClient: !favorExpert,
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
            await completeService({
                SearchHireId: searchHireId,
                ClientApproved: true,
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
            await disputeService({
                SearchHireId: searchHireId,
                Reason: reason,
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
            await resolveDispute({
                SearchHireId: searchHireId,
                ResolveInFavorOfClient: resolveInFavorOfClient,
                Resolution: resolution,
            });
            addNotification('success', '✅ Disputa resuelta exitosamente');
            onSuccess();
        } catch (error) {
            console.error('Error resolving dispute:', error);
            addNotification('error', '❌ Error al resolver la disputa');
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
        handleCancelService,
        handleForceFinalize,
        handleCompleteService,
        handleDisputeSubmit,
        handleResolveDispute,
        handleAddAd,
    };
}