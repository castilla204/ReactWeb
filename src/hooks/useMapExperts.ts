import { useState, useEffect, useRef, useMemo } from 'react';
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

  // ✅ Estabilizar las dependencias del bounds para evitar re-renders innecesarios
  const boundsKey = useMemo(() => {
    if (!params?.bounds) return null;
    return `${params.bounds.northeast.lat},${params.bounds.northeast.lng},${params.bounds.southwest.lat},${params.bounds.southwest.lng},${params.zoom || ''}`;
  }, [params?.bounds?.northeast?.lat, params?.bounds?.northeast?.lng, params?.bounds?.southwest?.lat, params?.bounds?.southwest?.lng, params?.zoom]);

  // ✅ Estabilizar las dependencias de location
  const locationKey = useMemo(() => {
    if (!params?.location) return null;
    return `${params.location.latitude},${params.location.longitude},${params.location.locationRange}`;
  }, [params?.location?.latitude, params?.location?.longitude, params?.location?.locationRange]);

  useEffect(() => {
    console.log('🔄 useMapExperts useEffect ejecutado:', {
      categoryId,
      serviceTypeId,
      hasBounds: !!params?.bounds,
      hasLocation: !!params?.location,
      boundsKey,
      locationKey
    });
    
    if (!categoryId || !serviceTypeId) {
      console.log('⚠️ useMapExperts: categoryId o serviceTypeId faltantes');
      setExperts([]);
      setTotalCount(0);
      setServices([]);
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

        // ✅ NUEVA ESTRUCTURA: La API ahora devuelve { services: [...], pagination: {...} } para Caso 2 y 3
        let servicesArray: any[] = [];
        if (response && typeof response === 'object' && !Array.isArray(response)) {
          // Verificar si es la nueva estructura con services y pagination
          if (response.services && Array.isArray(response.services)) {
            servicesArray = response.services;
            console.log('📍 Map experts - Nueva estructura con paginación:', {
              servicesCount: servicesArray.length,
              pagination: response.pagination
            });
          } else if (response.Experts && Array.isArray(response.Experts)) {
            // Caso 1: ExpertMapResponseDto (carga inicial)
            // Manejar como antes
          } else if (response.experts && Array.isArray(response.experts)) {
            // Caso 1: ExpertMapResponseDto (carga inicial) - camelCase
            // Manejar como antes
          }
        } else if (Array.isArray(response)) {
          // Fallback: Array directo (compatibilidad hacia atrás)
          servicesArray = response;
          console.log('📍 Map experts - Array directo (fallback):', servicesArray.length);
        }

        if (servicesArray.length > 0) {
          // Caso 2 o 3: SearchServiceDetailDto[] - Convertir a Service[] Y MapExpert[]
          // ✅ Guardar servicios completos primero
          mappedServices = servicesArray.map((service: any) => {
            // ✅ IMPORTANTE: La API devuelve Expert en PascalCase, necesitamos mapearlo correctamente
            const rawExpert = service.expert || service.Expert || {};
            // ✅ Manejar tanto PascalCase como camelCase
            const imageUrls = service.imageUrls || service.ImageUrls || [];
            const selectedDeliverableTypes = service.selectedDeliverableTypes || service.SelectedDeliverableTypes || [];
            
            // ✅ Extraer coordenadas directamente desde el objeto raw (puede venir en PascalCase o camelCase)
            // La API devuelve Expert.Latitude y Expert.Longitude en PascalCase
            const expertLatitude = rawExpert.Latitude || rawExpert.latitude || (rawExpert as any)['Latitude'] || '';
            const expertLongitude = rawExpert.Longitude || rawExpert.longitude || (rawExpert as any)['Longitude'] || '';
            
            // ✅ Log para depuración del primer servicio
            if (servicesArray.indexOf(service) === 0) {
              console.log('🔍 Primer servicio raw:', {
                serviceId: service.id || service.Id,
                hasExpert: !!(service.expert || service.Expert),
                expertKeys: rawExpert ? Object.keys(rawExpert) : [],
                expertLatitude: expertLatitude,
                expertLongitude: expertLongitude,
                rawExpertLatitude: rawExpert.Latitude,
                rawExpertLongitude: rawExpert.Longitude,
                rawExpert: rawExpert
              });
            }
            
            // ✅ Validar que tenemos coordenadas
            if (!expertLatitude || !expertLongitude) {
              console.error('❌ ERROR: Servicio sin coordenadas:', {
                serviceId: service.id || service.Id,
                rawExpert: rawExpert,
                expertLatitude,
                expertLongitude
              });
            }
            
            // ✅ Crear objeto expert mapeado con coordenadas
            const expert = {
              ...rawExpert,
              id: rawExpert.id || rawExpert.Id,
              latitude: expertLatitude?.toString() || '',
              longitude: expertLongitude?.toString() || '',
            };
            
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
              totalReviews: service.totalReviews || service.TotalReviews || 0, // ✅ NUEVO: Total de reseñas
              averageRating: service.averageRating || service.AverageRating,
              selectedDeliverableTypes: Array.isArray(selectedDeliverableTypes) ? selectedDeliverableTypes : [],
              expert: {
                id: expert.id || expert.Id,
                // ✅ CORRECTO: Usar ProfilePictureUrl del nivel superior, NO de user (que siempre es null para expertos)
                profilePictureUrl: expert.profilePictureUrl || expert.ProfilePictureUrl || '',
                description: expert.description || expert.Description || '',
                createdAt: expert.createdAt || expert.CreatedAt || '',
                user: {
                  name: expert.user?.name || expert.User?.name || expert.User?.Name || expert.name || expert.Name || 'Experto',
                  email: expert.user?.email || expert.User?.email || expert.User?.Email || '',
                  // ✅ user.profilePictureUrl siempre será null para expertos - no usar como fallback
                  profilePictureUrl: null,
                },
                currentAvailability: (expert.currentAvailability || expert.CurrentAvailability) ? {
                  id: (expert.currentAvailability || expert.CurrentAvailability).id || (expert.currentAvailability || expert.CurrentAvailability).Id,
                  daysOfWeek: (expert.currentAvailability || expert.CurrentAvailability).daysOfWeek || (expert.currentAvailability || expert.CurrentAvailability).DaysOfWeek || [],
                  startTime: (expert.currentAvailability || expert.CurrentAvailability).startTime || (expert.currentAvailability || expert.CurrentAvailability).StartTime,
                  endTime: (expert.currentAvailability || expert.CurrentAvailability).endTime || (expert.currentAvailability || expert.CurrentAvailability).EndTime,
                  effectiveFrom: (expert.currentAvailability || expert.CurrentAvailability).effectiveFrom || (expert.currentAvailability || expert.CurrentAvailability).EffectiveFrom,
                } : undefined,
                reviews: expert.reviews || expert.Reviews || [],
                // ✅ IMPORTANTE: Usar las coordenadas que ya extrajimos arriba (expertLatitude/expertLongitude)
                latitude: expertLatitude?.toString() || '',
                longitude: expertLongitude?.toString() || '',
                // ✅ Asegurar que expertProfileId esté disponible para matching
                expertProfileId: expert.id || expert.Id || service.expertProfileId,
              },
            } as Service;
          });
          
          // También crear MapExpert[] para los marcadores - SIMPLIFICADO
          mappedExperts = mappedServices.map((service) => {
            const expert = service.expert || {};
            const expertId = expert.id || service.expertProfileId || service.id;
            
            // ✅ Las coordenadas ya están mapeadas en service.expert.latitude/longitude
            const latitude = expert.latitude?.toString() || '';
            const longitude = expert.longitude?.toString() || '';
            
            return {
              id: expertId,
              name: expert.user?.name || 'Experto',
              profilePictureUrl: expert.profilePictureUrl || '',
              averageRating: service.averageRating || 0,
              totalReviews: service.totalReviews || service.TotalReviews || 0, // ✅ CORRECTO: Usar totalReviews del servicio, no reviews.length
              completedSearches: service.completedSearches || 0,
              registeredSince: expert.createdAt || '',
              latitude: latitude,
              longitude: longitude,
              price: service.price || 0,
              serviceDescription: service.serviceTypeDescription || '',
              serviceTypeName: service.serviceTypeName || '',
              serviceTypeDescription: service.serviceTypeDescription || '',
              currentAvailability: expert.currentAvailability,
            };
          });
          
          // ✅ Filtrar expertos sin coordenadas válidas
          mappedExperts = mappedExperts.filter(expert => {
            const hasValidCoords = expert.latitude && expert.longitude && 
                                  !isNaN(parseFloat(expert.latitude)) && 
                                  !isNaN(parseFloat(expert.longitude));
            return hasValidCoords;
          });
          
          console.log('📍 MapExperts creados desde servicios:', mappedExperts.length, 'expertos válidos');
          if (mappedExperts.length > 0) {
            console.log('📍 Primer experto ejemplo:', {
              id: mappedExperts[0].id,
              name: mappedExperts[0].name,
              latitude: mappedExperts[0].latitude,
              longitude: mappedExperts[0].longitude,
              price: mappedExperts[0].price,
              hasValidCoords: !!(mappedExperts[0].latitude && mappedExperts[0].longitude)
            });
          } else {
            console.warn('⚠️ No se crearon expertos válidos desde los servicios');
          }
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

        console.log('📍 Map experts mapeados:', mappedExperts.length, 'expertos');
        console.log('📍 Servicios completos mapeados:', mappedServices.length, 'servicios');
        if (servicesArray.length > 0) {
          console.log('📍 Nueva estructura detectada - services array con', servicesArray.length, 'servicios');
        }
        
        // ✅ LOGS DETALLADOS PARA DEBUGGING
        console.log('🔍 DEBUG - mappedExperts:', mappedExperts);
        console.log('🔍 DEBUG - mappedServices:', mappedServices);
        if (mappedExperts.length > 0) {
          console.log('🔍 DEBUG - Primer experto completo:', JSON.stringify(mappedExperts[0], null, 2));
        }
        if (mappedServices.length > 0) {
          console.log('🔍 DEBUG - Primer servicio completo:', JSON.stringify(mappedServices[0], null, 2));
        }

        setExperts(mappedExperts);
        setServices(mappedServices);
        setTotalCount(total);
      } catch (err: any) {
        console.error('❌ Error fetching map experts:', err);
        
        // ✅ Mejorar mensaje de error para incluir detalles del backend
        let errorMessage = 'Error al cargar expertos';
        if (err?.response?.data) {
          const errorData = err.response.data;
          if (errorData.message) {
            errorMessage = errorData.message;
          }
          if (errorData.detail) {
            errorMessage += `: ${errorData.detail}`;
          }
        } else if (err?.message) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
        setExperts([]);
        setServices([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchExperts();
  }, [categoryId, serviceTypeId, boundsKey, locationKey, params?.limit]);

  return {
    experts,
    services, // ✅ NUEVO: Servicios completos cuando hay bounds o location
    totalCount,
    loading,
    error
  };
};
