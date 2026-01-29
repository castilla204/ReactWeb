import React, { useMemo, useCallback } from 'react';
import { useMap, AdvancedMarker } from '@vis.gl/react-google-maps';
import useSupercluster from 'use-supercluster';
import { Service } from '../../hooks/useServiceLoader';
import { ServiceMarker } from './ServiceMarker';
import { ClusterMarker } from './ClusterMarker';

interface ClusteredMarkersProps {
  services: Service[];
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
  services,
  selectedServiceId,
  onServiceClick,
  clusterRadius = 75, // Similar a Airbnb
  maxZoom = 16, // Dejar de agrupar en zoom 17+
  minZoom = 0,
}) => {
  const map = useMap();

  // 1️⃣ Convertir servicios a formato GeoJSON para Supercluster
  const points = useMemo(() => {
    if (!services || services.length === 0) {
      return [];
    }

    console.log(`🗺️ ClusteredMarkers: Procesando ${services.length} servicios para clustering`);

    // Validar y deduplicar por ID antes de crear puntos
    const uniqueMap = new Map<number, Service>();
    services.forEach(service => {
      if (
        service &&
        service.id &&
        !isNaN(service.id) &&
        service.lat &&
        service.lng &&
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

    if (uniqueServices.length !== services.length) {
      console.warn(
        `⚠️ ClusteredMarkers: Filtrados ${services.length - uniqueServices.length} servicios duplicados/inválidos`
      );
    }

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

    console.log(`✅ ClusteredMarkers: ${geoJsonPoints.length} puntos únicos creados para clustering`);
    return geoJsonPoints;
  }, [services]);

  // 2️⃣ Obtener bounds y zoom del mapa
  const bounds = map?.getBounds();
  const zoom = map?.getZoom();

  const mapBounds = useMemo(() => {
    if (!bounds) return undefined;

    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    return [
      sw.lng(), // west
      sw.lat(), // south
      ne.lng(), // east
      ne.lat(), // north
    ] as [number, number, number, number];
  }, [bounds]);

  // 3️⃣ Configurar Supercluster
  const { clusters, supercluster } = useSupercluster({
    points,
    bounds: mapBounds,
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

  // 4️⃣ Handler para expandir clusters
  const handleClusterClick = useCallback(
    (clusterId: number, latitude: number, longitude: number) => {
      if (!map || !supercluster) return;

      try {
        // Obtener el zoom de expansión del cluster
        const expansionZoom = Math.min(
          supercluster.getClusterExpansionZoom(clusterId),
          maxZoom
        );

        // Animar hacia el cluster
        map.panTo({ lat: latitude, lng: longitude });
        
        // Hacer zoom con animación suave
        setTimeout(() => {
          map.setZoom(expansionZoom);
        }, 200);

        console.log(`🔍 Expandiendo cluster ${clusterId} a zoom ${expansionZoom}`);
      } catch (error) {
        console.error('Error expandiendo cluster:', error);
      }
    },
    [map, supercluster, maxZoom]
  );

  // 5️⃣ Renderizar clusters y marcadores
  if (!clusters || clusters.length === 0) {
    return null;
  }

  console.log(
    `🎯 ClusteredMarkers: Renderizando ${clusters.length} elementos (clusters + marcadores individuales)`
  );

  return (
    <>
      {clusters.map((cluster) => {
        const [lng, lat] = cluster.geometry.coordinates;
        const { cluster: isCluster, point_count: pointCount } = cluster.properties;

        // SI ES UN CLUSTER
        if (isCluster) {
          return (
            <ClusterMarker
              key={`cluster-${cluster.id}`}
              latitude={lat}
              longitude={lng}
              pointCount={pointCount}
              onClick={() => handleClusterClick(cluster.id as number, lat, lng)}
            />
          );
        }

        // SI ES UN MARCADOR INDIVIDUAL
        const service = cluster.properties.service as Service;

        if (!service || !service.id) {
          console.warn('⚠️ Servicio inválido en cluster:', cluster);
          return null;
        }

        return (
          <ServiceMarker
            key={`service-${service.id}`}
            service={service}
            isSelected={selectedServiceId === service.id}
            onClick={onServiceClick}
          />
        );
      })}
    </>
  );
};

// Memoizar el componente para evitar re-renders innecesarios
export default React.memo(ClusteredMarkers);
