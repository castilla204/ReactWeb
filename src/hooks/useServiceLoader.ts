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
      // ✅ VALIDACIÓN ESTRICTA: No hacer llamada si falta información esencial
      if (!categoryId || !serviceTypeId || options?.enabled === false) {
        setServices([]);
        setLoading(false);
        return;
      }

      // ✅ VALIDACIÓN CRÍTICA: Verificar que viewportData tenga bounds válidos
      if (!viewportData || 
          !viewportData.northeast || !viewportData.southwest ||
          !isFinite(viewportData.northeast.lat) || !isFinite(viewportData.northeast.lng) ||
          !isFinite(viewportData.southwest.lat) || !isFinite(viewportData.southwest.lng) ||
          !isFinite(viewportData.zoom)) {
        console.log('⚠️ useServiceLoader: Viewport inválido, no hacer llamada:', viewportData);
        setServices([]);
        setLoading(false);
        return;
      }

      // ✅ VALIDACIÓN ADICIONAL: Verificar que los bounds sean razonables (no infinitos ni NaN)
      const neLat = viewportData.northeast.lat;
      const neLng = viewportData.northeast.lng;
      const swLat = viewportData.southwest.lat;
      const swLng = viewportData.southwest.lng;
      
      // Validar que las latitudes estén en rango válido
      if (Math.abs(neLat) > 90 || Math.abs(swLat) > 90) {
        console.log('⚠️ useServiceLoader: Latitudes fuera de rango:', { neLat, swLat });
        setServices([]);
        setLoading(false);
        return;
      }
      
      // Validar que las longitudes estén en rango válido
      if (Math.abs(neLng) > 180 || Math.abs(swLng) > 180) {
        console.log('⚠️ useServiceLoader: Longitudes fuera de rango:', { neLng, swLng });
        setServices([]);
        setLoading(false);
        return;
      }
      
      // Validar que northeast esté realmente al norte de southwest
      if (neLat <= swLat) {
        console.log('⚠️ useServiceLoader: northeast no está al norte de southwest:', { neLat, swLat });
        setServices([]);
        setLoading(false);
        return;
      }
      
      // Validar que los bounds tengan un área razonable (no sean demasiado pequeños o grandes)
      const latDiff = neLat - swLat;
      const lngDiff = Math.abs(neLng - swLng);
      if (latDiff < 0.001 || (lngDiff < 0.001 && lngDiff > 0 && Math.abs(neLng - swLng) < 359)) {
        console.log('⚠️ useServiceLoader: Bounds demasiado pequeños:', { latDiff, lngDiff });
        setServices([]);
        setLoading(false);
        return;
      }

      // Cancelar petición anterior si existe
      if (abortControllerRef.current) {
        console.log('🛑 useServiceLoader: Cancelando petición anterior');
        abortControllerRef.current.abort();
      }

      // Crear nuevo AbortController ANTES de verificar caché
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // ✅ LIMPIAR servicios INMEDIATAMENTE al iniciar nueva carga
      // Esto previene acumulación de servicios de viewports anteriores
      console.log('🔄 useServiceLoader: Limpiando servicios anteriores antes de nueva carga');
      setServices([]);
      setLoading(true);
      setError(null);

      // Crear clave de caché
      const cacheKey = `${categoryId}-${serviceTypeId}-${viewportData.northeast.lat.toFixed(3)}-${viewportData.northeast.lng.toFixed(3)}-${viewportData.southwest.lat.toFixed(3)}-${viewportData.southwest.lng.toFixed(3)}-${viewportData.zoom}`;

      // Verificar caché
      const cached = cacheRef.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        // ✅ Asegurar que solo se establezcan los servicios del caché si la petición no fue cancelada
        if (!signal.aborted) {
          console.log('✅ useServiceLoader: Usando servicios del caché:', cached.services.length);
          setServices(cached.services);
          setLoading(false);
        }
        return;
      }

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

        // ✅ DEDUPLICAR servicios por id antes de guardar
        // Esto previene marcadores duplicados en la misma posición
        const uniqueServicesMap = new Map<number, Service>();
        let duplicatesCount = 0;
        mappedServices.forEach(service => {
          // Usar id como clave única
          if (!uniqueServicesMap.has(service.id)) {
            uniqueServicesMap.set(service.id, service);
          } else {
            // Si hay duplicados, mantener el primero
            duplicatesCount++;
            console.warn('⚠️ useServiceLoader: Servicio duplicado detectado en la respuesta de la API, ignorando:', service.id);
          }
        });
        const deduplicatedServices = Array.from(uniqueServicesMap.values());
        if (duplicatesCount > 0) {
          console.log(`⚠️ useServiceLoader: ${duplicatesCount} servicios duplicados filtrados de la respuesta`);
        }
        console.log(`✅ useServiceLoader: ${deduplicatedServices.length} servicios únicos después de deduplicación (de ${mappedServices.length} recibidos)`);

        // Guardar en caché
        cacheRef.current.set(cacheKey, {
          services: deduplicatedServices,
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
          console.log(`✅ useServiceLoader: Estableciendo ${deduplicatedServices.length} servicios únicos en el estado`);
          setServices(deduplicatedServices);
        } else {
          console.log('⚠️ useServiceLoader: Petición cancelada, no establecer servicios');
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
    // ✅ VALIDACIÓN ESTRICTA: Solo cargar si viewport es válido, no es null, y enabled es true
    if (options?.enabled === false) {
      console.log('⚠️ useServiceLoader: Deshabilitado (enabled=false), NO hacer llamada');
      setServices([]);
      setLoading(false);
      return;
    }
    
    if (viewport && 
        viewport.northeast && viewport.southwest &&
        isFinite(viewport.northeast.lat) && isFinite(viewport.northeast.lng) &&
        isFinite(viewport.southwest.lat) && isFinite(viewport.southwest.lng) &&
        isFinite(viewport.zoom)) {
      console.log('✅ useServiceLoader: Viewport válido, iniciando carga de servicios:', {
        ne: viewport.northeast,
        sw: viewport.southwest,
        zoom: viewport.zoom
      });
      // loadServices ya limpia los servicios al inicio, no es necesario hacerlo aquí
      loadServices(viewport);
    } else {
      // ✅ Si viewport es null o inválido, asegurar que no haya servicios cargados
      console.log('⚠️ useServiceLoader: Viewport null o inválido, limpiando servicios:', viewport);
      setServices([]);
      setLoading(false);
    }

    return () => {
      // ✅ Cancelar petición en curso cuando cambia el viewport
      if (abortControllerRef.current) {
        console.log('🛑 useServiceLoader: Limpiando al desmontar o cambiar dependencias');
        abortControllerRef.current.abort();
      }
    };
  }, [viewport, loadServices, options?.enabled]);

  return {
    services,
    loading,
    error,
    reload: () => viewport && loadServices(viewport),
  };
}
