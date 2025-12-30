import { useState, useEffect, useRef } from 'react';
import { useApi } from './useApi';

export interface MapExpert {
  id: number;
  name: string;
  profilePictureUrl?: string;
  averageRating: number;
  totalReviews: number;
  completedSearches: number;
  registeredSince: string;
  latitude: string;
  longitude: string;
  price: number;
  serviceDescription?: string;
  serviceTypeName?: string;
  serviceTypeDescription?: string;
  currentAvailability?: {
    id: number;
    daysOfWeek: string[];
    startTime: string;
    endTime: string;
    effectiveFrom?: string;
  };
}

export interface MapExpertsResponse {
  Experts?: MapExpert[]; // API devuelve en PascalCase
  experts?: MapExpert[]; // Por si acaso también viene en camelCase
  TotalCount?: number;
  totalCount?: number;
}

// Interfaz para la respuesta raw de la API (PascalCase)
interface ApiExpert {
  Id: number;
  Name: string;
  ProfilePictureUrl?: string;
  AverageRating: number;
  TotalReviews: number;
  CompletedSearches: number;
  RegisteredSince: string;
  Latitude: string;
  Longitude: string;
  Price: number;
  ServiceDescription?: string;
  ServiceTypeName?: string;
  ServiceTypeDescription?: string;
  CurrentAvailability?: {
    Id: number;
    DaysOfWeek: string[];
    StartTime: string;
    EndTime: string;
    EffectiveFrom?: string;
  };
}

// Parámetros para carga inicial (Caso 1)
interface InitialLoadParams {
  categoryId: number;
  serviceTypeId: number;
}

// Parámetros para búsqueda por bounds (Caso 2)
interface BoundsParams {
  categoryId: number;
  serviceTypeId: number;
  northeastLat: number;
  northeastLng: number;
  southwestLat: number;
  southwestLng: number;
  zoom?: number;
  limit?: number;
}

// Parámetros para búsqueda por ubicación (Caso 3)
interface LocationParams {
  categoryId: number;
  serviceTypeId: number;
  latitude: string;
  longitude: string;
  locationRange: number;
}

type MapExpertsParams = InitialLoadParams | BoundsParams | LocationParams;

// Importar Service desde useServices
import { Service } from './useServices';

