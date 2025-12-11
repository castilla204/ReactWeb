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
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm', 
    lg: 'px-4 py-2 text-base'
  };

  const defaultColor = '#6C757D';
  const statusColor = statusInfo?.color || defaultColor;
  
  // Crear colores con transparencia para el fondo
  const backgroundColor = `${statusColor}20`;
  const borderColor = `${statusColor}40`;

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <span
        className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]}`}
        style={{
          backgroundColor,
          color: statusColor,
          border: `1px solid ${borderColor}`
        }}
        title={statusInfo.description || statusInfo.displayName}
      >
        {statusInfo.displayName}
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
