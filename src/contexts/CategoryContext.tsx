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

// ✅ Cache global para evitar múltiples llamadas simultáneas (similar a useServiceTypes)
let globalCategoriesCache: { data: CategoryWithDetailsDto[] | null; timestamp: number; promise: Promise<CategoryWithDetailsDto[]> | null } = {
    data: null,
    timestamp: 0,
    promise: null
};
const CATEGORIES_CACHE_DURATION = 60000; // 60 segundos

export function CategoryProvider({ children }: { children: ReactNode }) {
    const [categories, setCategories] = useState<CategoryWithDetailsDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCategories = async () => {
        // ✅ Verificar cache global primero
        const now = Date.now();
        if (globalCategoriesCache.data && (now - globalCategoriesCache.timestamp) < CATEGORIES_CACHE_DURATION) {
            console.log('✅ CategoryProvider: Using global cache');
            setCategories(globalCategoriesCache.data);
            setLoading(false);
            return;
        }
        
        // ✅ Si hay una llamada en progreso, esperar a que termine
        if (globalCategoriesCache.promise) {
            console.log('⏳ CategoryProvider: Waiting for existing request...');
            try {
                const result = await globalCategoriesCache.promise;
                setCategories(result);
                setLoading(false);
                return;
            } catch (err) {
                // Si falla, continuar con nueva llamada
                console.warn('Previous request failed, making new request');
            }
        }

        try {
            setLoading(true);
            const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.categories.list}`;
            
            // ✅ CRÍTICO: Endpoint público - NO enviar token de autenticación
            // ✅ CRÍTICO: Agregar timeout de 15 segundos para evitar que se quede colgado
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos
            
            // ✅ Crear promise y guardarlo en cache para evitar llamadas duplicadas
            const fetchPromise = fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    // ✅ NO incluir Authorization header para endpoints públicos
                },
                signal: controller.signal,
            }).then(async res => {
                clearTimeout(timeoutId);
                if (!res.ok) {
                    // Verificar si la respuesta es HTML en lugar de JSON
                    const contentType = res.headers.get('content-type');
                    if (contentType && !contentType.includes('application/json')) {
                        throw new Error('Server returned HTML instead of JSON. Check backend configuration.');
                    }
                    throw new Error(`Failed to fetch categories: ${res.status} ${res.statusText}`);
                }
                return res.json();
            });
            
            globalCategoriesCache.promise = fetchPromise;
            
            try {
                const data: CategoryWithDetailsDto[] = await fetchPromise;
                
                // ✅ Limpiar promise después de completar
                globalCategoriesCache.promise = null;
                
                // ✅ Guardar en cache global
                globalCategoriesCache.data = data;
                globalCategoriesCache.timestamp = Date.now();
                
                setCategories(data);
                setError(null);
            } catch (fetchError: any) {
                // ✅ Limpiar promise en caso de error
                globalCategoriesCache.promise = null;
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
            // ✅ Invalidar cache cuando se crea una categoría
            globalCategoriesCache.data = null;
            globalCategoriesCache.timestamp = 0;
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