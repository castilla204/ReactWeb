import React, { useMemo } from 'react';
import { ServiceMarker } from './ServiceMarker';
import { Service } from '../../hooks/useServiceLoader';

interface ClusteredMarkersProps {
  services: Service[];
  selectedServiceId?: number | null;
  onServiceClick?: (service: Service) => void;
}

/**
 * Componente que renderiza marcadores de servicios
 * Por ahora renderiza todos los marcadores directamente
 * El clustering se puede agregar más adelante si es necesario
 */
export const ClusteredMarkers: React.FC<ClusteredMarkersProps> = ({
  services,
  selectedServiceId,
  onServiceClick,
}) => {
  // ✅ DEDUPLICAR servicios por id (solo id, no posición, para evitar duplicados reales)
  // Si hay duplicados con el mismo id, mantener solo uno
  const uniqueServices = useMemo(() => {
    console.log(`🔍 ClusteredMarkers: Recibidos ${services.length} servicios para renderizar`);
    const seen = new Map<number, Service>();
    let duplicatesCount = 0;
    let invalidServicesCount = 0;
    
    services.forEach(service => {
      if (!service || !service.id || isNaN(service.id)) {
        invalidServicesCount++;
        return;
      }
      
      // Si ya existe un servicio con este id, mantener solo uno
      if (!seen.has(service.id)) {
        seen.set(service.id, service);
      } else {
        duplicatesCount++;
        // Si hay duplicado, loguear pero no agregar
        const existing = seen.get(service.id);
        if (existing && (existing.lat !== service.lat || existing.lng !== service.lng)) {
          console.warn('⚠️ ClusteredMarkers: Servicio duplicado con id pero diferente posición:', {
            id: service.id,
            existing: { lat: existing.lat, lng: existing.lng },
            new: { lat: service.lat, lng: service.lng }
          });
        } else {
          console.warn('⚠️ ClusteredMarkers: Servicio duplicado detectado (mismo id y posición), ignorando:', service.id);
        }
      }
    });
    
    const unique = Array.from(seen.values());
    if (duplicatesCount > 0) {
      console.log(`⚠️ ClusteredMarkers: ${duplicatesCount} servicios duplicados filtrados`);
    }
    if (invalidServicesCount > 0) {
      console.log(`⚠️ ClusteredMarkers: ${invalidServicesCount} servicios inválidos filtrados`);
    }
    console.log(`✅ ClusteredMarkers: Renderizando ${unique.length} servicios únicos (de ${services.length} recibidos)`);
    return unique;
  }, [services]);

  // Renderizar todos los marcadores directamente
  // Si hay muchos servicios, el navegador los manejará
  // El clustering se puede agregar más adelante si es necesario
  // ✅ Usar key única basada en id para que React pueda identificar correctamente cada marcador
  return (
    <>
      {uniqueServices.map((service) => {
        // Validación adicional antes de renderizar
        if (!service || !service.id || isNaN(service.id) || isNaN(service.lat) || isNaN(service.lng)) {
          console.warn('⚠️ ClusteredMarkers: Intentando renderizar servicio inválido:', service);
          return null;
        }
        return (
          <ServiceMarker
            key={`service-${service.id}`} // ✅ Key única y estable
            service={service}
            isSelected={selectedServiceId === service.id}
            onClick={onServiceClick}
          />
        );
      })}
    </>
  );
};

