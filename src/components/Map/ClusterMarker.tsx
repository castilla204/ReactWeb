import React from 'react';
import { AdvancedMarker } from '@vis.gl/react-google-maps';

interface ClusterMarkerProps {
  count: number;
  position: { lat: number; lng: number };
  onClick?: () => void;
}

/**
 * Marcador de cluster que muestra el número de servicios agrupados
 * Estilo similar a Airbnb/Google Maps
 */
export const ClusterMarker: React.FC<ClusterMarkerProps> = ({
  count,
  position,
  onClick,
}) => {
  // Determinar tamaño y color según la cantidad
  const getClusterStyle = (count: number) => {
    if (count < 10) {
      return {
        size: 40,
        fontSize: '12px',
        backgroundColor: '#FF385C',
      };
    } else if (count < 50) {
      return {
        size: 50,
        fontSize: '13px',
        backgroundColor: '#E61E4D',
      };
    } else {
      return {
        size: 60,
        fontSize: '14px',
        backgroundColor: '#D70466',
      };
    }
  };

  const style = getClusterStyle(count);
  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <AdvancedMarker
      position={position}
      onClick={onClick}
      zIndex={200}
    >
      <div
        style={{
          width: style.size,
          height: style.size,
          borderRadius: '50%',
          backgroundColor: style.backgroundColor,
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: style.fontSize,
          fontWeight: '700',
          fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          border: '3px solid #ffffff',
          cursor: 'pointer',
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {displayCount}
      </div>
    </AdvancedMarker>
  );
};
