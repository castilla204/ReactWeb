import { useState, useEffect } from 'react';
import { API_CONFIG } from '../config/api';

interface ServiceType {
    id: number;
    name: string;
    description: string;
    serviceTypeCategoryId: number | null;
    serviceTypeCategoryName: string | null;
    position: number;
}

interface ServiceTypesResponse {
    success: boolean;
    data: ServiceType[];
    count: number;
    message: string;
}

/**
 * Hook para obtener los tipos de servicio desde la API
 * Los tipos se ordenan por el campo 'position' y luego por 'id' como fallback
 * Cada tipo incluye automáticamente el nombre de la categoría (no necesita joins manuales)
 * @returns {Object} { serviceTypes, isLoading, error }
 */
export function useServiceTypes() {
    const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchServiceTypes = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.serviceTypes.list}`;
                
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
                        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
                    }
                    
                    const result: ServiceTypesResponse = await response.json();
                    
                    if (result.success) {
                        // Sort by position first, then by id as fallback
                        const sortedData = result.data.sort((a, b) => {
                            if (a.position !== b.position) {
                                return a.position - b.position;
                            }
                            return a.id - b.id;
                        });
                        setServiceTypes(sortedData);
                    } else {
                        throw new Error(result.message || 'Failed to fetch service types');
                    }
                } catch (fetchError: any) {
                    clearTimeout(timeoutId);
                    if (fetchError.name === 'AbortError') {
                        throw new Error('Request timeout: The server took too long to respond. Please try again.');
                    }
                    throw fetchError;
                }
            } catch (err) {
                console.error('Error fetching service types:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
                // Fallback data in case of error
                setServiceTypes([
                    { 
                        id: 1, 
                        name: 'Solo revisión', 
                        description: 'Revisión presencial de un anuncio específico', 
                        serviceTypeCategoryId: 1,
                        serviceTypeCategoryName: 'Revisión',
                        position: 1 
                    },
                    { 
                        id: 2, 
                        name: 'Búsqueda web + revisión', 
                        description: 'Búsqueda automatizada más revisión manual experta', 
                        serviceTypeCategoryId: 2,
                        serviceTypeCategoryName: 'Búsqueda + Revisión',
                        position: 2 
                    }
                ]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchServiceTypes();
    }, []);

    return { serviceTypes, isLoading, error };
}