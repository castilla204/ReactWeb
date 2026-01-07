import { useState, useEffect } from 'react';
import { useApi } from './useApi';

// ✅ NUEVO: Interfaz para servicios del sidebar
export interface MapSidebarService {
  id: number;
  price: number;
  serviceTypeName: string;
  serviceDescription: string;
  expertName: string;
  expertProfilePictureUrl: string;
  averageRating: number;
  totalReviews: number;
  imageUrls: string[]; // ✅ Mínimo 3 imágenes
  latitude: string;
  longitude: string;
  distance?: number;
  currentAvailability?: {
    id: number;
    daysOfWeek: string[];
    startTime: string;
    endTime: string;
    effectiveFrom?: string;
  };
}

export interface MapSidebarResponse {
  services: MapSidebarService[];
  totalCount: number;
}

export const useMapSidebar = (serviceIds: number[]) => {
  const [services, setServices] = useState<MapSidebarService[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { get } = useApi();

  useEffect(() => {
    // Si no hay IDs, limpiar y salir
    if (!serviceIds || serviceIds.length === 0) {
      setServices([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    // ✅ Limitar a 30 servicios máximo (recomendado)
    const limitedIds = serviceIds.slice(0, 30);

    const fetchSidebarServices = async () => {
      setLoading(true);
      setError(null);

      try {
        const urlParams = new URLSearchParams({
          serviceIds: limitedIds.join(',')
        });

        const url = `/api/SearchService/map-sidebar?${urlParams.toString()}`;
        console.log('🌐 Fetching map sidebar:', url, 'Service IDs:', limitedIds);

        // ✅ No requiere autenticación
        const response = await get<MapSidebarResponse>(url, { requiresAuth: false });
        console.log('📍 Map sidebar response:', response);

        // Mapear respuesta (puede venir en PascalCase o camelCase)
        const servicesData = response.services || response.Services || [];
        const count = response.totalCount || response.TotalCount || 0;

        // Mapear a formato consistente
        const mappedServices: MapSidebarService[] = servicesData.map((service: any) => ({
          id: service.id || service.Id,
          price: service.price || service.Price || 0,
          serviceTypeName: service.serviceTypeName || service.ServiceTypeName || '',
          serviceDescription: service.serviceDescription || service.ServiceDescription || '',
          expertName: service.expertName || service.ExpertName || '',
          expertProfilePictureUrl: service.expertProfilePictureUrl || service.ExpertProfilePictureUrl || '',
          averageRating: service.averageRating || service.AverageRating || 0,
          totalReviews: service.totalReviews || service.TotalReviews || 0,
          imageUrls: Array.isArray(service.imageUrls) 
            ? service.imageUrls 
            : (Array.isArray(service.ImageUrls) ? service.ImageUrls : []),
          latitude: service.latitude || service.Latitude || '',
          longitude: service.longitude || service.Longitude || '',
          distance: service.distance || service.Distance,
          currentAvailability: service.currentAvailability || service.CurrentAvailability ? {
            id: (service.currentAvailability || service.CurrentAvailability).id || (service.currentAvailability || service.CurrentAvailability).Id,
            daysOfWeek: (service.currentAvailability || service.CurrentAvailability).daysOfWeek || (service.currentAvailability || service.CurrentAvailability).DaysOfWeek || [],
            startTime: (service.currentAvailability || service.CurrentAvailability).startTime || (service.currentAvailability || service.CurrentAvailability).StartTime || '',
            endTime: (service.currentAvailability || service.CurrentAvailability).endTime || (service.currentAvailability || service.CurrentAvailability).EndTime || '',
            effectiveFrom: (service.currentAvailability || service.CurrentAvailability).effectiveFrom || (service.currentAvailability || service.CurrentAvailability).EffectiveFrom,
          } : undefined,
        }));

        console.log('📍 Map sidebar services mapeados:', mappedServices.length);
        setServices(mappedServices);
        setTotalCount(count);
      } catch (err) {
        console.error('❌ Error fetching map sidebar:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar servicios del sidebar');
        setServices([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchSidebarServices();
  }, [serviceIds.join(','), get]); // Usar join para comparar arrays

  return {
    services,
    totalCount,
    loading,
    error
  };
};






