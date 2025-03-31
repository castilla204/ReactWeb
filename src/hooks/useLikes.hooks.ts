import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';

export const useLikes = (adId: string) => {
    const { fetchApi } = useApi();
    const queryClient = useQueryClient();

    const likeStatusQuery = useQuery({
        queryKey: ['likes', adId],
        queryFn: () => fetchApi<{ liked: boolean }>(API_CONFIG.endpoints.likes.check(adId)),
    });

    const toggleLikeMutation = useMutation({
        mutationFn: () => fetchApi<{ liked: boolean }>(API_CONFIG.endpoints.likes.toggle(adId), {
            method: 'POST',
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['likes', adId] });
        },
    });

    return {
        isLiked: likeStatusQuery.data?.liked ?? false,
        isLoading: likeStatusQuery.isLoading,
        toggleLike: toggleLikeMutation.mutate,
        isToggling: toggleLikeMutation.isPending,
    };
};