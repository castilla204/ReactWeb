import { useQuery } from '@tanstack/react-query';
import { HomepageWallResponse } from '../types/homepageWall';
import { API_CONFIG } from '../config/api';
import { getAuthToken } from '../lib/auth';

interface HomepageWallParams {
  categoryId: number; // ✅ OBLIGATORIO: ID de la categoría
  latitude?: string | null;
  longitude?: string | null;
  countryCode?: string;
  locationRange?: number;
  nearbyPage?: number;
  nearbyPageSize?: number;
  popularPage?: number;
  popularPageSize?: number;
  _enabled?: boolean; // ✅ Flag interno para controlar si la query debe ejecutarse
}

export const useHomepageWallQuery = (params: HomepageWallParams) => {
  // ✅ Validar que categoryId esté presente
  if (!params.categoryId) {
    throw new Error('categoryId es requerido para homepage-wall');
  }

  // ✅ OPTIMIZADO: Normalizar queryKey para evitar llamadas duplicadas
  // CRÍTICO: Si _enabled es false, usar queryKey estable (sin lat/long) para evitar que React Query
  // vea dos queries diferentes. Solo cuando _enabled es true, usar los valores reales.
  // Esto evita que la query se ejecute dos veces: una sin lat/long y otra con lat/long
  const normalizedLatitude = params._enabled !== false ? (params.latitude || '') : '';
  const normalizedLongitude = params._enabled !== false ? (params.longitude || '') : '';

  return useQuery<HomepageWallResponse>({
    queryKey: ['homepage-wall', 
      params.categoryId, // ✅ categoryId es el primer parámetro (más importante)
      normalizedLatitude, 
      normalizedLongitude, 
      params.countryCode || '', 
      params.locationRange || 50, 
      params.nearbyPage || 1, 
      params.nearbyPageSize || 20, 
      params.popularPage || 1, 
      params.popularPageSize || 20,
    ],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      
      // ✅ categoryId es OBLIGATORIO y debe ser el primer parámetro
      queryParams.append('categoryId', params.categoryId.toString());
      
      if (params.latitude && params.longitude) {
        queryParams.append('latitude', params.latitude);
        queryParams.append('longitude', params.longitude);
      }
      
      if (params.countryCode) {
        queryParams.append('countryCode', params.countryCode);
      }
      
      if (params.locationRange) {
        queryParams.append('locationRange', params.locationRange.toString());
      }
      
      if (params.nearbyPage) {
        queryParams.append('nearbyPage', params.nearbyPage.toString());
      }
      
      if (params.nearbyPageSize) {
        queryParams.append('nearbyPageSize', params.nearbyPageSize.toString());
      }
      
      if (params.popularPage) {
        queryParams.append('popularPage', params.popularPage.toString());
      }
      
      if (params.popularPageSize) {
        queryParams.append('popularPageSize', params.popularPageSize.toString());
      }

      const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.expert.services.homepageWall}?${queryParams.toString()}`;
      
      console.log('🔍 HomepageWall - baseUrl:', API_CONFIG.baseUrl);
      console.log('🔍 HomepageWall - endpoint:', API_CONFIG.endpoints.expert.services.homepageWall);
      console.log('🔍 HomepageWall - URL completa:', url);
      console.log('🔍 HomepageWall - Parámetros:', params);
      console.log('🔍 HomepageWall - isDev:', import.meta.env.DEV);

      // ✅ Agregar timeout para evitar que las peticiones se queden colgadas
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos
      
      // ✅ Obtener token si el usuario está autenticado (opcional pero recomendado)
      const token = getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // ✅ Añadir token si existe (para que el backend verifique favoritos)
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // ✅ Usar capacitorFetch que automáticamente usa CapacitorHttp en Capacitor (bypass CORS)
      const { capacitorFetch } = await import('../utils/capacitorFetch');
      
      let response: Response;
      try {
        response = await capacitorFetch(url, {
          headers,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('La petición tardó demasiado tiempo (timeout)');
        }
        throw error;
      }

      console.log('🔍 HomepageWall - Response status:', response.status);
      console.log('🔍 HomepageWall - Response ok:', response.ok);

      if (!response.ok) {
        if (response.status === 400) {
          const errorText = await response.text();
          console.error('❌ HomepageWall - Error 400 (Bad Request):', errorText);
          throw new Error('categoryId es requerido');
        }
        if (response.status === 404) {
          throw new Error('Categoría no encontrada');
        }
        const errorText = await response.text();
        console.error('❌ HomepageWall - Error response:', errorText);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // ✅ Leer el texto primero para verificar si es JSON
      const text = await response.text();
      const contentType = response.headers.get('content-type');
      
      // Verificar si la respuesta parece ser HTML (empieza con <!doctype o <html)
      if (text.trim().toLowerCase().startsWith('<!doctype') || text.trim().toLowerCase().startsWith('<html')) {
        console.error('❌ HomepageWall - Respuesta no es JSON. Content-Type:', contentType);
        console.error('❌ HomepageWall - Respuesta recibida (primeros 500 chars):', text.substring(0, 500));
        throw new Error('El servidor devolvió HTML en lugar de JSON. Verifica la URL del endpoint.');
      }
      
      // Intentar parsear como JSON
      let sections: HomepageWallResponse;
      try {
        sections = JSON.parse(text);
      } catch (parseError) {
        console.error('❌ HomepageWall - Error al parsear JSON. Content-Type:', contentType);
        console.error('❌ HomepageWall - Respuesta recibida (primeros 500 chars):', text.substring(0, 500));
        throw new Error(`Error al parsear la respuesta como JSON: ${parseError instanceof Error ? parseError.message : 'Error desconocido'}`);
      }
      
      console.log('✅ HomepageWall - Secciones recibidas:', sections.length);
      sections.forEach((section, index) => {
        console.log(`  Sección ${index + 1}: "${section.title}" - ${section.services.length} servicios`);
      });
      
      return sections;
    },
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    // ✅ CRÍTICO: Solo ejecutar si categoryId está presente Y si _enabled es true (geolocalización lista)
    enabled: !!params.categoryId && (params._enabled !== false), // Por defecto true si no se especifica
    // ✅ Forzar refetch cuando cambia categoryId (no usar cache)
    refetchOnReconnect: false,
  });
};
