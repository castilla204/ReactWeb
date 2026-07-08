import React from 'react';
import { SystemStatusDto } from '../types/searchDetails';
import { getStatusTone, STATUS_TONE_BADGE_CLASSES } from '../utils/statusUtils';

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

  // El tono lo decide statusValue (semántica del front), nunca el hex del seed.
  const colorClasses = STATUS_TONE_BADGE_CLASSES[getStatusTone(statusInfo)];

  return (
    <div className={`inline-flex flex-col ${className} max-w-full`}>
      <span
        className={`inline-flex items-center justify-center rounded-full border font-medium ${sizeClasses[size]} max-w-full overflow-hidden ${colorClasses}`}
        title={statusInfo.description || statusInfo.displayName}
      >
        <span className="truncate leading-tight block max-w-full">{statusInfo.displayName}</span>
      </span>

      {showDescription && statusInfo.description && (
        <span className="mt-1 max-w-xs text-xs text-[#737373]">
          {statusInfo.description}
        </span>
      )}
    </div>
  );
};

export default StatusBadge;
