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

    const balanceQuery = useQuery({
        queryKey: ['userBalance'],
        queryFn: async () => {
            try {
                console.log('[useUserSettings] Fetching balance...');
                const result = await fetchApi<{ balance: number }>('/api/User/user-balance');
                console.log('[useUserSettings] Balance fetched successfully:', result);
                return result;
            } catch (error) {
                console.error('[useUserSettings] Balance fetch error:', error);
                // Add mobile-specific debugging
                console.error('[useUserSettings] User agent:', navigator.userAgent);
                console.error('[useUserSettings] Connection type:', (navigator as any).connection?.effectiveType);
                throw error;
            }
        },
        select: (data) => data.balance,
        retry: (failureCount, error) => {
            // More aggressive retry for mobile
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const maxRetries = isMobile ? 3 : 1;
            console.log(`[useUserSettings] Retry attempt ${failureCount}/${maxRetries} (mobile: ${isMobile})`);
            return failureCount < maxRetries;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
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

    const refetchBalance = () => queryClient.refetchQueries({ queryKey: ['userBalance'] });

    return {
        settings: settingsQuery.data,
        isLoadingSettings: settingsQuery.isLoading,
        balance: balanceQuery.data,
        isLoadingBalance: balanceQuery.isLoading,
        balanceError: balanceQuery.error,
        fetchApi, // Expose fetchApi for external use
        refetchBalance, // Add refetchBalance function
        toggleWhatsApp,
        toggleEmail,
        updateTheme,
        isUpdating: updateSettingsMutation.isPending
    };
};