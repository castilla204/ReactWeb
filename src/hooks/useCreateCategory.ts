import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthToken } from '../lib/auth';
import { API_CONFIG } from '../config/api';
import { CreateCategoryDto, CreateCategoryResponse, CategoryDto } from '../types/category';

export interface CreateCategoryError {
    message: string;
    existingCategoryId?: number;
    existingCategoryName?: string;
}

export function useCreateCategory() {
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = React.useState(false);

    const createCategoryMutation = useMutation({
        mutationFn: async (categoryData: CreateCategoryDto): Promise<CategoryDto> => {
            setIsCreating(true);
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.categories.create}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: categoryData.name.trim(),
                    parentId: categoryData.parentId || null,
                    isActive: categoryData.isActive !== undefined ? categoryData.isActive : true,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                // Crear un error personalizado con información adicional
                const error = new Error(errorData.message || `Failed to create category: ${response.statusText}`) as any;
                // Si es un error 400 con información de categoría duplicada
                if (response.status === 400 && errorData.existingCategoryId && errorData.existingCategoryName) {
                    error.existingCategoryId = errorData.existingCategoryId;
                    error.existingCategoryName = errorData.existingCategoryName;
                    error.isDuplicateCategoryError = true;
                }
                throw error;
            }

            const result: CreateCategoryResponse = await response.json();
            return result.data;
        },
        onSuccess: (newCategory) => {
            // Invalidar y refrescar la lista de categorías
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            // También actualizar el contexto si es necesario
            window.dispatchEvent(new CustomEvent('categoryCreated', { detail: newCategory }));
        },
        onError: (error) => {
            console.error('Error creating category:', error);
        },
        onSettled: () => {
            setIsCreating(false);
        },
    });

    return {
        createCategory: createCategoryMutation.mutateAsync,
        isCreating: isCreating || createCategoryMutation.isPending,
        error: createCategoryMutation.error,
    };
}

