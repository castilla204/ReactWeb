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
      return fetchApi<CreateDisputeResponse>('/api/dispute', {
        method: 'POST',
        body: JSON.stringify(data),
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

        const url = `/api/dispute/all${params.toString() ? `?${params.toString()}` : ''}`;
        
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
        return fetchApi<DisputeDto>(`/api/dispute/${disputeId}`);
      },
      enabled: !!disputeId,
    });
  };

  // Hook para obtener la búsqueda completa desde una disputa (solo admin)
  const useDisputeSearch = (disputeId: number) => {
    return useQuery({
      queryKey: ['disputes', 'search', disputeId],
      queryFn: async () => {
        return fetchApi(`/api/dispute/${disputeId}/search`);
      },
      enabled: !!disputeId,
    });
  };

  // Hook para resolver una disputa (solo admin)
  const resolveDispute = useMutation({
    mutationFn: async ({ 
      disputeId, 
      data 
    }: { 
      disputeId: number; 
      data: ResolveDisputeDto 
    }): Promise<ResolveDisputeResponse> => {
      return fetchApi<ResolveDisputeResponse>(`/api/dispute/${disputeId}/resolve`, {
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

  return {
    // Mutations
    createDispute,
    resolveDispute,
    
    // Queries
    useDisputesList,
    useDisputeDetails,
    useDisputeSearch,
  };
};
