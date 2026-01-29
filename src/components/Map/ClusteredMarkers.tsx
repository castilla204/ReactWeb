import React from 'react';
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
  // Renderizar todos los marcadores directamente
  // Si hay muchos servicios, el navegador los manejará
  // El clustering se puede agregar más adelante si es necesario
  return (
    <>
      {services.map((service) => (
        <ServiceMarker
          key={service.id}
          service={service}
          isSelected={selectedServiceId === service.id}
          onClick={onServiceClick}
        />
      ))}
    </>
  );
};

