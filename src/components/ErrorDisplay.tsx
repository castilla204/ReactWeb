import React from 'react';
import { ErrorState } from './feedback/ErrorState';

/**
 * Wrapper de compatibilidad: muchas páginas ya importan <ErrorDisplay />.
 * Ahora delega en el estado de error unificado (minimalista, con ilustración con
 * volumen) conservando la misma API para no romper a los consumidores existentes.
 */
interface ErrorDisplayProps {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  fullScreen?: boolean;
  compact?: boolean;
  /** Obsoleto: se mantiene por compatibilidad de firma; el nuevo diseño es siempre limpio. */
  noBackground?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  message = 'Ha ocurrido un error inesperado',
  onRetry,
  retryLabel = 'Reintentar',
  className = '',
  fullScreen = true,
  compact = false,
}) => (
  <ErrorState
    variant="generic"
    title="Algo no ha ido bien"
    description={message}
    fullScreen={fullScreen}
    compact={compact}
    className={className}
    primaryAction={onRetry ? { label: retryLabel, onClick: onRetry } : undefined}
  />
);
