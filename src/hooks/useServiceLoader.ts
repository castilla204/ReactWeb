import { useState, useEffect, useRef, useCallback } from 'react';
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
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const lastRequestRef = useRef<string>('');
  const requestStartTimeRef = useRef<number>(0);
  const MIN_REQUEST_TIME = 200; // Mínimo tiempo antes de poder cancelar (200ms)
  
  const CACHE_TTL = options?.cacheTTL || 5 * 60 * 1000; // 5 minutos por defecto
  const MAX_CACHE_SIZE = 20; // Máximo de entradas en caché

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
    return `${catId}-${svcTypeId}-${viewport.northeast.lat.toFixed(4)}-${viewport.northeast.lng.toFixed(4)}-${viewport.southwest.lat.toFixed(4)}-${viewport.southwest.lng.toFixed(4)}-${viewport.zoom}`;
  }, []);

  /**
   * Valida que el viewport tenga coordenadas válidas
   */
  const validateViewport = useCallback((viewport: ViewportRequest): boolean => {
    const { northeast, southwest, zoom } = viewport;
    
    // Validar existencia
    if (!northeast || !southwest || !isFinite(zoom)) {
      console.warn('⚠️ Viewport incompleto:', viewport);
      return false;
    }

    // Validar rangos
    if (Math.abs(northeast.lat) > 90 || Math.abs(southwest.lat) > 90) {
      console.warn('⚠️ Latitudes fuera de rango:', { ne: northeast.lat, sw: southwest.lat });
      return false;
    }

    if (Math.abs(northeast.lng) > 180 || Math.abs(southwest.lng) > 180) {
      console.warn('⚠️ Longitudes fuera de rango:', { ne: northeast.lng, sw: southwest.lng });
      return false;
    }

    // Validar que northeast esté al norte de southwest
    if (northeast.lat <= southwest.lat) {
      console.warn('⚠️ Northeast no está al norte de southwest:', viewport);
      return false;
    }

    // Validar bounds no demasiado pequeños
    const latDiff = northeast.lat - southwest.lat;
    if (latDiff < 0.0001) {
      console.warn('⚠️ Bounds demasiado pequeños:', { latDiff });
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

    console.log(`🧹 Caché limpiado: ${entries.length} → ${cacheRef.current.size} entradas`);
  }, []);

  /**
   * Carga servicios desde la API con todas las optimizaciones
   */
  const loadServices = useCallback(
    async (viewportData: ViewportRequest) => {
      // Validar parámetros requeridos
      if (!categoryId || !serviceTypeId) {
        console.warn('⚠️ Falta categoryId o serviceTypeId');
        setServices([]);
        setLoading(false);
        return;
      }

      // Validar que el hook esté habilitado
      if (options?.enabled === false) {
        console.log('⏸️ Hook deshabilitado, no cargar servicios');
        setServices([]);
        setLoading(false);
        return;
      }

      // Validar viewport
      if (!validateViewport(viewportData)) {
        setServices([]);
        setLoading(false);
        return;
      }

      // Generar clave de caché
      const cacheKey = getCacheKey(viewportData, categoryId, serviceTypeId);

      // Evitar requests duplicados
      if (lastRequestRef.current === cacheKey) {
        console.log('⏭️ Request duplicado ignorado:', cacheKey);
        return;
      }
      
      // ✅ MEJORADO: Solo cancelar petición anterior si:
      // 1. Existe una petición previa
      // 2. La petición previa lleva al menos MIN_REQUEST_TIME ejecutándose (evita cancelar la primera llamada)
      const timeSinceLastRequest = Date.now() - requestStartTimeRef.current;
      if (abortControllerRef.current && timeSinceLastRequest >= MIN_REQUEST_TIME) {
        console.log('🛑 Cancelando petición anterior (después de', timeSinceLastRequest, 'ms)');
        abortControllerRef.current.abort();
      } else if (abortControllerRef.current) {
        console.log('⏸️ Petición anterior muy reciente (', timeSinceLastRequest, 'ms), esperando antes de cancelar');
      }
      
      lastRequestRef.current = cacheKey;

      // Verificar caché
      const cached = cacheRef.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`✅ Usando caché (${cached.services.length} servicios):`, cacheKey);
        setServices(cached.services);
        setLoading(false);
        return;
      }

      // Crear nuevo AbortController
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      requestStartTimeRef.current = Date.now(); // ✅ Registrar tiempo de inicio

      // Iniciar carga
      console.log('🔄 Iniciando carga de servicios:', {
        bounds: {
          ne: viewportData.northeast,
          sw: viewportData.southwest
        },
        zoom: viewportData.zoom,
        cacheKey
      });

      setLoading(true);
      setError(null);

      try {
        const limit = options?.limit || getMaxResults(viewportData.zoom);
        
        // Construir parámetros de la query
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

        if (data.services && Array.isArray(data.services)) {
          mappedServices = data.services
            .map((service: any) => {
              const expert = service.expert || service.Expert || {};
              const lat = parseFloat(expert.latitude || expert.Latitude || '0');
              const lng = parseFloat(expert.longitude || expert.Longitude || '0');

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
              const lat = parseFloat(expert.latitude);
              const lng = parseFloat(expert.longitude);

              if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
                return null;
              }

              return {
                id: expert.id,
                lat,
                lng,
                name: expert.name,
                price: expert.price,
                type: expert.serviceTypeName,
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

        console.log(`✅ Servicios cargados: ${uniqueServices.length} únicos (de ${mappedServices.length} recibidos)`);

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
          console.log('⏹️ Petición cancelada');
          return;
        }

        console.error('❌ Error al cargar servicios:', err);
        const errorMessage = err.message || 'Error al cargar servicios';
        
        if (!signal.aborted) {
          setError(errorMessage);
          setServices([]);
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [categoryId, serviceTypeId, options?.limit, options?.enabled, getMaxResults, validateViewport, getCacheKey, cleanCache, CACHE_TTL]
  );

  /**
   * Effect principal: cargar servicios cuando cambie el viewport
   */
  useEffect(() => {
    if (!viewport) {
      console.log('⏸️ Viewport null, limpiando servicios');
      setServices([]);
      setLoading(false);
      return;
    }

    loadServices(viewport);

    // Cleanup al desmontar o cambiar dependencias
    // ✅ MEJORADO: Solo cancelar si la petición lleva suficiente tiempo ejecutándose
    return () => {
      const timeSinceStart = Date.now() - requestStartTimeRef.current;
      if (abortControllerRef.current && timeSinceStart >= MIN_REQUEST_TIME) {
        console.log('🧹 Cleanup: Cancelando petición (después de', timeSinceStart, 'ms)');
        abortControllerRef.current.abort();
      } else if (abortControllerRef.current) {
        console.log('🧹 Cleanup: Petición muy reciente (', timeSinceStart, 'ms), no cancelando');
      }
    };
  }, [viewport, loadServices]);

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
    console.log('🧹 Caché completamente limpiado');
  }, []);

  return {
    services,
    loading,
    error,
    reload,
    clearCache,
    cacheSize: cacheRef.current.size,
  };
}
