import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { API_CONFIG } from '../config/api';

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

interface CacheEntry {
  services: Service[];
  timestamp: number;
  bounds: string;
}

/**
 * Hook optimizado para cargar servicios dinámicamente según el viewport del mapa
 * - Caché inteligente con TTL
 * - Cancelación automática de peticiones obsoletas
 * - Deduplicación en origen
 * - Validaciones robustas
 * - Límites adaptativos según zoom
 */
export function useServiceLoader(
  categoryId: number | null,
  serviceTypeId: number | null,
  viewport: ViewportRequest | null,
  options?: {
    limit?: number;
    enabled?: boolean;
    cacheTTL?: number;
  }
) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Referencias para cancelación y caché
  const inFlightCountRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const lastRequestRef = useRef<string>('');
  const requestStartTimeRef = useRef<number>(0);
  const MIN_REQUEST_TIME = 200; // Mínimo tiempo antes de poder cancelar (200ms)
  
  const CACHE_TTL = options?.cacheTTL || 5 * 60 * 1000; // 5 minutos por defecto
  const MAX_CACHE_SIZE = 20; // Máximo de entradas en caché
  const enabled = options?.enabled !== false;
  const limit = options?.limit;
  const isDev = import.meta.env.DEV;

  const setLoadingSafe = useCallback((value: boolean) => {
    if (value) {
      inFlightCountRef.current += 1;
      setLoading(true);
      return;
    }
    inFlightCountRef.current = Math.max(0, inFlightCountRef.current - 1);
    if (inFlightCountRef.current === 0) {
      setLoading(false);
    }
  }, []);

  const viewportKey = useMemo(() => {
    if (!viewport) return null;
    return `${viewport.northeast.lat.toFixed(4)}-${viewport.northeast.lng.toFixed(4)}-${viewport.southwest.lat.toFixed(4)}-${viewport.southwest.lng.toFixed(4)}-${viewport.zoom.toFixed(2)}`;
  }, [viewport]);

  /**
   * Determina el límite máximo de resultados según el nivel de zoom
   * Similar a Airbnb: menos marcadores en zoom bajo, más en zoom alto
   */
  const getMaxResults = useCallback((zoom: number): number => {
    if (zoom < 8) return 30;
    if (zoom < 10) return 50;
    if (zoom < 12) return 100;
    if (zoom < 14) return 200;
    if (zoom < 16) return 300;
    return 500;
  }, []);

  /**
   * Genera una clave única para el caché basada en bounds y filtros
   */
  const getCacheKey = useCallback((
    viewport: ViewportRequest,
    catId: number,
    svcTypeId: number
  ): string => {
    return `${catId}-${svcTypeId}-${viewport.northeast.lat.toFixed(4)}-${viewport.northeast.lng.toFixed(4)}-${viewport.southwest.lat.toFixed(4)}-${viewport.southwest.lng.toFixed(4)}-${viewport.zoom.toFixed(2)}`;
  }, []);

  /**
   * Valida que el viewport tenga coordenadas válidas
   */
  const validateViewport = useCallback((viewport: ViewportRequest): boolean => {
    const { northeast, southwest, zoom } = viewport;
    
      // Validar existencia
    if (!northeast || !southwest || !isFinite(zoom)) {
      return false;
    }

    // Validar rangos
    if (Math.abs(northeast.lat) > 90 || Math.abs(southwest.lat) > 90) {
      return false;
    }

    if (Math.abs(northeast.lng) > 180 || Math.abs(southwest.lng) > 180) {
      return false;
    }

    // Validar que northeast esté al norte de southwest
    if (northeast.lat <= southwest.lat) {
      return false;
    }

    // Validar bounds no demasiado pequeños
    const latDiff = northeast.lat - southwest.lat;
    if (latDiff < 0.0001) {
      return false;
    }

    return true;
  }, []);

  /**
   * Limpia el caché manteniendo solo las entradas más recientes
   */
  const cleanCache = useCallback(() => {
    if (cacheRef.current.size <= MAX_CACHE_SIZE) return;

    const entries = Array.from(cacheRef.current.entries());
    // Ordenar por timestamp (más reciente primero)
    entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
    
    // Mantener solo las MAX_CACHE_SIZE más recientes
    cacheRef.current.clear();
    entries.slice(0, MAX_CACHE_SIZE).forEach(([key, value]) => {
      cacheRef.current.set(key, value);
    });

  }, []);

  /**
   * Carga servicios desde la API con todas las optimizaciones
   */
  const loadServices = useCallback(
    async (viewportData: ViewportRequest) => {
      // Validar parámetros requeridos
      if (!categoryId || !serviceTypeId) {
        setServices([]);
        inFlightCountRef.current = 0;
        setLoading(false);
        return;
      }

      // Validar que el hook esté habilitado
      if (!enabled) {
        setServices([]);
        inFlightCountRef.current = 0;
        setLoading(false);
        return;
      }

      // Validar viewport
      if (!validateViewport(viewportData)) {
        setServices([]);
        inFlightCountRef.current = 0;
        setLoading(false);
        return;
      }

      // Generar clave de caché
      const cacheKey = getCacheKey(viewportData, categoryId, serviceTypeId);

      // Evitar requests duplicados
      if (lastRequestRef.current === cacheKey) {
        return;
      }
      
      // ✅ MEJORADO: Solo cancelar petición anterior si:
      // 1. Existe una petición previa
      // 2. La petición previa lleva al menos MIN_REQUEST_TIME ejecutándose (evita cancelar la primera llamada)
      const timeSinceLastRequest = Date.now() - requestStartTimeRef.current;
      if (abortControllerRef.current && timeSinceLastRequest >= MIN_REQUEST_TIME) {
        abortControllerRef.current.abort();
      }
      
      lastRequestRef.current = cacheKey;

      // Verificar caché
      const cached = cacheRef.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        if (isDev) {
          console.log(`✅ Usando caché (${cached.services.length} servicios):`, cacheKey);
        }
        setServices(cached.services);
        inFlightCountRef.current = 0;
        setLoading(false);
        return;
      }

      // Crear nuevo AbortController
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      requestStartTimeRef.current = Date.now(); // ✅ Registrar tiempo de inicio

      if (isDev) {
        console.log('🔄 Iniciando carga de servicios:', {
          bounds: { ne: viewportData.northeast, sw: viewportData.southwest },
          zoom: viewportData.zoom,
          cacheKey,
        });
      }

      setLoadingSafe(true);
      setError(null);

      try {
        const normalizedZoom = Math.max(0, Math.round(viewportData.zoom));
        const maxResults = limit || getMaxResults(normalizedZoom);
        
        // Construir parámetros de la query
        const params = new URLSearchParams({
          categoryId: categoryId.toString(),
          serviceTypeId: serviceTypeId.toString(),
          northeastLat: viewportData.northeast.lat.toString(),
          northeastLng: viewportData.northeast.lng.toString(),
          southwestLat: viewportData.southwest.lat.toString(),
          southwestLng: viewportData.southwest.lng.toString(),
          zoom: normalizedZoom.toString(),
          limit: maxResults.toString(),
        });

        const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.expert.services.mapExperts}?${params.toString()}`;

        // Realizar petición con timeout
        const timeoutMs = 10000; // 10 segundos
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
        });

        const fetchPromise = fetch(url, {
          signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Mapear y deduplicar servicios
        let mappedServices: Service[] = [];

        const servicesPayload = Array.isArray(data?.services)
          ? data.services
          : (Array.isArray(data?.Services) ? data.Services : null);

        if (servicesPayload) {
          mappedServices = servicesPayload
            .map((service: any) => {
              const expert = service.expert || service.Expert || service.expertProfile || service.ExpertProfile || {};
              const rawLat = expert.latitude ?? expert.Latitude;
              const rawLng = expert.longitude ?? expert.Longitude;
              const lat = rawLat !== undefined && rawLat !== null ? parseFloat(String(rawLat)) : NaN;
              const lng = rawLng !== undefined && rawLng !== null ? parseFloat(String(rawLng)) : NaN;

              // Validar coordenadas
              if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
                return null;
              }

              return {
                id: service.id || service.Id,
                lat,
                lng,
                name: expert.user?.name || expert.User?.Name || 'Experto',
                price: service.price || service.Price || 0,
                type: service.serviceTypeName || service.ServiceTypeName,
                raw: service,
              };
            })
            .filter((s): s is Service => s !== null);
        } else if (data.Experts || data.experts) {
          const experts = data.Experts || data.experts || [];
          mappedServices = experts
            .map((expert: any) => {
              const rawLat = expert.latitude ?? expert.Latitude;
              const rawLng = expert.longitude ?? expert.Longitude;
              const lat = rawLat !== undefined && rawLat !== null ? parseFloat(String(rawLat)) : NaN;
              const lng = rawLng !== undefined && rawLng !== null ? parseFloat(String(rawLng)) : NaN;

              if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
                return null;
              }

              return {
                id: expert.id || expert.Id,
                lat,
                lng,
                name: expert.name || expert.Name,
                price: expert.price || expert.Price || 0,
                type: expert.serviceTypeName || expert.ServiceTypeName,
              };
            })
            .filter((s): s is Service => s !== null);
        }

        // Deduplicar por ID (último paso de seguridad)
        const uniqueMap = new Map<number, Service>();
        mappedServices.forEach(service => {
          // Solo mantener el primero encontrado
          if (!uniqueMap.has(service.id)) {
            uniqueMap.set(service.id, service);
          }
        });
        const uniqueServices = Array.from(uniqueMap.values());

        if (isDev) {
          console.log(`✅ Servicios cargados: ${uniqueServices.length} únicos (de ${mappedServices.length} recibidos)`);
        }

        // Guardar en caché
        cacheRef.current.set(cacheKey, {
          services: uniqueServices,
          timestamp: Date.now(),
          bounds: cacheKey,
        });

        // Limpiar caché si es necesario
        cleanCache();

        // Actualizar estado solo si no fue cancelado
        if (!signal.aborted) {
          setServices(uniqueServices);
        }

      } catch (err: any) {
        if (err.name === 'AbortError') {
          if (isDev) {
            console.log('⏹️ Petición cancelada');
          }
          return;
        }

        if (isDev) {
          console.error('❌ Error al cargar servicios:', err);
        }
        const errorMessage = err.message || 'Error al cargar servicios';
        
        if (!signal.aborted) {
          setError(errorMessage);
          // Mantener marcadores previos en errores de refresh (stale-while-revalidate)
        }
      } finally {
        setLoadingSafe(false);
      }
    },
    [categoryId, serviceTypeId, limit, enabled, getMaxResults, validateViewport, getCacheKey, cleanCache, CACHE_TTL, isDev, setLoadingSafe]
  );

  /**
   * Effect principal: cargar servicios cuando cambie el viewport
   */
  useEffect(() => {
    if (!viewport || !viewportKey) {
      setServices([]);
      inFlightCountRef.current = 0;
      setLoading(false);
      return;
    }

    loadServices(viewport);

    // Cleanup al desmontar o cambiar dependencias
    // ✅ MEJORADO: Solo cancelar si la petición lleva suficiente tiempo ejecutándose
    return () => {
      const timeSinceStart = Date.now() - requestStartTimeRef.current;
      if (abortControllerRef.current && timeSinceStart >= MIN_REQUEST_TIME) {
        abortControllerRef.current.abort();
      }
    };
  }, [viewportKey, loadServices]);

  /**
   * Función para forzar recarga
   */
  const reload = useCallback(() => {
    if (viewport) {
      // Limpiar caché para este viewport específico
      const cacheKey = getCacheKey(viewport, categoryId!, serviceTypeId!);
      cacheRef.current.delete(cacheKey);
      lastRequestRef.current = '';
      loadServices(viewport);
    }
  }, [viewport, loadServices, getCacheKey, categoryId, serviceTypeId]);

  /**
   * Función para limpiar todo el caché
   */
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const isInitialLoading = loading && services.length === 0;
  const isRefreshing = loading && services.length > 0;

  return {
    services,
    loading,
    isInitialLoading,
    isRefreshing,
    error,
    reload,
    clearCache,
    cacheSize: cacheRef.current.size,
  };
}
