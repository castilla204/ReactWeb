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
      console.log('🔍 [useDisputes] Creating dispute with data:', {
        searchHireId: data.searchHireId,
        reason: data.reason,
        filesCount: data.files?.length || 0
      });
      
      const formData = new FormData();
      
      // Agregar campos obligatorios
      formData.append('SearchHireId', data.searchHireId.toString());
      formData.append('Reason', data.reason);
      
      // Agregar archivos si existen
      if (data.files && data.files.length > 0) {
        data.files.forEach((file, index) => {
          console.log(`🔍 [useDisputes] Adding file ${index}:`, {
            name: file.name,
            size: file.size,
            type: file.type
          });
          formData.append('Files', file);
        });
      }
      
      // Debug FormData contents
      console.log('🔍 [useDisputes] FormData contents:');
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`🔍 FormData ${key} = ${value.name}, ${value.size} bytes, ${value.type}`);
        } else {
          console.log(`🔍 FormData ${key} = ${value}`);
        }
      }
      
      console.log('🔍 [useDisputes] Making request to:', API_CONFIG.endpoints.dispute.create);
      
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
        
        const response = await fetchApi<any>(url);
        
        // ✅ NORMALIZAR respuesta según la guía (soporta PascalCase y camelCase)
        const disputesArray = response.Disputes || response.disputes || [];
        const paginationData = response.Pagination || response.pagination;
        const statsData = response.Stats || response.stats;
        
        const normalized: DisputeListResponseDto = {
          disputes: disputesArray.map((dispute: any) => ({
            id: dispute.Id ?? dispute.id,
            searchHireId: dispute.SearchHireId ?? dispute.searchHireId,
            reporterId: dispute.ReporterId ?? dispute.reporterId,
            status: dispute.Status ?? dispute.status,
            reason: dispute.Reason ?? dispute.reason,
            resolutionComments: dispute.ResolutionComments ?? dispute.resolutionComments,
            createdAt: dispute.CreatedAt ?? dispute.createdAt,
            expertResponse: dispute.ExpertResponse ?? dispute.expertResponse,
            expertResponseDeadline: dispute.ExpertResponseDeadline ?? dispute.expertResponseDeadline,
            expertResponseAt: dispute.ExpertResponseAt ?? dispute.expertResponseAt,
            canExpertRespond: dispute.CanExpertRespond ?? dispute.canExpertRespond,
            searchHire: dispute.SearchHire ? {
              id: dispute.SearchHire.Id ?? dispute.SearchHire.id,
              status: dispute.SearchHire.Status ?? dispute.SearchHire.status,
              amount: dispute.SearchHire.Amount ?? dispute.SearchHire.amount,
              createdAt: dispute.SearchHire.CreatedAt ?? dispute.SearchHire.createdAt,
            } : dispute.searchHire,
            reporter: dispute.Reporter ? {
              id: dispute.Reporter.Id ?? dispute.Reporter.id,
              email: dispute.Reporter.Email ?? dispute.Reporter.email,
              name: dispute.Reporter.Name ?? dispute.Reporter.name,
              profilePictureUrl: dispute.Reporter.ProfilePictureUrl ?? dispute.Reporter.profilePictureUrl,
            } : dispute.reporter,
            client: dispute.Client ? {
              id: dispute.Client.Id ?? dispute.Client.id,
              email: dispute.Client.Email ?? dispute.Client.email,
              name: dispute.Client.Name ?? dispute.Client.name,
              profilePictureUrl: dispute.Client.ProfilePictureUrl ?? dispute.Client.profilePictureUrl,
            } : dispute.client,
            expert: dispute.Expert ? {
              id: dispute.Expert.Id ?? dispute.Expert.id,
              email: dispute.Expert.Email ?? dispute.Expert.email,
              name: dispute.Expert.Name ?? dispute.Expert.name,
              profilePictureUrl: dispute.Expert.ProfilePictureUrl ?? dispute.Expert.profilePictureUrl,
            } : dispute.expert,
            search: dispute.Search ? {
              id: dispute.Search.Id ?? dispute.Search.id,
              title: dispute.Search.Title ?? dispute.Search.title,
              description: dispute.Search.Description ?? dispute.Search.description,
              createdAt: dispute.Search.CreatedAt ?? dispute.Search.createdAt,
            } : dispute.search,
            files: (dispute.Files || dispute.files || []).map((file: any) => ({
              id: file.Id ?? file.id,
              fileName: file.FileName ?? file.fileName,
              filePath: file.FilePath ?? file.filePath,
              fileType: file.FileType ?? file.fileType,
              fileSize: file.FileSize ?? file.fileSize,
              createdAt: file.CreatedAt ?? file.createdAt,
              fileUrl: file.FileUrl ?? file.fileUrl,
              uploadedByUserId: file.UploadedByUserId ?? file.uploadedByUserId,
              uploadedByUserName: file.UploadedByUserName ?? file.uploadedByUserName,
              uploadedByUserEmail: file.UploadedByUserEmail ?? file.uploadedByUserEmail,
              fileCategory: file.FileCategory ?? file.fileCategory,
              fileCategoryLabel: file.FileCategoryLabel ?? file.fileCategoryLabel,
            })),
          })),
          pagination: paginationData ? {
            currentPage: paginationData.CurrentPage ?? paginationData.currentPage ?? paginationData.page ?? 1,
            pageSize: paginationData.PageSize ?? paginationData.pageSize ?? filters.pageSize ?? 20,
            totalCount: paginationData.TotalCount ?? paginationData.totalCount ?? paginationData.totalItems ?? 0,
            totalPages: paginationData.TotalPages ?? paginationData.totalPages ?? 0,
            hasNext: paginationData.HasNext ?? paginationData.hasNext ?? paginationData.hasNextPage ?? false,
            hasPrevious: paginationData.HasPrevious ?? paginationData.hasPrevious ?? paginationData.hasPreviousPage ?? false,
            // Campos legacy para compatibilidad
            totalItems: paginationData.TotalItems ?? paginationData.totalItems,
            hasNextPage: paginationData.HasNextPage ?? paginationData.hasNextPage,
            hasPreviousPage: paginationData.HasPreviousPage ?? paginationData.hasPreviousPage,
          } : {
            currentPage: 1,
            pageSize: filters.pageSize || 20,
            totalCount: 0,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false,
          },
          stats: statsData ? {
            pendingDisputes: statsData.PendingDisputes ?? statsData.pendingDisputes ?? 0,
            resolvedDisputes: statsData.ResolvedDisputes ?? statsData.resolvedDisputes ?? 0,
            clientDisputes: statsData.ClientDisputes ?? statsData.clientDisputes ?? 0,
            expertDisputes: statsData.ExpertDisputes ?? statsData.expertDisputes ?? 0,
            thisWeekDisputes: statsData.ThisWeekDisputes ?? statsData.thisWeekDisputes ?? 0,
            thisMonthDisputes: statsData.ThisMonthDisputes ?? statsData.thisMonthDisputes ?? 0,
          } : {
            pendingDisputes: 0,
            resolvedDisputes: 0,
            clientDisputes: 0,
            expertDisputes: 0,
            thisWeekDisputes: 0,
            thisMonthDisputes: 0,
          }
        };
        
        console.log('[useDisputes] Normalized response:', normalized);
        
        return normalized;
      },
      enabled: true,
      retry: 1,
      retryDelay: 1000,
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