export const useMapExperts = (
  categoryId: number | null,
  serviceTypeId: number | null,
  params?: {
    bounds?: {
      northeast: { lat: number; lng: number };
      southwest: { lat: number; lng: number };
    };
    zoom?: number;
    limit?: number;
    location?: {
      latitude: string;
      longitude: string;
      locationRange: number;
    };
  }
) => {
  const [experts, setExperts] = useState<MapExpert[]>([]);
  const [services, setServices] = useState<Service[]>([]); // ✅ NUEVO: Servicios completos cuando hay bounds
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { get } = useApi();

  // Usar useRef para evitar re-renders y llamadas múltiples
  const currentParams = useRef<string>('');

  useEffect(() => {
    if (!categoryId || !serviceTypeId) {
      setExperts([]);
      setTotalCount(0);
      return;
    }

    const fetchExperts = async () => {
      setLoading(true);
      setError(null);

      try {
        const urlParams = new URLSearchParams({
          categoryId: categoryId.toString(),
          serviceTypeId: serviceTypeId.toString(),
        });

        // Caso 2: Búsqueda por bounds
        if (params?.bounds) {
          urlParams.append('northeastLat', params.bounds.northeast.lat.toString());
          urlParams.append('northeastLng', params.bounds.northeast.lng.toString());
          urlParams.append('southwestLat', params.bounds.southwest.lat.toString());
          urlParams.append('southwestLng', params.bounds.southwest.lng.toString());
          if (params.zoom) {
            urlParams.append('zoom', params.zoom.toString());
          }
          if (params.limit) {
            urlParams.append('limit', params.limit.toString());
          }
        }
        // Caso 3: Búsqueda por ubicación
        else if (params?.location) {
          urlParams.append('latitude', params.location.latitude);
          urlParams.append('longitude', params.location.longitude);
          urlParams.append('locationRange', params.location.locationRange.toString());
        }
        // Caso 1: Carga inicial (solo categoryId y serviceTypeId)

        const paramsKey = urlParams.toString();
        if (currentParams.current === paramsKey) {
          setLoading(false);
          return;
        }

        currentParams.current = paramsKey;

        const url = `/api/SearchService/map-experts?${urlParams.toString()}`;
        console.log('🌐 Fetching map experts:', url);

        // ✅ No requiere autenticación para ver expertos en el mapa
        const response = await get<any>(url, { requiresAuth: false });
        console.log('📍 Map experts response RAW:', response);

        // Detectar tipo de respuesta
        let mappedExperts: MapExpert[] = [];
        let mappedServices: Service[] = [];
        let total = 0;

        if (Array.isArray(response)) {
          // Caso 2 o 3: SearchServiceDetailDto[] - Convertir a Service[] Y MapExpert[]
          // ✅ Guardar servicios completos primero
          mappedServices = response.map((service: any) => {
            const expert = service.expert || service.Expert || {};
            // ✅ Manejar tanto PascalCase como camelCase
            const imageUrls = service.imageUrls || service.ImageUrls || [];
            const selectedDeliverableTypes = service.selectedDeliverableTypes || service.SelectedDeliverableTypes || [];
            
            return {
              id: service.id || service.Id,
              expertProfileId: expert.id || expert.Id,
              categoryId: service.categoryId || service.CategoryId,
              serviceTypeId: service.serviceTypeId || service.ServiceTypeId,
              serviceTypeName: service.serviceTypeName || service.ServiceTypeName,
              serviceTypeDescription: service.serviceTypeDescription || service.ServiceTypeDescription,
              price: service.price || service.Price,
              conditions: service.conditions || service.Conditions || '',
              durationInHours: service.durationInHours || service.DurationInHours,
              createdAt: service.createdAt || service.CreatedAt || '',
              imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
              categoryName: service.categoryName || service.CategoryName,
              completedSearches: service.completedSearches || service.CompletedSearches,
              averageRating: service.averageRating || service.AverageRating,
              selectedDeliverableTypes: Array.isArray(selectedDeliverableTypes) ? selectedDeliverableTypes : [],
              expert: {
                id: expert.id || expert.Id,
                profilePictureUrl: expert.profilePictureUrl || expert.ProfilePictureUrl || expert.user?.profilePictureUrl || expert.User?.profilePictureUrl || '',
                description: expert.description || expert.Description || '',
                createdAt: expert.createdAt || expert.CreatedAt || '',
                user: {
                  name: expert.user?.name || expert.User?.name || expert.User?.Name || expert.name || expert.Name || 'Experto',
                  email: expert.user?.email || expert.User?.email || expert.User?.Email || '',
                  profilePictureUrl: expert.user?.profilePictureUrl || expert.User?.profilePictureUrl,
                },
                currentAvailability: (expert.currentAvailability || expert.CurrentAvailability) ? {
                  id: (expert.currentAvailability || expert.CurrentAvailability).id || (expert.currentAvailability || expert.CurrentAvailability).Id,
                  daysOfWeek: (expert.currentAvailability || expert.CurrentAvailability).daysOfWeek || (expert.currentAvailability || expert.CurrentAvailability).DaysOfWeek || [],
                  startTime: (expert.currentAvailability || expert.CurrentAvailability).startTime || (expert.currentAvailability || expert.CurrentAvailability).StartTime,
                  endTime: (expert.currentAvailability || expert.CurrentAvailability).endTime || (expert.currentAvailability || expert.CurrentAvailability).EndTime,
                  effectiveFrom: (expert.currentAvailability || expert.CurrentAvailability).effectiveFrom || (expert.currentAvailability || expert.CurrentAvailability).EffectiveFrom,
                } : undefined,
                reviews: expert.reviews || expert.Reviews || [],
                latitude: (expert.latitude || expert.Latitude || service.expertLatitude || service.ExpertLatitude)?.toString() || '',
                longitude: (expert.longitude || expert.Longitude || service.expertLongitude || service.ExpertLongitude)?.toString() || '',
              },
            } as Service;
          });
          
          // También crear MapExpert[] para los marcadores
          mappedExperts = mappedServices.map((service) => {
            const expert = service.expert || {};
            return {
              id: expert.id || service.id,
              name: expert.user?.name || 'Experto',
              profilePictureUrl: expert.profilePictureUrl,
              averageRating: service.averageRating || 0,
              totalReviews: expert.reviews?.length || 0,
              completedSearches: service.completedSearches || 0,
              registeredSince: expert.createdAt || '',
              latitude: expert.latitude?.toString() || '',
              longitude: expert.longitude?.toString() || '',
              price: service.price || 0,
              serviceDescription: service.serviceTypeDescription,
              serviceTypeName: service.serviceTypeName,
              serviceTypeDescription: service.serviceTypeDescription,
              currentAvailability: expert.currentAvailability,
            };
          });
          total = mappedExperts.length;
          setServices(mappedServices);
        } else if (response?.Experts || response?.experts) {
          // Caso 1: ExpertMapResponseDto
          const apiExperts = response.Experts || response.experts || [];
          total = response.TotalCount ?? response.totalCount ?? 0;

          // Mapear de PascalCase a camelCase
          mappedExperts = apiExperts.map((expert: ApiExpert | MapExpert) => {
            // Si ya está en camelCase, devolverlo tal cual
            if ('id' in expert && 'latitude' in expert) {
              return expert as MapExpert;
            }

            // Si está en PascalCase, mapearlo
            const apiExpert = expert as ApiExpert;
            return {
              id: apiExpert.Id,
              name: apiExpert.Name,
              profilePictureUrl: apiExpert.ProfilePictureUrl,
              averageRating: apiExpert.AverageRating,
              totalReviews: apiExpert.TotalReviews,
              completedSearches: apiExpert.CompletedSearches,
              registeredSince: apiExpert.RegisteredSince,
              latitude: apiExpert.Latitude,
              longitude: apiExpert.Longitude,
              price: apiExpert.Price,
              serviceDescription: apiExpert.ServiceDescription,
              serviceTypeName: apiExpert.ServiceTypeName,
              serviceTypeDescription: apiExpert.ServiceTypeDescription,
              currentAvailability: apiExpert.CurrentAvailability ? {
                id: apiExpert.CurrentAvailability.Id,
                daysOfWeek: apiExpert.CurrentAvailability.DaysOfWeek,
                startTime: apiExpert.CurrentAvailability.StartTime,
                endTime: apiExpert.CurrentAvailability.EndTime,
                effectiveFrom: apiExpert.CurrentAvailability.EffectiveFrom,
              } : undefined,
            };
          });
        }

        console.log('📍 Map experts mapeados:', mappedExperts);
        if (Array.isArray(response)) {
          console.log('📍 Servicios completos mapeados:', mappedServices);
        }

        setExperts(mappedExperts);
        setTotalCount(total);
      } catch (err) {
        console.error('❌ Error fetching map experts:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar expertos');
        setExperts([]);
        setServices([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchExperts();
  }, [categoryId, serviceTypeId, params?.bounds, params?.zoom, params?.limit, params?.location, get]);

  return {
    experts,
    services, // ✅ NUEVO: Servicios completos cuando hay bounds o location
    totalCount,
    loading,
    error
  };
};
