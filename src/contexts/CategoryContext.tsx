import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';
import { API_CONFIG } from '../config/api';
import { CategoryWithDetailsDto } from '../types/category';

interface CategoryContextType {
    categories: CategoryWithDetailsDto[];
    loading: boolean;
    error: string | null;
}

const CategoryContext = createContext<CategoryContextType>({
    categories: [],
    loading: true,
    error: null
});

export function CategoryProvider({ children }: { children: ReactNode }) {
    const [categories, setCategories] = useState<CategoryWithDetailsDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.categories.list}`;
            
            // ✅ Usar authService para obtener el token (más confiable)
            const token = authService.getAccessToken();
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
                console.log('✅ CategoryContext - Token agregado al header');
            } else {
                console.warn('⚠️ CategoryContext - No hay token disponible');
            }
            
            const response = await fetch(url, {
                headers,
            });

            if (!response.ok) {
                throw new Error('Failed to fetch categories');
            }

            const data = await response.json();
            // Transform data from API format (PascalCase) to component format (camelCase)
            const transformedData = Array.isArray(data) ? data.map((item: any) => ({
                id: item.Id || item.id,
                name: item.Name || item.name,
                parentId: item.ParentId !== undefined ? (item.ParentId || item.parentId) : null,
                isActive: item.IsActive !== undefined ? (item.IsActive || item.isActive) : true,
                createdAt: item.CreatedAt || item.createdAt,
                updatedAt: item.UpdatedAt || item.updatedAt,
                isParent: item.IsParent !== undefined ? (item.IsParent || item.isParent) : false,
                hasSubcategories: item.HasSubcategories !== undefined ? (item.HasSubcategories || item.hasSubcategories) : false,
                subcategoriesCount: item.SubcategoriesCount !== undefined ? (item.SubcategoriesCount || item.subcategoriesCount) : 0,
            })) : [];
            setCategories(transformedData);
            setError(null);
        } catch (err) {
            console.error('Error fetching categories:', err);
            setError(err instanceof Error ? err.message : 'Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
        
        // Escuchar eventos de creación de categoría
        const handleCategoryCreated = () => {
            fetchCategories();
        };
        
        window.addEventListener('categoryCreated', handleCategoryCreated);
        
        return () => {
            window.removeEventListener('categoryCreated', handleCategoryCreated);
        };
    }, []);

    return (
        <CategoryContext.Provider value={{ categories, loading, error }}>
            {children}
        </CategoryContext.Provider>
    );
}

export function useCategories() {
    const context = useContext(CategoryContext);
    if (!context) {
        throw new Error('useCategories must be used within a CategoryProvider');
    }
    return context;
}

export { CategoryContext };