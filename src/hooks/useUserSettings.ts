import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';

interface UserSettings {
    isWhatsAppEnabled: boolean;
    isEmailEnabled: boolean;
    theme: string;
}

export const useUserSettings = () => {
    const { fetchApi } = useApi();
    const queryClient = useQueryClient();

    const settingsQuery = useQuery({
        queryKey: ['userSettings'],
        queryFn: () => fetchApi<UserSettings>('/api/UserSettings'),
    });


    const updateSettingsMutation = useMutation({
        mutationFn: (settings: Partial<UserSettings>) =>
            fetchApi('/api/UserSettings', {
                method: 'PUT',
                body: JSON.stringify(settings),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userSettings'] });
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'success',
                    message: '⚙️ Settings updated successfully'
                }
            }));
        },
        onError: () => {
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: '❌ Failed to update settings'
                }
            }));
        }
    });

    const toggleWhatsApp = () => {
        if (settingsQuery.data) {
            updateSettingsMutation.mutate({
                isWhatsAppEnabled: !settingsQuery.data.isWhatsAppEnabled
            });
        }
    };

    const toggleEmail = () => {
        if (settingsQuery.data) {
            updateSettingsMutation.mutate({
                isEmailEnabled: !settingsQuery.data.isEmailEnabled
            });
        }
    };

    const updateTheme = (theme: string) => {
        updateSettingsMutation.mutate({ theme });
    };

    return {
        settings: settingsQuery.data,
        isLoadingSettings: settingsQuery.isLoading,
        fetchApi, // Expose fetchApi for external use
        toggleWhatsApp,
        toggleEmail,
        updateTheme,
        isUpdating: updateSettingsMutation.isPending
    };
};