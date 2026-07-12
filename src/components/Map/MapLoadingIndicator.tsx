import React from 'react';

interface MapLoadingIndicatorProps {
  variant?: 'initial' | 'refresh';
  className?: string;
}

/**
 * Indicador de carga del mapa — discreto en refresh, claro en primera carga.
 */
export const MapLoadingIndicator: React.FC<MapLoadingIndicatorProps> = ({
  variant = 'initial',
  className = '',
}) => {
  if (variant === 'refresh') {
    return (
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 z-[900] h-0.5 overflow-hidden ${className}`}
        aria-hidden
      >
        <div className="h-full w-1/3 animate-pulse rounded-full bg-brand" />
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-none absolute left-1/2 top-3 z-[900] -translate-x-1/2 ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-label="Actualizando resultados en el mapa"
    >
      <div className="flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3 py-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.08)] backdrop-blur-md">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand/40 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
        </span>
        <span className="font-display text-xs font-medium text-ink">Buscando expertos…</span>
      </div>
    </div>
  );
};

export default MapLoadingIndicator;
