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
      
      console.log('🔍 HomepageWall - Llamando a:', url);
      console.log('🔍 HomepageWall - Parámetros:', params);

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

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

      // ✅ La respuesta es un array directamente
      const sections: HomepageWallResponse = await response.json();
      
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
