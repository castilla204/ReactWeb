import React from 'react';
import { AdvancedMarker } from '@vis.gl/react-google-maps';

interface ClusterMarkerProps {
  latitude: number;
  longitude: number;
  pointCount: number;
  onClick: () => void;
}

/**
 * Componente de marcador de cluster (agrupa múltiples marcadores)
 * Diseño similar a Airbnb: círculo con número de elementos
 */
export const ClusterMarker: React.FC<ClusterMarkerProps> = ({
  latitude,
  longitude,
  pointCount,
  onClick,
}) => {
  // Calcular tamaño según cantidad de puntos
  const getClusterSize = (count: number): number => {
    if (count < 10) return 40;
    if (count < 25) return 50;
    if (count < 50) return 60;
    if (count < 100) return 70;
    return 80;
  };

  const size = getClusterSize(pointCount);

  return (
    <AdvancedMarker
      position={{ lat: latitude, lng: longitude }}
      onClick={onClick}
      zIndex={500} // Por encima de marcadores normales pero debajo de seleccionados
    >
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          backgroundColor: '#0066CC',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: pointCount < 100 ? '16px' : '14px',
          fontWeight: '700',
          fontFamily:
            '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          border: '2px solid #ffffff',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        }}
      >
        {pointCount}
      </div>
    </AdvancedMarker>
  );
};

export default React.memo(ClusterMarker);
