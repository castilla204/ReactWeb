import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';
import type {
  CreateDisputeDto,
  CreateDisputeResponse,
  DisputeDto,
  DisputeFilters,
  DisputeListResponseDto,
  ResolveDisputeDto,
  ResolveDisputeResponse,
} from '../types/dispute';

export const useDisputes = () => {
  const { fetchApi } = useApi();
  const queryClient = useQueryClient();

  // Hook para crear una disputa (usuarios normales)
  const createDispute = useMutation({
    mutationFn: async (data: CreateDisputeDto): Promise<CreateDisputeResponse> => {
      const formData = new FormData();
      
      // Agregar campos obligatorios
      formData.append('SearchHireId', data.searchHireId.toString());
      formData.append('Reason', data.reason);
      
      // Agregar archivos si existen
      if (data.files && data.files.length > 0) {
        data.files.forEach((file, index) => {
          formData.append('Files', file);
        });
      }
      
      return fetchApi<CreateDisputeResponse>(API_CONFIG.endpoints.dispute.create, {
        method: 'POST',
        body: formData,
        requiresAuth: true,
      });
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      queryClient.invalidateQueries({ queryKey: ['searches'] });
    },
  });

  // Hook para listar todas las disputas (solo admin)
  const useDisputesList = (filters: DisputeFilters = {}) => {
    return useQuery({
      queryKey: ['disputes', 'list', filters],
      queryFn: async (): Promise<DisputeListResponseDto> => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            params.append(key, value.toString());
          }
        });

        const url = `${API_CONFIG.endpoints.dispute.list}${params.toString() ? `?${params.toString()}` : ''}`;
        
        // Debug logging
        console.log('[useDisputes] Making dispute list request:', {
          url,
          filters,
          hasToken: !!localStorage.getItem('authToken')
        });
        
        return fetchApi<DisputeListResponseDto>(url);
      },
      enabled: true,
    });
  };

  // Hook para obtener detalles de una disputa específica (solo admin)
  const useDisputeDetails = (disputeId: number) => {
    return useQuery({
      queryKey: ['disputes', 'details', disputeId],
      queryFn: async (): Promise<DisputeDto> => {
        return fetchApi<DisputeDto>(API_CONFIG.endpoints.dispute.get(disputeId));
      },
      enabled: !!disputeId,
    });
  };

  // Hook para obtener la búsqueda completa desde una disputa (solo admin)
  const useDisputeSearch = (disputeId: number) => {
    return useQuery({
      queryKey: ['disputes', 'search', disputeId],
      queryFn: async () => {
        return fetchApi(API_CONFIG.endpoints.dispute.getSearch(disputeId));
      },
      enabled: !!disputeId,
    });
  };

  // Hook para obtener disputas del usuario (unificado - cliente, experto, admin)
  const useMyDisputes = (filters: DisputeFilters = {}) => {
    return useQuery({
      queryKey: ['disputes', 'my', filters],
      queryFn: async (): Promise<DisputeListResponseDto> => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            params.append(key, value.toString());
          }
        });

        const url = `${API_CONFIG.endpoints.dispute.myDisputes}${params.toString() ? `?${params.toString()}` : ''}`;
        
        return fetchApi<DisputeListResponseDto>(url);
      },
      enabled: true,
    });
  };

  // Hook para obtener información de disputa por searchHireId (usando el endpoint unificado)
  const useDisputeBySearchHire = (searchHireId: number) => {
    return useQuery({
      queryKey: ['disputes', 'by-search-hire', searchHireId],
      queryFn: async (): Promise<DisputeDto | null> => {
        const response = await fetchApi<DisputeListResponseDto>(`${API_CONFIG.endpoints.dispute.myDisputes}?searchHireId=${searchHireId}&pageSize=1`);
        return response.disputes?.[0] || null;
      },
      enabled: !!searchHireId,
    });
  };

  // Hook para que el experto responda a una disputa
  const expertResponse = useMutation({
    mutationFn: async ({ 
      disputeId, 
      data 
    }: { 
      disputeId: number; 
      data: { response: string; files?: File[] }
    }): Promise<{ message: string }> => {
      const formData = new FormData();
      formData.append('Response', data.response);
      
      // Agregar archivos si existen
      if (data.files && data.files.length > 0) {
        data.files.forEach((file) => {
          formData.append('Files', file);
        });
      }
      
      return fetchApi<{ message: string }>(API_CONFIG.endpoints.dispute.expertResponse(disputeId), {
        method: 'POST',
        body: formData,
        requiresAuth: true,
      });
    },
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      queryClient.invalidateQueries({ queryKey: ['disputes', 'by-search-hire'] });
      queryClient.invalidateQueries({ queryKey: ['searches'] });
    },
  });

  // Hook para resolver una disputa (solo admin)
  const resolveDispute = useMutation({
    mutationFn: async ({ 
      disputeId, 
      data 
    }: { 
      disputeId: number; 
      data: ResolveDisputeDto 
    }): Promise<ResolveDisputeResponse> => {
      return fetchApi<ResolveDisputeResponse>(API_CONFIG.endpoints.dispute.resolve(disputeId), {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      queryClient.invalidateQueries({ queryKey: ['disputes', 'details', variables.disputeId] });
      queryClient.invalidateQueries({ queryKey: ['searches'] });
    },
  });

  // Función de debug para entender el error 403
  const debugDispute = async (disputeId: number) => {
    try {
      const response = await fetchApi(`${API_CONFIG.endpoints.dispute.debug(disputeId)}`, {
        method: 'GET',
        requiresAuth: true,
      });
      console.log('[useDisputes] Debug response:', response);
      return response;
    } catch (error) {
      console.error('[useDisputes] Debug error:', error);
      throw error;
    }
  };

  return {
    // Mutations
    createDispute,
    expertResponse,
    resolveDispute,
    
    // Queries
    useDisputesList,
    useMyDisputes,
    useDisputeDetails,
    useDisputeSearch,
    useDisputeBySearchHire,
    
    // Debug
    debugDispute,
  };
};
