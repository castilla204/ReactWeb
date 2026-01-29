import React from 'react';
import { AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { Service } from '../../hooks/useServiceLoader';

interface ServiceMarkerProps {
  service: Service;
  isSelected?: boolean;
  onClick?: (service: Service) => void;
}

/**
 * Marcador individual de servicio estilo Airbnb
 * Muestra el precio en un badge circular
 */
export const ServiceMarker: React.FC<ServiceMarkerProps> = ({
  service,
  isSelected = false,
  onClick,
}) => {
  const priceText = service.price > 0 ? `€${Math.round(service.price)}` : 'Consultar';

  return (
    <AdvancedMarker
      position={{ lat: service.lat, lng: service.lng }}
      onClick={() => onClick?.(service)}
      zIndex={isSelected ? 1000 : 100}
    >
      <div
        style={{
          background: isSelected ? '#000000' : '#ffffff',
          color: isSelected ? '#ffffff' : 'rgb(34, 34, 34)',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: '700',
          fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          border: isSelected ? 'none' : '1px solid #e5e5e5',
          whiteSpace: 'nowrap',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          transform: isSelected ? 'scale(1.1)' : 'scale(1)',
        }}
      >
        {priceText}
      </div>
    </AdvancedMarker>
  );
};
