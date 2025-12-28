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
                
                const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.serviceTypes.list}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const result: ServiceTypesResponse = await response.json();
                
                if (result.success) {
                    // Transform data from API format (PascalCase) to component format (camelCase)
                    const transformedData = result.data.map((item: any) => ({
                        id: item.Id || item.id,
                        name: item.Name || item.name,
                        description: item.Description || item.description,
                        serviceTypeCategoryId: item.ServiceTypeCategoryId || item.serviceTypeCategoryId,
                        serviceTypeCategoryName: item.ServiceTypeCategoryName || item.serviceTypeCategoryName,
                        position: item.Position || item.position,
                    }));
                    
                    // Sort by position first, then by id as fallback
                    const sortedData = transformedData.sort((a, b) => {
                        if (a.position !== b.position) {
                            return a.position - b.position;
                        }
                        return a.id - b.id;
                    });
                    setServiceTypes(sortedData);
                } else {
                    throw new Error(result.message || 'Failed to fetch service types');
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