import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';

interface ExpertResponseDto {
  response: string;
  files?: File[];
}

export const useExpertResponse = () => {
  const { fetchApi } = useApi();
  const queryClient = useQueryClient();

  const expertResponseMutation = useMutation({
    mutationFn: async ({ 
      disputeId, 
      data 
    }: { 
      disputeId: number; 
      data: ExpertResponseDto 
    }) => {
      console.log('[useExpertResponse] Sending expert response:', { disputeId, data });
      
      // Si hay archivos, usar FormData
      if (data.files && data.files.length > 0) {
        const formData = new FormData();
        formData.append('response', data.response);
        
        // Agregar archivos
        data.files.forEach((file, index) => {
          formData.append(`files`, file);
        });

        return fetchApi(API_CONFIG.endpoints.dispute.expertResponse(disputeId), {
          method: 'POST',
          body: formData,
        });
      } else {
        // Solo texto, usar JSON
        return fetchApi(API_CONFIG.endpoints.dispute.expertResponse(disputeId), {
          method: 'POST',
          body: JSON.stringify({ response: data.response }),
        });
      }
    },
    onSuccess: () => {
      console.log('[useExpertResponse] Expert response sent successfully');
      // Invalidar queries relacionadas con disputas
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      queryClient.invalidateQueries({ queryKey: ['searchDetails'] });
    },
    onError: (error) => {
      console.error('[useExpertResponse] Error sending expert response:', error);
    },
  });

  const sendExpertResponse = async (disputeId: number, response: string, files: File[] = []) => {
    try {
      return await expertResponseMutation.mutateAsync({
        disputeId,
        data: { response, files }
      });
    } catch (error) {
      throw error;
    }
  };

  return {
    sendExpertResponse,
    isSubmitting: expertResponseMutation.isPending,
    error: expertResponseMutation.error,
  };
};
