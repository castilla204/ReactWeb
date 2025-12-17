/**
 * ═══════════════════════════════════════════════════════════════
 * HOOK PARA MANEJAR ZONAS HORARIAS
 * ═══════════════════════════════════════════════════════════════
 * 
 * Este hook obtiene la lista de zonas horarias disponibles del backend
 * y proporciona funciones útiles para el manejo de timezone.
 */

import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';
import { AvailableTimezone, TimezoneListResponse } from '../types/appointment';
import { detectBrowserTimezone, getStoredTimezone } from '../utils/dateService';

/**
 * Hook para obtener la lista de zonas horarias disponibles
 */
export const useTimezones = () => {
  const { fetchApi } = useApi();

  const timezonesQuery = useQuery({
    queryKey: ['timezones'],
    queryFn: async () => {
      const response = await fetchApi<TimezoneListResponse>(
        API_CONFIG.endpoints.userSettings.timezones
      );
      return response;
    },
    staleTime: 1000 * 60 * 60 * 24, // Cache por 24 horas (los timezones no cambian)
    gcTime: 1000 * 60 * 60 * 24 * 7, // Mantener en cache por 7 días
  });

  /**
   * Obtiene el nombre de display de un timezone
   */
  const getTimezoneDisplayName = (timezoneId: string): string => {
    const timezone = timezonesQuery.data?.timezones.find(tz => tz.id === timezoneId);
    return timezone?.displayName || timezoneId;
  };

  /**
   * Obtiene el offset de un timezone
   */
  const getTimezoneOffset = (timezoneId: string): string => {
    const timezone = timezonesQuery.data?.timezones.find(tz => tz.id === timezoneId);
    return timezone?.offset || '';
  };

  /**
   * Busca timezones por nombre o ID
   */
  const searchTimezones = (query: string): AvailableTimezone[] => {
    if (!timezonesQuery.data?.timezones) return [];
    
    const lowerQuery = query.toLowerCase();
    return timezonesQuery.data.timezones.filter(tz => 
      tz.id.toLowerCase().includes(lowerQuery) ||
      tz.displayName.toLowerCase().includes(lowerQuery)
    );
  };

  /**
   * Verifica si un timezone ID es válido
   */
  const isValidTimezone = (timezoneId: string): boolean => {
    if (!timezonesQuery.data?.timezones) return false;
    return timezonesQuery.data.timezones.some(tz => tz.id === timezoneId);
  };

  /**
   * Obtiene el timezone del navegador
   */
  const getBrowserTimezone = (): string => {
    return detectBrowserTimezone();
  };

  /**
   * Obtiene el timezone almacenado actualmente
   */
  const getCurrentTimezone = (): string => {
    return getStoredTimezone();
  };

  return {
    // Data
    timezones: timezonesQuery.data?.timezones || [],
    note: timezonesQuery.data?.note || '',
    
    // Estados
    isLoading: timezonesQuery.isLoading,
    isError: timezonesQuery.isError,
    error: timezonesQuery.error,
    
    // Funciones
    getTimezoneDisplayName,
    getTimezoneOffset,
    searchTimezones,
    isValidTimezone,
    getBrowserTimezone,
    getCurrentTimezone,
    
    // Refetch
    refetch: timezonesQuery.refetch,
  };
};

export default useTimezones;

