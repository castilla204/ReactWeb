// ✅ HOOK UNIFICADO OPTIMIZADO PARA SEARCHDETAILS (ACTUALIZADO)

// import React from 'react'; // ❌ YA NO NECESARIO
import { useQueryClient } from '@tanstack/react-query';
import { useSearchDetailsComplete } from './useSearchDetailsComplete';
import { 
  UseSearchDetailsOptimizedReturn,
  UseSearchDetailsOptions 
} from '../types/searchDetails';

/**
 * Hook unificado optimizado para SearchDetails
 * Ahora usa solo useSearchDetailsComplete que incluye TODA la información
 * 
 * @param searchId - ID de la búsqueda (opcional si se usa searchHireId)
 * @param options - Opciones de configuración del hook (puede incluir searchHireId)
 * @returns Todos los datos de SearchDetails optimizados
 */
export const useSearchDetailsOptimized = (
  searchId: number | null = null, 
  options: UseSearchDetailsOptions & { searchHireId?: number } = {}
): UseSearchDetailsOptimizedReturn => {
  const queryClient = useQueryClient();
  
  // ✅ Una sola llamada que incluye TODO (usa searchHireId si está disponible)
  const searchDetailsQuery = useSearchDetailsComplete(searchId, options);
  
  // ✅ Función para invalidar todas las queries relacionadas
  const invalidateAll = () => {
    if (options.searchHireId) {
      queryClient.invalidateQueries({ queryKey: ['searchDetailsCompleteByHire', options.searchHireId] });
    }
    if (searchId) {
      queryClient.invalidateQueries({ queryKey: ['searchDetailsComplete', searchId] });
    }
    queryClient.invalidateQueries({ queryKey: ['expertHires'] });
    queryClient.invalidateQueries({ queryKey: ['searches'] });
    queryClient.invalidateQueries({ queryKey: ['appointments'] });
    queryClient.invalidateQueries({ queryKey: ['disputes'] });
  };
  
  // ✅ Función para refetch
  const refetch = () => {
    searchDetailsQuery.refetch();
  };
  
  return {
    // Datos principales
    search: searchDetailsQuery.data?.search,
    moneyDistribution: searchDetailsQuery.data?.moneyDistribution || undefined,
    category: searchDetailsQuery.data?.category || undefined, // ✅ NUEVO: Categoría incluida
    review: searchDetailsQuery.data?.review || undefined, // ✅ NUEVO: Review incluida
    expertProfile: searchDetailsQuery.data?.expertProfile || undefined, // ✅ NUEVO: Perfil del experto con disponibilidad
    
    // Datos adicionales (ahora incluidos en la misma respuesta)
    conversations: [], // Las conversaciones siguen siendo un endpoint separado
    appointment: searchDetailsQuery.data?.appointment || undefined,
    deliverables: searchDetailsQuery.data?.deliverables || [],
    requiredDeliverableTypes: searchDetailsQuery.data?.requiredDeliverableTypes || [], // ✅ NUEVO: Tipos de reportes requeridos
    disputes: searchDetailsQuery.data?.disputes || [],
    
    // Estados de carga
    isLoading: searchDetailsQuery.isLoading,
    isError: searchDetailsQuery.isError,
    error: searchDetailsQuery.error,
    
    // Funciones de invalidación
    invalidateAll,
    refetch
  };
};

/**
 * Hook con lazy loading para tabs (SIMPLIFICADO)
 * Ahora todos los datos vienen en una sola llamada
 */
export const useSearchDetailsWithLazyLoading = (
  searchId: number,
  activeTab: 'details' | 'chat' | 'disputes' | 'appointment' = 'details'
) => {
  // ✅ Una sola llamada que incluye TODO
  const searchDetailsQuery = useSearchDetailsComplete(searchId);
  
  return {
    // Datos principales (siempre disponibles)
    search: searchDetailsQuery.data?.search,
    moneyDistribution: searchDetailsQuery.data?.moneyDistribution,
    
    // Datos adicionales (ahora incluidos en la misma respuesta)
    conversations: [], // Las conversaciones siguen siendo un endpoint separado
    appointment: searchDetailsQuery.data?.appointment || undefined,
    deliverables: searchDetailsQuery.data?.deliverables || [],
    disputes: searchDetailsQuery.data?.disputes || [],
    
    // Conversación completa (solo para chat - endpoint separado)
    fullConversation: [],
    
    // Estados de carga
    isLoadingMain: searchDetailsQuery.isLoading,
    isLoadingAdditional: false, // Ya no hay carga adicional
    isLoadingFullConversation: false, // Se maneja por separado
    
    // Estados de error
    isError: searchDetailsQuery.isError,
    error: searchDetailsQuery.error,
    
    // Funciones
    refetch: () => {
      searchDetailsQuery.refetch();
    }
  };
};

/**
 * Hook para prefetch de datos relacionados (SIMPLIFICADO)
 * Ya no es necesario prefetch porque todo viene en una sola llamada
 */
export const useSearchDetailsWithPrefetch = (searchId: number) => {
  // ✅ Una sola llamada que incluye TODO
  const searchDetailsQuery = useSearchDetailsComplete(searchId);
  
  return {
    search: searchDetailsQuery.data?.search,
    moneyDistribution: searchDetailsQuery.data?.moneyDistribution,
    category: searchDetailsQuery.data?.category,
    review: searchDetailsQuery.data?.review,
    appointment: searchDetailsQuery.data?.appointment || undefined,
    deliverables: searchDetailsQuery.data?.deliverables || [],
    disputes: searchDetailsQuery.data?.disputes || [],
    isLoading: searchDetailsQuery.isLoading,
    isError: searchDetailsQuery.isError,
    error: searchDetailsQuery.error,
    refetch: searchDetailsQuery.refetch
  };
};
