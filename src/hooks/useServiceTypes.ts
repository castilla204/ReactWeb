import { useState, useEffect } from 'react';
import { API_CONFIG } from '../config/api';

interface ServiceType {
    id: number;
    name: string;
    description: string;
    serviceTypeCategoryId: number | null;
    serviceTypeCategoryName: string | null;
    position: number;
    requiresAppointment: boolean;
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
// ✅ Cache global para evitar múltiples llamadas simultáneas
let globalServiceTypesCache: { data: ServiceType[] | null; timestamp: number; promise: Promise<ServiceTypesResponse> | null } = {
    data: null,
    timestamp: 0,
    promise: null
};
const SERVICE_TYPES_CACHE_DURATION = 60000; // 60 segundos

export function useServiceTypes() {
    const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchServiceTypes = async () => {
            // ✅ Verificar cache global primero
            const now = Date.now();
            if (globalServiceTypesCache.data && (now - globalServiceTypesCache.timestamp) < SERVICE_TYPES_CACHE_DURATION) {
                console.log('✅ useServiceTypes: Using global cache');
                setServiceTypes(globalServiceTypesCache.data);
                setIsLoading(false);
                return;
            }
            
            // ✅ Si hay una llamada en progreso, esperar a que termine
            if (globalServiceTypesCache.promise) {
                console.log('⏳ useServiceTypes: Waiting for existing request...');
                try {
                    const result = await globalServiceTypesCache.promise;
                    if (result.success) {
                        const sortedData = result.data.sort((a, b) => {
                            if (a.position !== b.position) {
                                return a.position - b.position;
                            }
                            return a.id - b.id;
                        });
                        setServiceTypes(sortedData);
                        setIsLoading(false);
                        return;
                    }
                } catch (err) {
                    // Si falla, continuar con nueva llamada
                    console.warn('Previous request failed, making new request');
                }
            }
            try {
                setIsLoading(true);
                setError(null);

                const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.serviceTypes.list}`;

                // ✅ CRÍTICO: registrar el promise en vuelo de forma SÍNCRONA, antes de
                // cualquier `await`. Antes el `await import(capacitorFetch)` ocurría ANTES
                // de asignar globalServiceTypesCache.promise, dejando una ventana donde el
                // doble montaje de StrictMode (o dos consumidores concurrentes) colaba un
                // 2º fetch a /ServiceType/public. Envolviendo todo en un IIFE y asignando
                // el promise inmediatamente, la 2ª llamada reutiliza la petición en vuelo.
                const fetchPromise: Promise<ServiceTypesResponse> = (async () => {
                    // Endpoint público: NO enviar token. Timeout de 15s para no colgar.
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 15000);
                    try {
                        // capacitorFetch usa CapacitorHttp en nativo (bypass CORS).
                        const { capacitorFetch } = await import('../utils/capacitorFetch');
                        const res = await capacitorFetch(url, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                            },
                            signal: controller.signal,
                        });
                        clearTimeout(timeoutId);
                        if (!res.ok) {
                            const contentType = res.headers.get('content-type');
                            if (contentType && !contentType.includes('application/json')) {
                                throw new Error('Server returned HTML instead of JSON. Check backend configuration.');
                            }
                            throw new Error(`HTTP error! status: ${res.status} ${res.statusText}`);
                        }
                        return res.json();
                    } catch (e: any) {
                        clearTimeout(timeoutId);
                        if (e?.name === 'AbortError') {
                            throw new Error('Request timeout: The server took too long to respond. Please try again.');
                        }
                        throw e;
                    }
                })();

                globalServiceTypesCache.promise = fetchPromise;

                try {
                    const result: ServiceTypesResponse = await fetchPromise;
                    
                    // ✅ Limpiar promise después de completar
                    globalServiceTypesCache.promise = null;
                    
                    if (result.success) {
                        // Sort by position first, then by id as fallback
                        const sortedData = result.data.sort((a, b) => {
                            if (a.position !== b.position) {
                                return a.position - b.position;
                            }
                            return a.id - b.id;
                        });
                        
                        // ✅ Guardar en cache global
                        globalServiceTypesCache.data = sortedData;
                        globalServiceTypesCache.timestamp = Date.now();
                        
                        setServiceTypes(sortedData);
                    } else {
                        throw new Error(result.message || 'Failed to fetch service types');
                    }
                } catch (fetchError: any) {
                    // ✅ Limpiar promise en caso de error (el timeout/abort ya se maneja
                    // dentro del IIFE). Re-lanzar para caer al fallback de abajo.
                    globalServiceTypesCache.promise = null;
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
                        position: 1,
                        requiresAppointment: true
                    },
                    {
                        id: 2,
                        name: 'Búsqueda web + revisión',
                        description: 'Búsqueda automatizada más revisión manual experta',
                        serviceTypeCategoryId: 2,
                        serviceTypeCategoryName: 'Búsqueda + Revisión',
                        position: 2,
                        requiresAppointment: false
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