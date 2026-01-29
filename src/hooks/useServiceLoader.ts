import { useState, useEffect, useRef, useCallback } from 'react';
import { API_CONFIG } from '../config/api';
import { MapExpert } from './useMapExperts';

export interface Service {
  id: number;
  lat: number;
  lng: number;
  name: string;
  price: number;
  type?: string;
  [key: string]: any;
}

export interface ViewportRequest {
  northeast: { lat: number; lng: number };
  southwest: { lat: number; lng: number };
  zoom: number;
}

/**
 * Hook para cargar servicios dinámicamente según el viewport del mapa
 * Implementa caché y cancelación de peticiones para optimizar rendimiento
 */
export function useServiceLoader(
  categoryId: number | null,
  serviceTypeId: number | null,
  viewport: ViewportRequest | null,
  options?: {
    limit?: number;
    enabled?: boolean;
  }
) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, { services: Service[]; timestamp: number }>>(new Map());
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  const getMaxResults = useCallback((zoom: number): number => {
    // Ajustar cantidad según zoom para mejor rendimiento
    if (zoom < 10) return 100;
    if (zoom < 14) return 300;
    return 500;
  }, []);

  const loadServices = useCallback(
    async (viewportData: ViewportRequest) => {
      if (!categoryId || !serviceTypeId || options?.enabled === false) {
        setServices([]);
        return;
      }

      // Crear clave de caché
      const cacheKey = `${categoryId}-${serviceTypeId}-${viewportData.northeast.lat.toFixed(3)}-${viewportData.northeast.lng.toFixed(3)}-${viewportData.southwest.lat.toFixed(3)}-${viewportData.southwest.lng.toFixed(3)}-${viewportData.zoom}`;

      // Verificar caché
      const cached = cacheRef.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setServices(cached.services);
        return;
      }

      // Cancelar petición anterior si existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Crear nuevo AbortController
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setLoading(true);
      setError(null);

      try {
        const limit = options?.limit || getMaxResults(viewportData.zoom);
        const params = new URLSearchParams({
          categoryId: categoryId.toString(),
          serviceTypeId: serviceTypeId.toString(),
          northeastLat: viewportData.northeast.lat.toString(),
          northeastLng: viewportData.northeast.lng.toString(),
          southwestLat: viewportData.southwest.lat.toString(),
          southwestLng: viewportData.southwest.lng.toString(),
          zoom: viewportData.zoom.toString(),
          limit: limit.toString(),
        });

        const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.expert.services.mapExperts}?${params.toString()}`;

        const response = await fetch(url, {
          signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Mapear respuesta a formato Service[]
        let mappedServices: Service[] = [];

        if (data.services && Array.isArray(data.services)) {
          mappedServices = data.services.map((service: any) => {
            const expert = service.expert || service.Expert || {};
            const lat = parseFloat(expert.latitude || expert.Latitude || '0');
            const lng = parseFloat(expert.longitude || expert.Longitude || '0');

            return {
              id: service.id || service.Id,
              lat,
              lng,
              name: expert.user?.name || expert.User?.Name || 'Experto',
              price: service.price || service.Price || 0,
              type: service.serviceTypeName || service.ServiceTypeName,
              raw: service, // Guardar datos completos para uso futuro
            };
          }).filter((s: Service) => !isNaN(s.lat) && !isNaN(s.lng));
        } else if (data.Experts || data.experts) {
          const experts = data.Experts || data.experts || [];
          mappedServices = experts.map((expert: MapExpert) => ({
            id: expert.id,
            lat: parseFloat(expert.latitude),
            lng: parseFloat(expert.longitude),
            name: expert.name,
            price: expert.price,
            type: expert.serviceTypeName,
          })).filter((s: Service) => !isNaN(s.lat) && !isNaN(s.lng));
        }

        // Guardar en caché
        cacheRef.current.set(cacheKey, {
          services: mappedServices,
          timestamp: Date.now(),
        });

        // Limpiar caché antiguo (más de 10 entradas)
        if (cacheRef.current.size > 10) {
          const entries = Array.from(cacheRef.current.entries());
          entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
          cacheRef.current.clear();
          entries.slice(0, 10).forEach(([key, value]) => {
            cacheRef.current.set(key, value);
          });
        }

        if (!signal.aborted) {
          setServices(mappedServices);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // Petición cancelada, no hacer nada
          return;
        }
        console.error('Error loading services:', err);
        setError(err.message || 'Error al cargar servicios');
        setServices([]);
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [categoryId, serviceTypeId, options?.limit, getMaxResults, options?.enabled]
  );

  useEffect(() => {
    if (viewport) {
      loadServices(viewport);
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [viewport, loadServices]);

  return {
    services,
    loading,
    error,
    reload: () => viewport && loadServices(viewport),
  };
}
