import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';
import { API_CONFIG } from '../config/api';

interface Category {
    id: number;
    name: string;
    parentId: number | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export const useCategories = () => {
    const { fetchApi } = useApi();

    const categoriesQuery = useQuery({
        queryKey: ['categories'],
        queryFn: () => fetchApi<Category[]>(API_CONFIG.endpoints.categories.list),
    });

    return {
        categories: categoriesQuery.data ?? [],
        isLoading: categoriesQuery.isLoading,
        error: categoriesQuery.error,
    };
};