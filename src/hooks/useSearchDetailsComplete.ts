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
 * @param searchId - ID de la búsqueda (opcional si se usa searchHireId)
 * @param searchHireId - ID de la contratación (prioritario, funciona aunque Search sea null)
 * @param options - Opciones de configuración del hook
 * @returns Datos principales y estados de carga
 */
export const useSearchDetailsComplete = (
  searchId: number | null = null, 
  options: UseSearchDetailsOptions & { searchHireId?: number } = {}
): UseSearchDetailsCompleteReturn => {
  const { fetchApi } = useApi();
  const { searchHireId, ...restOptions } = options;
  
  const {
    enabled = true,
    staleTime = 30000, // 30 segundos de cache
    gcTime = 300000, // 5 minutos en cache (antes cacheTime)
    refetchOnWindowFocus = false
  } = { ...restOptions, gcTime: restOptions.gcTime || 300000 };

  // ✅ Usar searchHireId si está disponible, sino usar searchId
  const useSearchHireEndpoint = !!searchHireId;
  const identifier = searchHireId || searchId;
  const queryKey = useSearchHireEndpoint 
    ? ['searchDetailsCompleteByHire', searchHireId]
    : ['searchDetailsComplete', searchId];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<SearchDetailsCompleteDto> => {
      const endpoint = useSearchHireEndpoint
        ? API_CONFIG.endpoints.expert.hires.detailsComplete(searchHireId!)
        : API_CONFIG.endpoints.search.detailsComplete(searchId!);
      
      console.log(`[useSearchDetailsComplete] Fetching data for ${useSearchHireEndpoint ? 'searchHireId' : 'searchId'}: ${identifier}`);
      console.log(`[useSearchDetailsComplete] Endpoint: ${endpoint}`);
      
      const response = await fetchApi<SearchDetailsCompleteDto>(endpoint);
      
      // ✅ DEBUG: Verificar si hay algún problema con la respuesta
      if (!response) {
        console.error(`[useSearchDetailsComplete] No response received for ${useSearchHireEndpoint ? 'searchHireId' : 'searchId'}: ${identifier}`);
        throw new Error('No response received from API');
      }
      
      // ✅ Cuando se usa searchHireId, el search puede ser null (cliente eliminado) - esto es válido
      // ✅ Cuando se usa searchId, el search debería estar presente, pero verificamos
      if (!useSearchHireEndpoint && !response.search) {
        console.warn(`[useSearchDetailsComplete] No search data in response for searchId: ${searchId} - esto puede ser normal si el cliente borró su cuenta`);
        // No lanzamos error, permitimos que search sea null
      }
      
      // ✅ Log para debugging cuando search es null
      if (!response.search) {
        console.log(`[useSearchDetailsComplete] Search is null (cliente probablemente eliminado), pero tenemos otros datos:`, {
          hasAppointment: !!response.appointment,
          hasDeliverables: response.deliverables?.length > 0,
          hasDisputes: response.disputes?.length > 0,
          hasExpertProfile: !!response.expertProfile
        });
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
        console.log(`[useSearchDetailsComplete] No searchHire data found for ${useSearchHireEndpoint ? 'searchHireId' : 'searchId'}: ${identifier}`);
        console.log(`[useSearchDetailsComplete] Search data structure:`, {
          hasSearch: !!response.search,
          searchId: response.search?.id,
          searchTitle: response.search?.title,
          searchHire: response.search?.searchHire
        });
      }
      return response;
    },
    enabled: enabled && (!!searchHireId || !!searchId),
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
