import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';
import type { SearchResult } from './useSearch.hooks';

export const useFavorites = () => {
    const { fetchApi } = useApi();
    const queryClient = useQueryClient();

    const favoritesQuery = useQuery({
        queryKey: ['favorites'],
        queryFn: () => fetchApi<SearchResult[]>('/api/Likes/user'),
    });

    const removeFavoriteMutation = useMutation({
        mutationFn: (adId: string) =>
            fetchApi(API_CONFIG.endpoints.likes.toggle(adId), {
                method: 'POST',
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
            queryClient.invalidateQueries({ queryKey: ['likes'] });
        },
    });

    return {
        favorites: favoritesQuery.data || [],
        isLoading: favoritesQuery.isLoading,
        error: favoritesQuery.error,
        removeFavorite: removeFavoriteMutation.mutate,
        isRemoving: removeFavoriteMutation.isPending,
    };
};