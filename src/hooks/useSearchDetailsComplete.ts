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
      console.log(`[useSearchDetailsComplete] Endpoint: ${API_CONFIG.endpoints.search.detailsComplete(searchId)}`);
      
      const response = await fetchApi<SearchDetailsCompleteDto>(
        API_CONFIG.endpoints.search.detailsComplete(searchId)
      );
      
      // ✅ DEBUG: Verificar si hay algún problema con la respuesta
      if (!response) {
        console.error(`[useSearchDetailsComplete] No response received for searchId: ${searchId}`);
        throw new Error('No response received from API');
      }
      
      if (!response.search) {
        console.error(`[useSearchDetailsComplete] No search data in response for searchId: ${searchId}`);
        throw new Error('No search data in response');
      }
      
      console.log(`[useSearchDetailsComplete] Data received:`, response);
      
      // ✅ DEBUG: Verificar específicamente el estado del searchHire
      if (response?.search?.searchHire) {
        console.log(`[useSearchDetailsComplete] SearchHire status DEBUG:`, {
          searchHireId: response.search.searchHire.id,
          status: response.search.searchHire.status,
          statusType: typeof response.search.searchHire.status,
          statusLength: response.search.searchHire.status?.length,
          statusTrimmed: response.search.searchHire.status?.trim(),
          statusCharCodes: response.search.searchHire.status ? response.search.searchHire.status.split('').map(c => c.charCodeAt(0)) : null,
          // ✅ DEBUG: Verificar si el estado es exactamente 'awaiting_client_decision'
          isAwaitingClientDecision: response.search.searchHire.status === 'awaiting_client_decision',
          // ✅ DEBUG: Verificar si hay algún problema con la comparación
          comparisonResult: response.search.searchHire.status === 'awaiting_client_decision' ? 'MATCH' : 'NO_MATCH'
        });
      } else {
        console.log(`[useSearchDetailsComplete] No searchHire data found for searchId: ${searchId}`);
        console.log(`[useSearchDetailsComplete] Search data structure:`, {
          hasSearch: !!response.search,
          searchId: response.search?.id,
          searchTitle: response.search?.title,
          searchHire: response.search?.searchHire
        });
      }
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
