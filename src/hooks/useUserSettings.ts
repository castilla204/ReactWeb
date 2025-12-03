import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import { UserSettings } from '../types/appointment';

// ═══════════════════════════════════════════════════════════════
// ✅ CONSTANTES PARA TIMEZONE
// ═══════════════════════════════════════════════════════════════
const TIMEZONE_STORAGE_KEY = 'userTimezone';
const DEFAULT_TIMEZONE = 'UTC';

/**
 * Detecta la zona horaria del navegador
 */
const detectBrowserTimezone = (): string => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
        return DEFAULT_TIMEZONE;
    }
};

/**
 * Obtiene el timezone del localStorage o detecta del navegador
 */
const getStoredTimezone = (): string => {
    const stored = localStorage.getItem(TIMEZONE_STORAGE_KEY);
    return stored || detectBrowserTimezone();
};

/**
 * Guarda el timezone en localStorage
 */
const saveTimezoneToStorage = (timezone: string): void => {
    localStorage.setItem(TIMEZONE_STORAGE_KEY, timezone);
};

export const useUserSettings = () => {
    const { fetchApi } = useApi();
    const queryClient = useQueryClient();

    const settingsQuery = useQuery({
        queryKey: ['userSettings'],
        queryFn: async () => {
            const settings = await fetchApi<UserSettings>('/api/UserSettings');
            // Sincronizar timezone con localStorage cuando se carga
            if (settings?.timezone) {
                saveTimezoneToStorage(settings.timezone);
            }
            return settings;
        },
    });

    const updateSettingsMutation = useMutation({
        mutationFn: (settings: Partial<UserSettings>) =>
            fetchApi('/api/UserSettings', {
                method: 'PUT',
                body: JSON.stringify(settings),
            }),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['userSettings'] });
            // Si se actualizó el timezone, guardar en localStorage
            if (variables.timezone) {
                saveTimezoneToStorage(variables.timezone);
            }
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

    // ═══════════════════════════════════════════════════════════════
    // ✅ FUNCIONES DE TIMEZONE
    // ═══════════════════════════════════════════════════════════════

    /**
     * Actualiza la zona horaria del usuario
     */
    const updateTimezone = (timezone: string) => {
        updateSettingsMutation.mutate({ timezone });
    };

    /**
     * Obtiene la zona horaria actual del usuario
     * Prioridad: settings del backend > localStorage > navegador
     */
    const getUserTimezone = (): string => {
        return settingsQuery.data?.timezone || getStoredTimezone();
    };

    /**
     * Detecta la zona horaria del navegador (para sugerencia inicial)
     */
    const getBrowserTimezone = (): string => {
        return detectBrowserTimezone();
    };

    return {
        settings: settingsQuery.data,
        isLoadingSettings: settingsQuery.isLoading,
        fetchApi, // Expose fetchApi for external use
        toggleWhatsApp,
        toggleEmail,
        updateTheme,
        isUpdating: updateSettingsMutation.isPending,
        
        // ✅ Nuevas funciones de timezone
        updateTimezone,
        getUserTimezone,
        getBrowserTimezone,
        timezone: settingsQuery.data?.timezone || getStoredTimezone(),
    };
};