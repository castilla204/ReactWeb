import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAuthToken } from '../lib/auth';
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
            // ✅ Intentar sin autenticación primero (endpoint puede ser público)
            const response = await fetch(url, {
                // Marcar como petición pública para que el interceptor no agregue token
                _skipAuth: true,
            } as any);

            if (!response.ok) {
                throw new Error('Failed to fetch categories');
            }

            // ✅ Leer el texto primero para verificar si es JSON
            const text = await response.text();
            const contentType = response.headers.get('content-type');
            
            // Verificar si la respuesta parece ser HTML (empieza con <!doctype o <html)
            if (text.trim().toLowerCase().startsWith('<!doctype') || text.trim().toLowerCase().startsWith('<html')) {
                console.error('❌ CategoryContext - Respuesta no es JSON. Content-Type:', contentType);
                console.error('❌ CategoryContext - Respuesta recibida (primeros 500 chars):', text.substring(0, 500));
                throw new Error('El servidor devolvió HTML en lugar de JSON. Verifica la URL del endpoint.');
            }
            
            // Intentar parsear como JSON
            let data: any;
            try {
                data = JSON.parse(text);
            } catch (parseError) {
                console.error('❌ CategoryContext - Error al parsear JSON. Content-Type:', contentType);
                console.error('❌ CategoryContext - Respuesta recibida (primeros 500 chars):', text.substring(0, 500));
                throw new Error(`Error al parsear la respuesta como JSON: ${parseError instanceof Error ? parseError.message : 'Error desconocido'}`);
            }
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