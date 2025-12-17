import React from 'react';
import { getCountryName, getCountryFlagUrl, isValidCountryCode } from '../utils/countries';

interface CountryFlagProps {
  countryCode: string | null | undefined;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: { width: 20, height: 15 },
  md: { width: 24, height: 18 },
  lg: { width: 32, height: 24 },
};

/**
 * Componente reutilizable para mostrar la bandera de un país
 * 
 * @example
 * <CountryFlag countryCode="ES" showName size="md" />
 * <CountryFlag countryCode={expertProfile.country} />
 */
export function CountryFlag({ 
  countryCode, 
  showName = false,
  size = 'md',
  className = ''
}: CountryFlagProps) {
  // Caso 1: No hay código de país
  if (!countryCode) {
    if (showName) {
      return (
        <span className={`text-gray-400 text-sm ${className}`}>
          País no disponible
        </span>
      );
    }
    return null;
  }

  // Caso 2: Código inválido
  if (!isValidCountryCode(countryCode)) {
    if (showName) {
      return (
        <span className={`text-gray-400 text-sm ${className}`}>
          {countryCode} (código inválido)
        </span>
      );
    }
    return null;
  }

  // Caso 3: Todo OK
  const code = countryCode.toUpperCase();
  const dimensions = SIZE_MAP[size];
  const flagUrl = getCountryFlagUrl(countryCode, dimensions.width);
  const countryName = getCountryName(countryCode);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src={flagUrl || undefined}
        alt={countryName}
        className="object-cover border border-gray-200 country-flag-img"
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
        }}
        onError={(e) => {
          // Si la imagen no carga, mostrar el código como fallback
          const target = e.currentTarget;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent && !parent.querySelector('.flag-fallback')) {
            const fallback = document.createElement('span');
            fallback.className = 'flag-fallback text-xs text-gray-500';
            fallback.textContent = code;
            parent.appendChild(fallback);
          }
        }}
      />
      {showName && (
        <span className="text-sm text-gray-700">
          {countryName}
        </span>
      )}
    </div>
  );
}

export default CountryFlag;

