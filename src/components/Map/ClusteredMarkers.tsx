import React, { useMemo, useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { capMapWorkers } from '../../lib/mapWorkers';
capMapWorkers(maplibregl);
import useSupercluster from 'use-supercluster';
import { Service } from '../../hooks/useServiceLoader';
// 🛡️ Round 28: símbolo correcto del servicio (£/CHF/kr) en lugar de € hardcoded en markers.
import { getCurrencySymbol } from '../../utils/priceUtils';

/** Margen mínimo entre el pill y el borde visible del mapa (px). */
const MARKER_EDGE_MARGIN = 12;

function computeMarkerScreenOffset(
  map: maplibregl.Map,
  lng: number,
  lat: number,
  el: HTMLElement,
): [number, number] {
  const point = map.project([lng, lat]);
  const w = el.offsetWidth || 52;
  const h = el.offsetHeight || 28;
  const pad = map.getPadding();
  const cw = map.getContainer().clientWidth;
  const ch = map.getContainer().clientHeight;
  const minX = pad.left + MARKER_EDGE_MARGIN;
  const maxX = cw - pad.right - MARKER_EDGE_MARGIN;
  const minY = pad.top + MARKER_EDGE_MARGIN;
  const maxY = ch - pad.bottom - MARKER_EDGE_MARGIN;
  const halfW = w / 2;
  const halfH = h / 2;
  let ox = 0;
  let oy = 0;
  const left = point.x - halfW;
  const right = point.x + halfW;
  const top = point.y - halfH;
  const bottom = point.y + halfH;
  if (left < minX) ox += minX - left;
  if (right > maxX) ox += maxX - right;
  if (top < minY) oy += minY - top;
  if (bottom > maxY) oy += maxY - bottom;
  return [ox, oy];
}

function syncMarkerEdgeOffset(
  map: maplibregl.Map,
  marker: maplibregl.Marker,
  lng: number,
  lat: number,
  el: HTMLElement,
) {
  marker.setOffset(computeMarkerScreenOffset(map, lng, lat, el));
}

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
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.borderRadius = '9999px';
    // Marca sólida (sin degradado) + borde blanco → limpio y profesional.
    el.style.background = 'hsl(var(--brand))';
    el.style.color = '#fff';
    el.style.border = '2px solid #fff';
    el.style.fontWeight = '700';
    el.style.fontSize = size >= 56 ? '15px' : '13px';
    el.style.cursor = 'pointer';
    // Sombra neutra de contacto, sin glow de color.
    el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.20), 0 1px 2px rgba(0,0,0,0.12)';
    el.textContent = String(pointCount ?? 0);
    el.setAttribute('aria-label', `Cluster con ${pointCount} servicios`);
  };

  // Estilo visual del pill de precio en sus 3 estados. Único punto de verdad para
  // que init (applyServiceStyle) y update (updateServiceVisualState) no diverjan.
  // Estilo Airbnb: pin blanco con texto tinta; el seleccionado se rellena de marca.
  //  · reposo    → blanco, texto tinta, hairline gris, sombra neutra
  //  · hover     → blanco, borde gris más marcado, leve scale
  //  · selected  → relleno de marca sólido, texto blanco
  const applyPillVisual = (
    inner: HTMLSpanElement,
    isSelected: boolean,
    isHovered: boolean
  ) => {
    inner.style.padding = '6px 14px';
    inner.style.fontSize = '14px';
    inner.style.fontWeight = '700';
    inner.style.letterSpacing = '-0.01em';
    inner.style.lineHeight = '1.1';
    inner.style.fontVariantNumeric = 'tabular-nums';
    inner.style.borderStyle = 'solid';
    inner.style.borderWidth = isSelected ? '0' : '1.25px';
    inner.style.borderColor = isSelected
      ? 'transparent'
      : isHovered
        ? '#8a8a8a'
        : '#c8c8c8';
    inner.style.background = isSelected ? 'hsl(var(--brand))' : '#fff';
    inner.style.color = isSelected ? '#fff' : '#111111';
    inner.style.boxShadow = isSelected
      ? '0 3px 10px rgba(0,0,0,0.22), 0 1px 3px rgba(0,0,0,0.14)'
      : isHovered
        ? '0 3px 10px rgba(0,0,0,0.18), 0 1px 2px rgba(0,0,0,0.10)'
        : '0 2px 6px rgba(0,0,0,0.16), 0 1px 2px rgba(0,0,0,0.10)';
    inner.style.transform = isSelected ? 'scale(1.04)' : isHovered ? 'scale(1.06)' : 'scale(1)';
  };

  const applyServiceStyle = (
    el: HTMLButtonElement,
    service: Service,
    isSelected: boolean,
    isHovered: boolean
  ) => {
    // ⚠️ Wobble-fix: NO aplicar `transition: transform ...` ni `transform: scale(...)`
    //    al `el` que MapLibre posiciona. MapLibre escribe `transform` de este nodo en
    //    cada frame del pan, y una transition sobre `transform` hace que el marker
    //    "persiga" su posición real con ~150 ms de lag elástico (wobble visible al
    //    arrastrar). El scale del hover se aplica a un `<span>` hijo aislado.
    el.style.padding = '0';
    el.style.background = 'transparent';
    el.style.border = 'none';
    el.style.cursor = 'pointer';
    el.style.whiteSpace = 'nowrap';
    el.style.boxShadow = 'none';
    el.style.transform = ''; // ⛔ NUNCA escribir transform aquí (MapLibre es dueño)

    // Crear (o reutilizar) el hijo interno que sí anima libremente
    let inner = el.firstElementChild as HTMLSpanElement | null;
    if (!inner || inner.dataset.role !== 'pill') {
      el.textContent = '';
      inner = document.createElement('span');
      inner.dataset.role = 'pill';
      inner.style.display = 'inline-flex';
      inner.style.alignItems = 'center';
      inner.style.justifyContent = 'center';
      inner.style.borderRadius = '9999px';
      inner.style.whiteSpace = 'nowrap';
      inner.style.willChange = 'transform';
      inner.style.transition = 'transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease, border-color 0.15s ease, color 0.15s ease';
      el.appendChild(inner);
    }
    applyPillVisual(inner, isSelected, isHovered);
    inner.textContent = service.price > 0
      ? `${getCurrencySymbol(((service as any).priceCurrency || (service as any).currency || 'EUR'))}${Math.round(service.price)}`
      : 'Consultar';
    el.setAttribute('aria-label', `Servicio ${service.name}`);
  };

  // Sólo afecta a los estados visuales del marker — sin tocar el DOM ni el set.
  // ⚠️ Wobble-fix: muta el hijo `pill`, NUNCA el `el` que MapLibre reposiciona.
  const updateServiceVisualState = (
    el: HTMLButtonElement,
    isSelected: boolean,
    isHovered: boolean
  ) => {
    const inner = el.firstElementChild as HTMLSpanElement | null;
    if (!inner || inner.dataset.role !== 'pill') return;
    applyPillVisual(inner, isSelected, isHovered);
  };

  const syncAllMarkerOffsets = useCallback(() => {
    if (!map) return;
    entriesRef.current.forEach((entry) => {
      const { lng, lat } = entry.marker.getLngLat();
      syncMarkerEdgeOffset(map, entry.marker, lng, lat, entry.element);
    });
  }, [map]);

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
          const marker = new maplibregl.Marker({
            element: el,
            anchor: 'center',
            pitchAlignment: 'map',
            rotationAlignment: 'map',
          }).setLngLat([lng, lat]).addTo(map);
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
        const marker = new maplibregl.Marker({
          element: el,
          anchor: 'center',
          pitchAlignment: 'map',
          rotationAlignment: 'map',
        }).setLngLat([service.lng, service.lat]).addTo(map);
        entry = { kind: 'service', marker, element: el, serviceId: service.id };
        entriesRef.current.set(key, entry);
      } else {
        entry.marker.setLngLat([service.lng, service.lat]);
        applyServiceStyle(entry.element, service, isSelected, isHovered);
      }
    });

    // Eliminar entries que ya no están en clusters
    for (const [key, entry] of entriesRef.current) {
      if (!aliveKeys.has(key)) {
        entry.marker.remove();
        entriesRef.current.delete(key);
      }
    }

    requestAnimationFrame(() => syncAllMarkerOffsets());

    // Cleanup total al desmontar
    return () => {
      // No limpiar aquí — sólo al unmount real (gestionado por el cleanup del unmount effect abajo).
    };
    // ✅ Importante: no incluir hovered/selected aquí.
  }, [map, clusters, supercluster, syncAllMarkerOffsets]);

  /** Recalcula offset en bordes al mover/zoom el mapa. */
  useEffect(() => {
    if (!map) return;
    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => syncAllMarkerOffsets());
    };
    map.on('move', schedule);
    map.on('zoom', schedule);
    map.on('resize', schedule);
    schedule();
    return () => {
      cancelAnimationFrame(raf);
      map.off('move', schedule);
      map.off('zoom', schedule);
      map.off('resize', schedule);
    };
  }, [map, syncAllMarkerOffsets]);

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
    requestAnimationFrame(() => syncAllMarkerOffsets());
  }, [map, selectedServiceId, hoveredServiceId, syncAllMarkerOffsets]);

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
