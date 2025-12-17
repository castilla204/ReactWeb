import React from 'react';
import { SystemStatusDto } from '../types/searchDetails';

interface StatusBadgeProps {
  statusInfo: SystemStatusDto;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  statusInfo, 
  size = 'md', 
  showDescription = false,
  className = ''
}) => {
  // Validación: si statusInfo es undefined o null, no renderizar nada
  if (!statusInfo) {
    return null;
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-0.5 text-xs', 
    lg: 'px-3 py-1 text-sm'
  };

  // Mapeo de colores más profesionales basado en el color del estado
  const getColorClasses = (color: string) => {
    // Convertir hex a rgb para mejor detección
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    const rgb = hexToRgb(color);
    if (!rgb) return 'bg-gray-100 text-gray-800 border-gray-200';

    // Detectar colores comunes y aplicar clases de Tailwind
    const { r, g, b } = rgb;
    
    // Verde (éxito, completado)
    if (g > r && g > b && g > 150) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    // Azul (pendiente, en proceso)
    if (b > r && b > g && b > 150) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    // Amarillo/Naranja (advertencia, disputa)
    if (r > 150 && g > 100 && b < 100) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    // Rojo (error, cancelado)
    if (r > 150 && g < 100 && b < 100) {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    // Púrpura (especial)
    if (r > 100 && b > 150 && g < 100) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    // Gris por defecto
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const colorClasses = getColorClasses(statusInfo?.color || '#6B7280');

  return (
    <div className={`inline-flex flex-col ${className} max-w-full`}>
      <span
        className={`inline-flex items-center justify-center rounded-full border font-medium ${sizeClasses[size]} max-w-full transition-all overflow-hidden ${colorClasses}`}
        title={statusInfo.description || statusInfo.displayName}
      >
        <span className="truncate leading-tight block max-w-full">{statusInfo.displayName}</span>
      </span>
      
      {showDescription && statusInfo.description && (
        <span className="text-xs text-gray-500 mt-1 max-w-xs">
          {statusInfo.description}
        </span>
      )}
    </div>
  );
};

export default StatusBadge;
