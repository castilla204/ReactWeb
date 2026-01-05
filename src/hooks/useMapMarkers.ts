import { useState, useEffect, useRef, useMemo } from 'react';
import { useApi } from './useApi';

// ✅ NUEVO: Interfaz para marcadores ultra ligeros
export interface MapMarker {
  id: number;
  serviceId: number;
  latitude: string;
  longitude: string;
  price: number;
}

export interface MapMarkersResponse {
  markers: MapMarker[];
  totalCount: number;
}

export const useMapMarkers = (
  categoryId: number | null,
  serviceTypeId: number | null,
  params?: {
    bounds?: {
      northeast: { lat: number; lng: number };
      southwest: { lat: number; lng: number };
    };
    zoom?: number;
    limit?: number;
  }
) => {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
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

  useEffect(() => {
    console.log('🔄 useMapMarkers useEffect ejecutado:', {
      categoryId,
      serviceTypeId,
      hasBounds: !!params?.bounds,
      boundsKey
    });
    
    if (!categoryId || !serviceTypeId) {
      console.log('⚠️ useMapMarkers: categoryId o serviceTypeId faltantes');
      setMarkers([]);
      setTotalCount(0);
      return;
    }

    const fetchMarkers = async () => {
      setLoading(true);
      setError(null);

      try {
        const urlParams = new URLSearchParams({
          categoryId: categoryId.toString(),
          serviceTypeId: serviceTypeId.toString(),
        });

        // Si hay bounds, agregarlos
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
        } else {
          // Sin bounds: usar límite por defecto de 500
          urlParams.append('limit', (params?.limit || 500).toString());
        }

        const paramsKey = urlParams.toString();
        if (currentParams.current === paramsKey) {
          setLoading(false);
          return;
        }

        currentParams.current = paramsKey;

        const url = `/api/SearchService/map-markers?${urlParams.toString()}`;
        console.log('🌐 Fetching map markers:', url);

        // ✅ No requiere autenticación para ver marcadores en el mapa
        const response = await get<MapMarkersResponse>(url, { requiresAuth: false });
        console.log('📍 Map markers response:', response);

        // Mapear respuesta (puede venir en PascalCase o camelCase)
        const markersData = response.markers || response.Markers || [];
        const count = response.totalCount || response.TotalCount || 0;

        // Mapear a formato consistente
        const mappedMarkers: MapMarker[] = markersData.map((marker: any) => ({
          id: marker.id || marker.Id || marker.serviceId || marker.ServiceId,
          serviceId: marker.serviceId || marker.ServiceId || marker.id || marker.Id,
          latitude: marker.latitude || marker.Latitude || '',
          longitude: marker.longitude || marker.Longitude || '',
          price: marker.price || marker.Price || 0,
        })).filter((marker: MapMarker) => 
          marker.latitude && marker.longitude && 
          !isNaN(parseFloat(marker.latitude)) && 
          !isNaN(parseFloat(marker.longitude))
        );

        console.log('📍 Map markers mapeados:', mappedMarkers.length, 'marcadores válidos');
        setMarkers(mappedMarkers);
        setTotalCount(count);
      } catch (err) {
        console.error('❌ Error fetching map markers:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar marcadores');
        setMarkers([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkers();
  }, [categoryId, serviceTypeId, boundsKey, params?.limit, get]);

  return {
    markers,
    totalCount,
    loading,
    error
  };
};

