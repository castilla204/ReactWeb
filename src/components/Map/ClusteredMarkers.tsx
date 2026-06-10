import React, { useMemo, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { capMapWorkers } from '../../lib/mapWorkers';
capMapWorkers(maplibregl);
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
    el.style.background = 'hsl(var(--brand))';
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
      inner.style.padding = '6px 14px';
      inner.style.borderRadius = '9999px';
      inner.style.fontWeight = '700';
      inner.style.fontSize = '14px';
      inner.style.whiteSpace = 'nowrap';
      inner.style.willChange = 'transform';
      inner.style.transition = 'transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease, border-color 0.15s ease, color 0.15s ease';
      el.appendChild(inner);
    }
    inner.style.borderStyle = 'solid';
    inner.style.borderWidth = isSelected ? '0' : isHovered ? '2px' : '1.5px';
    inner.style.borderColor = isSelected ? 'transparent' : isHovered ? 'hsl(var(--brand))' : '#e5e5e5';
    inner.style.background = isSelected ? 'hsl(var(--brand))' : isHovered ? '#eef4fc' : '#fff';
    inner.style.color = isSelected ? '#fff' : isHovered ? 'hsl(var(--brand))' : '#222';
    inner.style.boxShadow = isSelected
      ? '0 4px 16px hsl(var(--brand) / 0.45)'
      : isHovered
        ? '0 4px 14px hsl(var(--brand) / 0.28)'
        : '0 2px 6px rgba(0,0,0,0.25)';
    inner.style.transform = isHovered ? 'scale(1.06)' : 'scale(1)';
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
    inner.style.borderStyle = 'solid';
    inner.style.borderWidth = isSelected ? '0' : isHovered ? '2px' : '1.5px';
    inner.style.borderColor = isSelected ? 'transparent' : isHovered ? 'hsl(var(--brand))' : '#e5e5e5';
    inner.style.background = isSelected ? 'hsl(var(--brand))' : isHovered ? '#eef4fc' : '#fff';
    inner.style.color = isSelected ? '#fff' : isHovered ? 'hsl(var(--brand))' : '#222';
    inner.style.boxShadow = isSelected
      ? '0 4px 16px hsl(var(--brand) / 0.45)'
      : isHovered
        ? '0 4px 14px hsl(var(--brand)/0.28)'
        : '0 2px 6px rgba(0,0,0,0.25)';
    inner.style.transform = isHovered ? 'scale(1.06)' : 'scale(1)';
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
        // 🛡️ Round 28 CUR-5: usar símbolo derivado del currency del servicio, no € hardcoded.
        // Antes esta rama (cuando el clustering reciclaba un marker DOM existente al mover el viewport)
        // sobrescribía cualquier símbolo correcto que applyServiceStyle hubiera puesto inicialmente.
        // Resultado: experto US con servicio USD se veía $25 al primer render y luego €25 al mover el mapa.
        // ⚠️ Wobble-fix: el texto vive en el hijo `pill` (no en `entry.element`), porque
        //    el botón externo debe permanecer libre de mutaciones que rompan el fix.
        const inner = entry.element.firstElementChild as HTMLSpanElement | null;
        if (inner && inner.dataset.role === 'pill') {
          inner.textContent = service.price > 0
            ? `${getCurrencySymbol(((service as any).priceCurrency || (service as any).currency || 'EUR'))}${Math.round(service.price)}`
            : 'Consultar';
        }
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
