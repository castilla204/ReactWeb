import { useQuery } from '@tanstack/react-query';
import { HomepageWallResponse } from '../types/homepageWall';
import { API_CONFIG } from '../config/api';

interface HomepageWallParams {
  latitude?: string | null;
  longitude?: string | null;
  countryCode?: string;
  locationRange?: number;
  nearbyPage?: number;
  nearbyPageSize?: number;
  popularPage?: number;
  popularPageSize?: number;
}

export const useHomepageWallQuery = (params: HomepageWallParams = {}) => {
  return useQuery<HomepageWallResponse>({
    queryKey: ['homepage-wall', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      
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
        const errorText = await response.text();
        console.error('❌ HomepageWall - Error response:', errorText);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ HomepageWall - Data recibida:', data);
      console.log('✅ HomepageWall - Nearby services:', data.nearbyServices?.services?.length || 0);
      console.log('✅ HomepageWall - Popular services:', data.popularServices?.services?.length || 0);

      return data;
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    refetchOnWindowFocus: false,
  });
};

