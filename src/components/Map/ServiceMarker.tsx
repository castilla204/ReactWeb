import React, { useState } from 'react';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { Service } from '../../hooks/useServiceLoader';
import { useCurrency } from '../../contexts/CurrencyContext';

interface ServiceMarkerProps {
  service: Service;
  isSelected?: boolean;
  onClick?: (service: Service) => void;
}

/**
 * Componente de marcador individual de servicio
 * Estilo Airbnb: precio en etiqueta redondeada
 * Con hover y animaciones suaves
 */
export const ServiceMarker: React.FC<ServiceMarkerProps> = ({
  service,
  isSelected = false,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  // Round 24: convertir a moneda preferida del usuario.
  const { convert, preferredCurrency, hasRate } = useCurrency();
  const sourceCurrency = (service as any).priceCurrency || (service as any).currency || 'EUR';
  const convertedPrice = (service.price > 0 && hasRate(preferredCurrency))
    ? convert(service.price, sourceCurrency, preferredCurrency)
    : service.price;
  const displaySymbol = preferredCurrency === 'USD' ? '$'
    : preferredCurrency === 'GBP' ? '£'
    : preferredCurrency === 'CHF' ? 'CHF '
    : preferredCurrency === 'CAD' ? 'C$'
    : '€';
  const priceText = service.price > 0 ? `${displaySymbol}${Math.round(convertedPrice)}` : 'Consultar';

  // Colores según estado
  const backgroundColor = isSelected ? '#0066CC' : isHovered ? '#f7f7f7' : '#ffffff';
  const textColor = isSelected ? '#ffffff' : 'rgb(34, 34, 34)';
  const scale = isSelected ? 1.1 : isHovered ? 1.05 : 1;

  return (
    <AdvancedMarker
      position={{ lat: service.lat, lng: service.lng }}
      onClick={() => onClick?.(service)}
      zIndex={isSelected ? 1000 : isHovered ? 900 : 100}
    >
      <div
        style={{
          background: backgroundColor,
          color: textColor,
          padding: '6px 14px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: '700',
          fontFamily:
            '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
          boxShadow: isSelected
            ? '0 4px 16px rgba(0,0,0,0.4)'
            : isHovered
            ? '0 3px 10px rgba(0,0,0,0.3)'
            : '0 2px 6px rgba(0,0,0,0.25)',
          border: isSelected ? 'none' : '1.5px solid #e5e5e5',
          whiteSpace: 'nowrap',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: `scale(${scale})`,
          userSelect: 'none',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {priceText}
      </div>
    </AdvancedMarker>
  );
};

export default React.memo(ServiceMarker);
