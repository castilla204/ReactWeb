import { useState, useCallback, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

export interface ViewportBounds {
  northeast: { lat: number; lng: number };
  southwest: { lat: number; lng: number };
}

export interface MapViewport {
  bounds: ViewportBounds | null;
  zoom: number;
  center: { lat: number; lng: number };
}

/**
 * Hook para gestionar el viewport del mapa de forma optimizada
 * Detecta cambios en bounds y zoom, con debounce integrado
 */
export function useMapViewport(
  onViewportChange?: (viewport: MapViewport) => void,
  debounceMs: number = 400
) {
  const map = useMap();
  const [viewport, setViewport] = useState<MapViewport>({
    bounds: null,
    zoom: 12,
    center: { lat: 40.4168, lng: -3.7038 }, // Madrid por defecto
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false);
  const prevBoundsKeyRef = useRef<string>('');

  const updateViewport = useCallback(() => {
    if (!map) return;

    const bounds = map.getBounds();
    const zoom = map.getZoom() || 12;
    const center = map.getCenter();

    if (!bounds || !center) return;

    const northeast = bounds.getNorthEast();
    const southwest = bounds.getSouthWest();

    // Serializar bounds para comparación (evita llamadas duplicadas)
    const boundsKey = `${southwest.lat().toFixed(4)},${southwest.lng().toFixed(4)},${northeast.lat().toFixed(4)},${northeast.lng().toFixed(4)},${zoom}`;

    // Si los bounds no cambiaron significativamente, no actualizar
    if (prevBoundsKeyRef.current === boundsKey && !isDraggingRef.current) {
      return;
    }

    prevBoundsKeyRef.current = boundsKey;

    const newViewport: MapViewport = {
      bounds: {
        northeast: { lat: northeast.lat(), lng: northeast.lng() },
        southwest: { lat: southwest.lat(), lng: southwest.lng() },
      },
      zoom,
      center: { lat: center.lat(), lng: center.lng() },
    };

    setViewport(newViewport);

    // Limpiar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce para evitar múltiples llamadas durante el arrastre
    debounceTimerRef.current = setTimeout(() => {
      if (onViewportChange && !isDraggingRef.current) {
        onViewportChange(newViewport);
      }
    }, debounceMs);
  }, [map, onViewportChange, debounceMs]);

  const handleIdle = useCallback(() => {
    isDraggingRef.current = false;
    updateViewport();
  }, [updateViewport]);

  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
    // Cancelar cualquier llamada pendiente durante el arrastre
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    viewport,
    updateViewport,
    handleIdle,
    handleDragStart,
    isDragging: isDraggingRef.current,
  };
}
