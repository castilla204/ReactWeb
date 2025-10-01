// ✅ HOOK OPTIMIZADO PARA DATOS ADICIONALES DE SEARCHDETAILS

import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';
import { 
  SearchDetailsAdditionalDto, 
  UseSearchDetailsAdditionalReturn,
  UseSearchDetailsOptions 
} from '../types/searchDetails';

/**
 * Hook optimizado para obtener datos adicionales de SearchDetails
 * Incluye: Conversations, Appointment, Deliverables, Disputes
 * 
 * @param searchId - ID de la búsqueda
 * @param options - Opciones de configuración del hook
 * @returns Datos adicionales y estados de carga
 */
export const useSearchDetailsAdditional = (
  searchId: number, 
  options: UseSearchDetailsOptions = {}
): UseSearchDetailsAdditionalReturn => {
  const { fetchApi } = useApi();
  
  const {
    enabled = true,
    staleTime = 30000, // 30 segundos de cache
    gcTime = 300000, // 5 minutos en cache (antes cacheTime)
    refetchOnWindowFocus = false
  } = { ...options, gcTime: options.gcTime || 300000 };

  const query = useQuery({
    queryKey: ['searchDetailsAdditional', searchId],
    queryFn: async (): Promise<SearchDetailsAdditionalDto> => {
      console.log(`[useSearchDetailsAdditional] Fetching additional data for searchId: ${searchId}`);
      
      const response = await fetchApi<SearchDetailsAdditionalDto>(
        API_CONFIG.endpoints.search.detailsAdditional(searchId)
      );
      
      console.log(`[useSearchDetailsAdditional] Additional data received:`, response);
      return response;
    },
    enabled: enabled && !!searchId,
    staleTime,
    gcTime,
    refetchOnWindowFocus,
    retry: 2,
    retryDelay: 1000
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
};

/**
 * Hook para obtener solo conversaciones
 * Útil cuando solo necesitas datos del chat
 */
export const useConversations = (searchId: number, options: UseSearchDetailsOptions = {}) => {
  const { data, isLoading, isError, error } = useSearchDetailsAdditional(searchId, options);
  
  return {
    conversations: data?.conversations || [],
    isLoading,
    isError,
    error
  };
};

/**
 * Hook para obtener solo la cita
 * Útil cuando solo necesitas información de appointment
 */
export const useAppointmentData = (searchId: number, options: UseSearchDetailsOptions = {}) => {
  const { data, isLoading, isError, error } = useSearchDetailsAdditional(searchId, options);
  
  return {
    appointment: data?.appointment,
    isLoading,
    isError,
    error
  };
};

/**
 * Hook para obtener solo archivos entregables
 * Útil cuando solo necesitas información de deliverables
 */
export const useDeliverablesData = (searchId: number, options: UseSearchDetailsOptions = {}) => {
  const { data, isLoading, isError, error } = useSearchDetailsAdditional(searchId, options);
  
  return {
    deliverables: data?.deliverables || [],
    isLoading,
    isError,
    error
  };
};

/**
 * Hook para obtener solo disputas
 * Útil cuando solo necesitas información de disputes
 */
export const useDisputesData = (searchId: number, options: UseSearchDetailsOptions = {}) => {
  const { data, isLoading, isError, error } = useSearchDetailsAdditional(searchId, options);
  
  return {
    disputes: data?.disputes || [],
    isLoading,
    isError,
    error
  };
};
