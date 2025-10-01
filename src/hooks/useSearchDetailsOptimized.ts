// ✅ HOOK UNIFICADO OPTIMIZADO PARA SEARCHDETAILS

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchDetailsComplete } from './useSearchDetailsComplete';
import { useSearchDetailsAdditional } from './useSearchDetailsAdditional';
import { 
  UseSearchDetailsOptimizedReturn,
  UseSearchDetailsOptions 
} from '../types/searchDetails';

/**
 * Hook unificado optimizado para SearchDetails
 * Combina datos principales y adicionales en una sola interfaz
 * 
 * @param searchId - ID de la búsqueda
 * @param options - Opciones de configuración del hook
 * @returns Todos los datos de SearchDetails optimizados
 */
export const useSearchDetailsOptimized = (
  searchId: number, 
  options: UseSearchDetailsOptions = {}
): UseSearchDetailsOptimizedReturn => {
  const queryClient = useQueryClient();
  
  // ✅ Cargar datos principales inmediatamente
  const searchDetailsQuery = useSearchDetailsComplete(searchId, options);
  
  // ✅ Cargar datos adicionales en paralelo
  const additionalDataQuery = useSearchDetailsAdditional(searchId, options);
  
  // ✅ Función para invalidar todas las queries relacionadas
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['searchDetailsComplete', searchId] });
    queryClient.invalidateQueries({ queryKey: ['searchDetailsAdditional', searchId] });
  };
  
  // ✅ Función para refetch todas las queries
  const refetch = () => {
    searchDetailsQuery.refetch();
    additionalDataQuery.refetch();
  };
  
  return {
    // Datos principales
    search: searchDetailsQuery.data?.search,
    moneyDistribution: searchDetailsQuery.data?.moneyDistribution,
    
    // Datos adicionales
    conversations: additionalDataQuery.data?.conversations || [],
    appointment: additionalDataQuery.data?.appointment,
    deliverables: additionalDataQuery.data?.deliverables || [],
    disputes: additionalDataQuery.data?.disputes || [],
    
    // Estados de carga
    isLoading: searchDetailsQuery.isLoading || additionalDataQuery.isLoading,
    isError: searchDetailsQuery.isError || additionalDataQuery.isError,
    error: searchDetailsQuery.error || additionalDataQuery.error,
    
    // Funciones de invalidación
    invalidateAll,
    refetch
  };
};

/**
 * Hook con lazy loading para tabs
 * Carga datos adicionales solo cuando se necesitan
 */
export const useSearchDetailsWithLazyLoading = (
  searchId: number,
  activeTab: 'details' | 'chat' | 'disputes' | 'appointment' = 'details'
) => {
  // ✅ Siempre cargar datos principales
  const searchDetailsQuery = useSearchDetailsComplete(searchId);
  
  // ✅ Cargar datos adicionales solo cuando no esté en 'details'
  const additionalDataQuery = useSearchDetailsAdditional(searchId, {
    enabled: activeTab !== 'details'
  });
  
  // ✅ Cargar conversación completa solo cuando se abra el chat
  const fullConversationQuery = useSearchDetailsAdditional(searchId, {
    enabled: activeTab === 'chat' && !!additionalDataQuery.data?.conversations?.length
  });
  
  return {
    // Datos principales (siempre disponibles)
    search: searchDetailsQuery.data?.search,
    moneyDistribution: searchDetailsQuery.data?.moneyDistribution,
    
    // Datos adicionales (cargados bajo demanda)
    conversations: additionalDataQuery.data?.conversations || [],
    appointment: additionalDataQuery.data?.appointment,
    deliverables: additionalDataQuery.data?.deliverables || [],
    disputes: additionalDataQuery.data?.disputes || [],
    
    // Conversación completa (solo para chat)
    fullConversation: fullConversationQuery.data?.conversations || [],
    
    // Estados de carga
    isLoadingMain: searchDetailsQuery.isLoading,
    isLoadingAdditional: additionalDataQuery.isLoading,
    isLoadingFullConversation: fullConversationQuery.isLoading,
    
    // Estados de error
    isError: searchDetailsQuery.isError || additionalDataQuery.isError,
    error: searchDetailsQuery.error || additionalDataQuery.error,
    
    // Funciones
    refetch: () => {
      searchDetailsQuery.refetch();
      additionalDataQuery.refetch();
      fullConversationQuery.refetch();
    }
  };
};

/**
 * Hook para prefetch de datos relacionados
 * Útil para precargar datos que probablemente se necesitarán
 */
export const useSearchDetailsWithPrefetch = (searchId: number) => {
  const queryClient = useQueryClient();
  
  // ✅ Query principal
  const searchDetailsQuery = useSearchDetailsComplete(searchId);
  
  // ✅ Prefetch datos adicionales cuando estén disponibles
  const prefetchAdditionalData = () => {
    if (searchDetailsQuery.data?.search?.searchHire?.id) {
      queryClient.prefetchQuery({
        queryKey: ['searchDetailsAdditional', searchId],
        queryFn: async () => {
          const { fetchApi } = await import('./useApi');
          const { API_CONFIG } = await import('../config/api');
          return fetchApi(API_CONFIG.endpoints.search.detailsAdditional(searchId));
        },
        staleTime: 30000,
      });
    }
  };
  
  // ✅ Ejecutar prefetch cuando cambien los datos principales
  React.useEffect(() => {
    if (searchDetailsQuery.data) {
      prefetchAdditionalData();
    }
  }, [searchDetailsQuery.data]);
  
  return {
    search: searchDetailsQuery.data?.search,
    moneyDistribution: searchDetailsQuery.data?.moneyDistribution,
    isLoading: searchDetailsQuery.isLoading,
    isError: searchDetailsQuery.isError,
    error: searchDetailsQuery.error,
    refetch: searchDetailsQuery.refetch
  };
};
