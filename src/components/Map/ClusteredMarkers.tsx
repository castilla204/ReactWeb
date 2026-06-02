import React, { useMemo, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import useSupercluster from 'use-supercluster';
import { Service } from '../../hooks/useServiceLoader';

interface ClusteredMarkersProps {
  map: maplibregl.Map | null;
  services: Service[];
  bounds?: [number, number, number, number];
  zoom?: number;
  selectedServiceId?: number | null;
  onServiceClick?: (service: Service) => void;
  clusterRadius?: number; // Radio de clustering en píxeles
  maxZoom?: number; // Zoom máximo para clustering
  minZoom?: number; // Zoom mínimo
}

/**
 * Componente optimizado con clustering real usando Supercluster
 * - Agrupa marcadores cercanos en clusters
 * - Expande clusters al hacer click
 * - Rendimiento optimizado para miles de marcadores
 * - Compatible con Airbnb/Google Maps
 */
export const ClusteredMarkers: React.FC<ClusteredMarkersProps> = ({
  map,
  services,
  bounds,
  zoom,
  selectedServiceId,
  onServiceClick,
  clusterRadius = 56,
  maxZoom = 17,
  minZoom = 0,
}) => {
  const markersRef = useRef<maplibregl.Marker[]>([]);

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
        // Solo mantener el primero con este ID
        if (!uniqueMap.has(service.id)) {
          uniqueMap.set(service.id, service);
        }
      }
    });

    const uniqueServices = Array.from(uniqueMap.values());

    // Crear puntos GeoJSON
    const geoJsonPoints = uniqueServices.map(service => ({
      type: 'Feature' as const,
      properties: {
        cluster: false,
        serviceId: service.id,
        service: service, // Guardar el servicio completo
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [
          parseFloat(service.lng.toFixed(6)), // Limitar precisión
          parseFloat(service.lat.toFixed(6)),
        ] as [number, number],
      },
    }));

    return geoJsonPoints;
  }, [services]);

  // 3️⃣ Configurar Supercluster
  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom: zoom ?? 12,
    options: {
      radius: clusterRadius, // Radio de agrupación
      maxZoom: maxZoom, // No agrupar más allá de este zoom
      minZoom: minZoom,
      // Opciones adicionales de rendimiento
      extent: 512, // Resolución del tile
      nodeSize: 64, // Tamaño del nodo del árbol (más grande = más rápido)
    },
  });

  // 4️⃣ Dibujar marcadores/clusteres en MapLibre
  useEffect(() => {
    if (!map) return;

    // Limpiar markers previos
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (!clusters || clusters.length === 0) return;

    clusters.forEach((cluster) => {
      const [lng, lat] = cluster.geometry.coordinates as [number, number];
      const { cluster: isCluster, point_count: pointCount } = cluster.properties as any;

      if (isCluster) {
        const clusterEl = document.createElement('button');
        clusterEl.type = 'button';
        clusterEl.style.width = `${Math.min(80, Math.max(40, 36 + Math.log2(pointCount || 1) * 8))}px`;
        clusterEl.style.height = clusterEl.style.width;
        clusterEl.style.borderRadius = '9999px';
        clusterEl.style.background = '#0066CC';
        clusterEl.style.color = '#fff';
        clusterEl.style.border = '2px solid #fff';
        clusterEl.style.fontWeight = '700';
        clusterEl.style.cursor = 'pointer';
        clusterEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)';
        clusterEl.textContent = String(pointCount ?? 0);
        clusterEl.setAttribute('aria-label', `Cluster con ${pointCount} servicios`);

        clusterEl.addEventListener('click', () => {
          if (!supercluster) return;
          // Forzar avance real de zoom para desagrupar visualmente
          const currentZoom = map.getZoom();
          const suggestedZoom = supercluster.getClusterExpansionZoom(cluster.id as number);
          const expansionZoom = Math.max(suggestedZoom, currentZoom + 1);
          map.easeTo({ center: [lng, lat], zoom: expansionZoom, duration: 350 });
        });

        markersRef.current.push(new maplibregl.Marker({ element: clusterEl }).setLngLat([lng, lat]).addTo(map));
        return;
      }

      const service = (cluster.properties as any).service as Service;
      if (!service?.id) return;

      const markerEl = document.createElement('button');
      markerEl.type = 'button';
      markerEl.style.padding = '6px 14px';
      markerEl.style.borderRadius = '9999px';
      markerEl.style.fontWeight = '700';
      markerEl.style.fontSize = '14px';
      markerEl.style.cursor = 'pointer';
      markerEl.style.whiteSpace = 'nowrap';
      markerEl.style.border = selectedServiceId === service.id ? 'none' : '1.5px solid #e5e5e5';
      markerEl.style.background = selectedServiceId === service.id ? '#0066CC' : '#fff';
      markerEl.style.color = selectedServiceId === service.id ? '#fff' : '#222';
      markerEl.style.boxShadow = selectedServiceId === service.id ? '0 4px 16px rgba(0,0,0,0.4)' : '0 2px 6px rgba(0,0,0,0.25)';
      markerEl.textContent = service.price > 0 ? `€${Math.round(service.price)}` : 'Consultar';
      markerEl.setAttribute('aria-label', `Servicio ${service.name}`);
      markerEl.addEventListener('click', () => onServiceClick?.(service));

      markersRef.current.push(new maplibregl.Marker({ element: markerEl }).setLngLat([service.lng, service.lat]).addTo(map));
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    };
  }, [map, clusters, onServiceClick, selectedServiceId, supercluster]);

  return null;
};

// Memoizar el componente para evitar re-renders innecesarios
export default React.memo(ClusteredMarkers);
