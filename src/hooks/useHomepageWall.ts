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
    queryKey: ['homepage-wall', 
      params.latitude, 
      params.longitude, 
      params.countryCode, 
      params.locationRange, 
      params.nearbyPage, 
      params.nearbyPageSize, 
      params.popularPage, 
      params.popularPageSize
    ],
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
      
      // Mapear los datos de PascalCase a camelCase si es necesario
      const mapService = (service: any): any => {
        if (!service) return service;
        
        return {
          id: service.id || service.Id,
          categoryId: service.categoryId || service.CategoryId,
          serviceTypeId: service.serviceTypeId || service.ServiceTypeId,
          serviceTypeName: service.serviceTypeName || service.ServiceTypeName || service.CategoryName || '',
          serviceTypeDescription: service.serviceTypeDescription || service.ServiceTypeDescription,
          serviceTypeCategoryId: service.serviceTypeCategoryId || service.ServiceTypeCategoryId,
          requiresAppointment: service.requiresAppointment ?? service.RequiresAppointment ?? false,
          price: service.price ?? service.Price ?? 0,
          conditions: service.conditions || service.Conditions || '',
          durationInHours: service.durationInHours ?? service.DurationInHours ?? 0,
          createdAt: service.createdAt || service.CreatedAt || '',
          isActive: service.isActive ?? service.IsActive ?? true,
          imageUrls: (() => {
            if (Array.isArray(service.imageUrls)) return service.imageUrls;
            if (Array.isArray(service.ImageUrls)) return service.ImageUrls;
            if (service.imageUrl) return [service.imageUrl];
            if (service.ImageUrl) return [service.ImageUrl];
            return [];
          })(),
          categoryName: service.categoryName || service.CategoryName || '',
          completedSearches: service.completedSearches ?? service.CompletedSearches ?? 0,
          averageRating: service.averageRating ?? service.AverageRating ?? 0,
          expert: service.expert || service.Expert ? {
            id: service.expert?.id || service.Expert?.Id,
            profilePictureUrl: service.expert?.profilePictureUrl || service.Expert?.ProfilePictureUrl || '',
            description: service.expert?.description || service.Expert?.Description || '',
            latitude: service.expert?.latitude || service.Expert?.Latitude || '',
            longitude: service.expert?.longitude || service.Expert?.Longitude || '',
            user: {
              id: service.expert?.user?.id || service.Expert?.User?.Id,
              name: service.expert?.user?.name || service.Expert?.User?.Name || '',
              email: service.expert?.user?.email || service.Expert?.User?.Email || '',
            },
            reviews: service.expert?.reviews || service.Expert?.Reviews || [],
            currentAvailability: service.expert?.currentAvailability || service.Expert?.CurrentAvailability,
            timezone: service.expert?.timezone || service.Expert?.Timezone,
            country: service.expert?.country || service.Expert?.Country,
          } : undefined,
          selectedDeliverableTypes: service.selectedDeliverableTypes || service.SelectedDeliverableTypes || [],
        };
      };

      // Mapear los servicios
      const mappedData = {
        nearbyServices: {
          ...data.nearbyServices,
          services: (data.nearbyServices?.services || []).map(mapService),
        },
        popularServices: {
          ...data.popularServices,
          services: (data.popularServices?.services || []).map(mapService),
        },
      };

      console.log('✅ HomepageWall - Datos mapeados:', mappedData);
      return mappedData;
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    refetchOnWindowFocus: false,
  });
};

