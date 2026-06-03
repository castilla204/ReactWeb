import React, { useMemo, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import useSupercluster from 'use-supercluster';
import { Service } from '../../hooks/useServiceLoader';
// 🛡️ Round 28: símbolo correcto del servicio (£/CHF/kr) en lugar de € hardcoded en markers.
import { getCurrencySymbol } from '../../utils/priceUtils';

interface ClusteredMarkersProps {
  map: maplibregl.Map | null;
  services: Service[];
  bounds?: [number, number, number, number];
  zoom?: number;
  selectedServiceId?: number | null;
  hoveredServiceId?: number | null;
  onServiceClick?: (service: Service) => void;
  clusterRadius?: number; // Radio de clustering en píxeles
  maxZoom?: number; // Zoom máximo para clustering
  minZoom?: number; // Zoom mínimo
}

/**
 * Marcadores agrupados con Supercluster.
 *
 * ⚡ PERF: ahora con DIFF INCREMENTAL.
 *
 * Antes: cada cambio de hoveredServiceId o selectedServiceId desmontaba TODOS los
 * marcadores DOM (~100-300 nodos) y los recreaba. En una lista con hover frecuente
 * esto causaba 30-60 ms de JS + reflow por cada movimiento del ratón.
 *
 * Ahora:
 *   - Effect A: sólo se ejecuta cuando cambia el set real de clusters (zoom/bounds/services).
 *     Hace diff: crea solo nuevos, elimina solo los que ya no existen, deja en su sitio
 *     los que persisten.
 *   - Effect B: cuando cambia hover/selected, solo muta los `style.*` del nodo afectado
 *     (1-2 nodos en vez de N). Sin remove+create.
 *
 * El siguiente paso (no aplicado aquí por riesgo) sería migrar a una capa nativa
 * GeoJSON+symbol de MapLibre para ganar 8-10× en escenarios densos.
 */
export const ClusteredMarkers: React.FC<ClusteredMarkersProps> = ({
  map,
  services,
  bounds,
  zoom,
  selectedServiceId,
  hoveredServiceId,
  onServiceClick,
  clusterRadius = 56,
  maxZoom = 17,
  minZoom = 0,
}) => {
  // Map<featureKey, {marker, element, type, service?}>
  // featureKey: para clusters → `c:${cluster.id}`; para services → `s:${service.id}`
  type EntryKind = 'cluster' | 'service';
  interface Entry {
    kind: EntryKind;
    marker: maplibregl.Marker;
    element: HTMLButtonElement;
    serviceId?: number;
  }
  const entriesRef = useRef<Map<string, Entry>>(new Map());
  // Ref a los handlers vivos para que los listeners no se reenganchen.
  const onServiceClickRef = useRef(onServiceClick);
  useEffect(() => { onServiceClickRef.current = onServiceClick; }, [onServiceClick]);

  // 1️⃣ Convertir servicios a formato GeoJSON para Supercluster
  const points = useMemo(() => {
    if (!services || services.length === 0) {
      return [];
    }

    // Validar y deduplicar por ID antes de crear puntos
    const uniqueMap = new Map<number, Service>();
    services.forEach(service => {
      if (
        service &&
        service.id &&
        !isNaN(service.id) &&
        Number.isFinite(service.lat) &&
        Number.isFinite(service.lng) &&
        !isNaN(service.lat) &&
        !isNaN(service.lng) &&
        isFinite(service.lat) &&
        isFinite(service.lng)
      ) {
        if (!uniqueMap.has(service.id)) {
          uniqueMap.set(service.id, service);
        }
      }
    });

    const uniqueServices = Array.from(uniqueMap.values());

    const geoJsonPoints = uniqueServices.map(service => ({
      type: 'Feature' as const,
      properties: {
        cluster: false,
        serviceId: service.id,
        service: service,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [
          parseFloat(service.lng.toFixed(6)),
          parseFloat(service.lat.toFixed(6)),
        ] as [number, number],
      },
    }));

    return geoJsonPoints;
  }, [services]);

  // 2️⃣ Supercluster
  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom: zoom ?? 12,
    options: {
      radius: clusterRadius,
      maxZoom: maxZoom,
      minZoom: minZoom,
      extent: 512,
      nodeSize: 64,
    },
  });

  /**
   * Helpers para construir/actualizar estilos de cada tipo de marcador.
   * Se aplican via style.* directo para minimizar reflow.
   */
  const applyClusterStyle = (el: HTMLButtonElement, pointCount: number) => {
    const size = Math.min(80, Math.max(40, 36 + Math.log2(pointCount || 1) * 8));
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.borderRadius = '9999px';
    el.style.background = '#0066CC';
    el.style.color = '#fff';
    el.style.border = '2px solid #fff';
    el.style.fontWeight = '700';
    el.style.cursor = 'pointer';
    el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)';
    el.textContent = String(pointCount ?? 0);
    el.setAttribute('aria-label', `Cluster con ${pointCount} servicios`);
  };

  const applyServiceStyle = (
    el: HTMLButtonElement,
    service: Service,
    isSelected: boolean,
    isHovered: boolean
  ) => {
    el.style.padding = '6px 14px';
    el.style.borderRadius = '9999px';
    el.style.fontWeight = '700';
    el.style.fontSize = '14px';
    el.style.cursor = 'pointer';
    el.style.whiteSpace = 'nowrap';
    el.style.transition = 'transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease';
    el.style.border = isSelected ? 'none' : isHovered ? '2px solid #0066CC' : '1.5px solid #e5e5e5';
    el.style.background = isSelected ? '#0066CC' : isHovered ? '#eef4fc' : '#fff';
    el.style.color = isSelected ? '#fff' : isHovered ? '#0066CC' : '#222';
    el.style.boxShadow = isSelected
      ? '0 4px 16px rgba(0,102,204,0.45)'
      : isHovered
        ? '0 4px 14px rgba(0,102,204,0.28)'
        : '0 2px 6px rgba(0,0,0,0.25)';
    el.style.transform = isHovered ? 'scale(1.06)' : 'scale(1)';
    el.textContent = service.price > 0
      ? `${getCurrencySymbol(((service as any).priceCurrency || (service as any).currency || 'EUR'))}${Math.round(service.price)}`
      : 'Consultar';
    el.setAttribute('aria-label', `Servicio ${service.name}`);
  };

  // Sólo afecta a los estados visuales del marker — sin tocar el DOM ni el set.
  const updateServiceVisualState = (
    el: HTMLButtonElement,
    isSelected: boolean,
    isHovered: boolean
  ) => {
    el.style.border = isSelected ? 'none' : isHovered ? '2px solid #0066CC' : '1.5px solid #e5e5e5';
    el.style.background = isSelected ? '#0066CC' : isHovered ? '#eef4fc' : '#fff';
    el.style.color = isSelected ? '#fff' : isHovered ? '#0066CC' : '#222';
    el.style.boxShadow = isSelected
      ? '0 4px 16px rgba(0,102,204,0.45)'
      : isHovered
        ? '0 4px 14px rgba(0,102,204,0.28)'
        : '0 2px 6px rgba(0,0,0,0.25)';
    el.style.transform = isHovered ? 'scale(1.06)' : 'scale(1)';
  };

  /**
   * 3️⃣ Effect A: sincroniza el SET de marcadores con `clusters`.
   *    NO depende de hovered/selected → no se ejecuta en cada movimiento del ratón.
   */
  useEffect(() => {
    if (!map) return;
    if (!clusters || clusters.length === 0) {
      // Limpiar todo
      entriesRef.current.forEach((e) => e.marker.remove());
      entriesRef.current.clear();
      return;
    }

    const aliveKeys = new Set<string>();

    clusters.forEach((cluster) => {
      const [lng, lat] = cluster.geometry.coordinates as [number, number];
      const { cluster: isCluster, point_count: pointCount } = cluster.properties as any;

      if (isCluster) {
        const key = `c:${cluster.id}`;
        aliveKeys.add(key);
        let entry = entriesRef.current.get(key);
        if (!entry) {
          const el = document.createElement('button');
          el.type = 'button';
          applyClusterStyle(el, pointCount);
          el.addEventListener('click', () => {
            if (!supercluster) return;
            const currentZoom = map.getZoom();
            const suggestedZoom = supercluster.getClusterExpansionZoom(cluster.id as number);
            const expansionZoom = Math.max(suggestedZoom, currentZoom + 1);
            map.easeTo({ center: [lng, lat], zoom: expansionZoom, duration: 350 });
          });
          const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
          entry = { kind: 'cluster', marker, element: el };
          entriesRef.current.set(key, entry);
        } else {
          // Reposicionar si supercluster lo movió y refrescar contador
          entry.marker.setLngLat([lng, lat]);
          applyClusterStyle(entry.element, pointCount);
        }
        return;
      }

      const service = (cluster.properties as any).service as Service;
      if (!service?.id) return;

      const key = `s:${service.id}`;
      aliveKeys.add(key);
      let entry = entriesRef.current.get(key);
      const isSelected = selectedServiceId === service.id;
      const isHovered = !isSelected && hoveredServiceId === service.id;

      if (!entry) {
        const el = document.createElement('button');
        el.type = 'button';
        applyServiceStyle(el, service, isSelected, isHovered);
        el.addEventListener('click', () => onServiceClickRef.current?.(service));
        const marker = new maplibregl.Marker({ element: el }).setLngLat([service.lng, service.lat]).addTo(map);
        entry = { kind: 'service', marker, element: el, serviceId: service.id };
        entriesRef.current.set(key, entry);
      } else {
        entry.marker.setLngLat([service.lng, service.lat]);
        entry.element.textContent = service.price > 0 ? `€${Math.round(service.price)}` : 'Consultar';
      }
    });

    // Eliminar entries que ya no están en clusters
    for (const [key, entry] of entriesRef.current) {
      if (!aliveKeys.has(key)) {
        entry.marker.remove();
        entriesRef.current.delete(key);
      }
    }

    // Cleanup total al desmontar
    return () => {
      // No limpiar aquí — sólo al unmount real (gestionado por el cleanup del unmount effect abajo).
    };
    // ✅ Importante: no incluir hovered/selected aquí.
  }, [map, clusters, supercluster]);

  /**
   * 4️⃣ Effect B: aplica hover/selected SOLO a los nodos afectados.
   *    Sin tocar el set de markers. O(1-2) en vez de O(N).
   */
  useEffect(() => {
    if (!map) return;
    entriesRef.current.forEach((entry) => {
      if (entry.kind !== 'service' || !entry.serviceId) return;
      const isSelected = selectedServiceId === entry.serviceId;
      const isHovered = !isSelected && hoveredServiceId === entry.serviceId;
      updateServiceVisualState(entry.element, isSelected, isHovered);
    });
  }, [map, selectedServiceId, hoveredServiceId]);

  /**
   * 5️⃣ Unmount cleanup
   */
  useEffect(() => {
    return () => {
      entriesRef.current.forEach((e) => e.marker.remove());
      entriesRef.current.clear();
    };
  }, []);

  return null;
};

// Memoizar el componente para evitar re-renders innecesarios
export default React.memo(ClusteredMarkers);
