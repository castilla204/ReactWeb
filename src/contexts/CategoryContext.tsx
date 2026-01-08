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
            
            // ✅ CRÍTICO: Endpoint público - NO enviar token de autenticación
            // ✅ CRÍTICO: Agregar timeout de 15 segundos para evitar que se quede colgado
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos
            
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        // ✅ NO incluir Authorization header para endpoints públicos
                    },
                    signal: controller.signal,
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    // Verificar si la respuesta es HTML en lugar de JSON
                    const contentType = response.headers.get('content-type');
                    if (contentType && !contentType.includes('application/json')) {
                        throw new Error('Server returned HTML instead of JSON. Check backend configuration.');
                    }
                    throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                setCategories(data);
                setError(null);
            } catch (fetchError: any) {
                clearTimeout(timeoutId);
                if (fetchError.name === 'AbortError') {
                    throw new Error('Request timeout: The server took too long to respond. Please try again.');
                }
                throw fetchError;
            }
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