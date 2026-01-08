import { useQuery } from '@tanstack/react-query';
import { HomepageWallResponse } from '../types/homepageWall';
import { API_CONFIG } from '../config/api';

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
}

export const useHomepageWallQuery = (params: HomepageWallParams) => {
  // ✅ Validar que categoryId esté presente
  if (!params.categoryId) {
    throw new Error('categoryId es requerido para homepage-wall');
  }

  return useQuery<HomepageWallResponse>({
    queryKey: ['homepage-wall', 
      params.categoryId, // ✅ categoryId es el primer parámetro (más importante)
      params.latitude, 
      params.longitude, 
      params.countryCode, 
      params.locationRange, 
      params.nearbyPage, 
      params.nearbyPageSize, 
      params.popularPage, 
      params.popularPageSize,
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
      
      let response: Response;
      try {
        response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          // Marcar como petición pública para que el interceptor no agregue token
          _skipAuth: true,
        } as any);
        
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
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    refetchOnWindowFocus: false,
    enabled: !!params.categoryId, // ✅ Solo ejecutar si categoryId está presente
  });
};
