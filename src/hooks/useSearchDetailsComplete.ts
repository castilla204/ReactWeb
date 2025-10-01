// ✅ HOOK OPTIMIZADO PARA DATOS PRINCIPALES DE SEARCHDETAILS

import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';
import { 
  SearchDetailsCompleteDto, 
  UseSearchDetailsCompleteReturn,
  UseSearchDetailsOptions 
} from '../types/searchDetails';

/**
 * Hook optimizado para obtener datos principales de SearchDetails
 * Incluye: Search, SearchHire, Expert, Service, SearchParameters, MoneyDistribution
 * 
 * @param searchId - ID de la búsqueda
 * @param options - Opciones de configuración del hook
 * @returns Datos principales y estados de carga
 */
export const useSearchDetailsComplete = (
  searchId: number, 
  options: UseSearchDetailsOptions = {}
): UseSearchDetailsCompleteReturn => {
  const { fetchApi } = useApi();
  
  const {
    enabled = true,
    staleTime = 30000, // 30 segundos de cache
    gcTime = 300000, // 5 minutos en cache (antes cacheTime)
    refetchOnWindowFocus = false
  } = { ...options, gcTime: options.gcTime || 300000 };

  const query = useQuery({
    queryKey: ['searchDetailsComplete', searchId],
    queryFn: async (): Promise<SearchDetailsCompleteDto> => {
      console.log(`[useSearchDetailsComplete] Fetching data for searchId: ${searchId}`);
      
      const response = await fetchApi<SearchDetailsCompleteDto>(
        API_CONFIG.endpoints.search.detailsComplete(searchId)
      );
      
      console.log(`[useSearchDetailsComplete] Data received:`, response);
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
 * Hook simplificado para obtener solo los datos de la búsqueda
 * Útil cuando solo necesitas la información básica
 */
export const useSearchBasic = (searchId: number) => {
  const { data, isLoading, isError, error } = useSearchDetailsComplete(searchId);
  
  return {
    search: data?.search,
    isLoading,
    isError,
    error
  };
};

/**
 * Hook para obtener configuración de distribución de dinero
 * Útil cuando solo necesitas esta información específica
 */
export const useMoneyDistributionConfig = (searchId: number) => {
  const { data, isLoading, isError, error } = useSearchDetailsComplete(searchId);
  
  return {
    moneyDistribution: data?.moneyDistribution,
    isLoading,
    isError,
    error
  };
};
