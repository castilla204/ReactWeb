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
  // ✅ NUEVO: Precio del servicio (incluido en map-experts endpoint)
  price: number;
}

export interface MapExpertsResponse {
  experts: MapExpert[];
  totalCount: number;
}

export const useMapExperts = (categoryId: number | null, serviceTypeId: number | null) => {
  const [experts, setExperts] = useState<MapExpert[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { get } = useApi();

  // Usar useRef para evitar re-renders y llamadas múltiples
  const hasFetched = useRef(false);
  const currentParams = useRef<string>('');

  useEffect(() => {
    const paramsKey = `${categoryId}-${serviceTypeId}`;
    
    // Solo ejecutar si los parámetros han cambiado y son válidos
    if (!categoryId || !serviceTypeId || currentParams.current === paramsKey) {
      return;
    }

    console.log('🔄 useMapExperts - Ejecutando fetch para:', { categoryId, serviceTypeId });
    currentParams.current = paramsKey;
    hasFetched.current = true;
    
    const fetchExperts = async () => {
      setLoading(true);
      setError(null);

      try {
        const url = `/api/SearchService/map-experts?categoryId=${categoryId}&serviceTypeId=${serviceTypeId}`;
        console.log('🌐 Fetching map experts:', url);
        
        const response = await get<MapExpertsResponse>(url);
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
      }
    };

    fetchExperts();
  }, [categoryId, serviceTypeId, get]);

  return {
    experts,
    totalCount,
    loading,
    error
  };
};
