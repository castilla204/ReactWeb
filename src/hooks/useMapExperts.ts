import { useState, useEffect, useRef, useCallback } from 'react';
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
  // ✅ Precio del servicio (incluido en map-experts endpoint)
  price: number;
  serviceDescription?: string;
  serviceTypeName?: string;
  currentAvailability?: {
    id: number;
    daysOfWeek: string[];
    startTime: string;
    endTime: string;
    effectiveFrom?: string;
  };
}

export interface MapExpertsResponse {
  experts: MapExpert[];
  totalCount: number;
}

export interface MapBounds {
  northeast: { lat: number; lng: number };
  southwest: { lat: number; lng: number };
  zoom: number;
}

export const useMapExperts = (
  categoryId: number | null, 
  serviceTypeId: number | null,
  bounds?: MapBounds | null
) => {
  const [experts, setExperts] = useState<MapExpert[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { get } = useApi();

  // Usar useRef para evitar re-renders y llamadas múltiples
  const hasFetched = useRef(false);
  const currentParams = useRef<string>('');
  const lastBoundsRef = useRef<string>(''); // ✅ Para comparar bounds y evitar llamadas duplicadas
  const isFetchingRef = useRef(false); // ✅ Para evitar llamadas simultáneas

  // ✅ Función para comparar bounds (evitar llamadas si son iguales)
  const getBoundsKey = (mapBounds: MapBounds | null | undefined): string => {
    if (!mapBounds) return '';
    // Redondear a 2 decimales para evitar diferencias mínimas
    return `${Math.round(mapBounds.northeast.lat * 100)}_${Math.round(mapBounds.northeast.lng * 100)}_${Math.round(mapBounds.southwest.lat * 100)}_${Math.round(mapBounds.southwest.lng * 100)}_${mapBounds.zoom}`;
  };

  // ✅ Función para cargar expertos (puede ser llamada desde fuera)
  const fetchExperts = useCallback(async (
    catId: number | null,
    svcTypeId: number | null,
    mapBounds?: MapBounds | null
  ) => {
    if (!catId || !svcTypeId) {
      return;
    }

    // ✅ Evitar llamadas simultáneas
    if (isFetchingRef.current) {
      console.log('⏸️ [SKIP] Ya hay una petición en curso, saltando...');
      return;
    }

    // ✅ Comparar bounds para evitar llamadas duplicadas
    const boundsKey = getBoundsKey(mapBounds);
    if (mapBounds && boundsKey === lastBoundsRef.current) {
      console.log('⏸️ [SKIP] Bounds no han cambiado, saltando petición...');
      return;
    }

    isFetchingRef.current = true;
    if (mapBounds) {
      lastBoundsRef.current = boundsKey;
    }

    setLoading(true);
    setError(null);

    try {
      // Construir URL según si hay bounds o no
      let url = `/api/SearchService/map-experts?categoryId=${catId}&serviceTypeId=${svcTypeId}`;
      
      // ✅ Modo 2: Con bounds (al mover el mapa)
      if (mapBounds) {
        const params = new URLSearchParams({
          categoryId: catId.toString(),
          serviceTypeId: svcTypeId.toString(),
          northeastLat: mapBounds.northeast.lat.toString(),
          northeastLng: mapBounds.northeast.lng.toString(),
          southwestLat: mapBounds.southwest.lat.toString(),
          southwestLng: mapBounds.southwest.lng.toString(),
          zoom: mapBounds.zoom.toString(),
          limit: '50' // Recomendado: 30-50 para móvil, 50-100 para desktop
        });
        url = `/api/SearchService/map-experts?${params.toString()}`;
        console.log('🌐 [BOUNDS] Fetching map experts with bounds:', url);
      } else {
        // ✅ Modo 1: Sin bounds (carga inicial)
        console.log('🌐 [INITIAL] Fetching all map experts:', url);
        lastBoundsRef.current = ''; // Reset bounds cuando es carga inicial
      }
      
      // ✅ No requiere autenticación para ver expertos en el mapa
      const response = await get<MapExpertsResponse>(url, { requiresAuth: false });
      console.log('📍 Map experts response:', response);
      
      if (response && response.experts) {
        setExperts(response.experts);
        setTotalCount(response.totalCount);
      } else {
        setExperts([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error('❌ Error fetching map experts:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar expertos');
      setExperts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
      isFetchingRef.current = false; // ✅ Liberar el lock
    }
  }, [get]);

  // ✅ Carga inicial (sin bounds) - Solo cuando cambian categoryId o serviceTypeId
  useEffect(() => {
    const paramsKey = `${categoryId}-${serviceTypeId}`;
    
    // Solo ejecutar si los parámetros han cambiado y son válidos
    if (!categoryId || !serviceTypeId || currentParams.current === paramsKey) {
      return;
    }

    console.log('🔄 useMapExperts - Ejecutando carga inicial para:', { categoryId, serviceTypeId });
    currentParams.current = paramsKey;
    hasFetched.current = true;
    lastBoundsRef.current = ''; // Reset bounds para carga inicial
    
    // Carga inicial SIN bounds
    fetchExperts(categoryId, serviceTypeId, null);
  }, [categoryId, serviceTypeId, fetchExperts]);

  // ✅ Carga dinámica (con bounds) - Cuando cambian los bounds
  useEffect(() => {
    // Solo cargar con bounds si ya se hizo la carga inicial
    if (!hasFetched.current || !bounds || !categoryId || !serviceTypeId) {
      return;
    }

    // ✅ Comparar bounds antes de hacer la llamada
    const boundsKey = getBoundsKey(bounds);
    if (boundsKey === lastBoundsRef.current) {
      console.log('⏸️ [SKIP] Bounds no han cambiado significativamente');
      return;
    }

    console.log('🔄 useMapExperts - Ejecutando carga con bounds:', bounds);
    
    // Carga dinámica CON bounds
    fetchExperts(categoryId, serviceTypeId, bounds);
  }, [bounds, categoryId, serviceTypeId, fetchExperts]);

  return {
    experts,
    totalCount,
    loading,
    error,
    refetch: fetchExperts // ✅ Permitir refetch manual
  };
};
