import React from 'react';
import { ErrorIllustration, IllustrationVariant } from './ErrorIllustration';

/**
 * Estado de error unificado, minimalista y profesional.
 *
 * Principios (coherentes con la línea visual del producto):
 *  - Sin contornear todo con cajas/bordes: contenido centrado sobre el fondo, mucho aire.
 *  - Ilustración con volumen (no SVG plano), tipografía de marca y botón pill brand.
 *  - NUNCA muestra el mensaje crudo del backend ni trazas: solo copy redactado.
 *  - Opcionalmente una "referencia" discreta (errorCode/traceId) para soporte, no técnica.
 */

export type ErrorStateVariant = IllustrationVariant;

interface ErrorAction {
  label: string;
  onClick: () => void;
}

interface ErrorStateProps {
  variant?: ErrorStateVariant;
  title?: string;
  description?: string;
  primaryAction?: ErrorAction;
  secondaryAction?: ErrorAction;
  /** Referencia discreta para soporte (p. ej. código de error o traceId). */
  reference?: string | null;
  /** Ocupa toda la altura de la ventana. */
  fullScreen?: boolean;
  /** Versión reducida para incrustar dentro de tarjetas/listas. */
  compact?: boolean;
  /** Sustituye la ilustración por un nodo propio (p. ej. un <img> PNG 3D). */
  illustration?: React.ReactNode;
  className?: string;
}

const DEFAULT_COPY: Record<ErrorStateVariant, { title: string; description: string }> = {
  generic: {
    title: 'Algo no ha ido como esperábamos',
    description: 'Ha ocurrido un problema al procesar tu solicitud. Vuelve a intentarlo en unos segundos.',
  },
  notFound: {
    title: 'No encontramos esta página',
    description: 'El enlace puede haber cambiado o el contenido ya no está disponible.',
  },
  serverDown: {
    title: 'Estamos teniendo problemas técnicos',
    description: 'Nuestro equipo ya está al tanto. Vuelve a intentarlo en un momento, por favor.',
  },
  offline: {
    title: 'Sin conexión',
    description: 'Comprueba tu conexión a internet e inténtalo de nuevo.',
  },
};

export const ErrorState: React.FC<ErrorStateProps> = ({
  variant = 'generic',
  title,
  description,
  primaryAction,
  secondaryAction,
  reference,
  fullScreen = true,
  compact = false,
  illustration,
  className = '',
}) => {
  const copy = DEFAULT_COPY[variant];
  const resolvedTitle = title ?? copy.title;
  const resolvedDescription = description ?? copy.description;

  const container = fullScreen
    ? 'flex min-h-screen w-full items-center justify-center px-6 py-12'
    : `flex w-full items-center justify-center px-6 ${compact ? 'py-8' : 'py-14'}`;

  return (
    <div className={`${container} ${className}`}>
      <div className={`flex flex-col items-center text-center ${compact ? 'max-w-xs' : 'max-w-sm'}`}>
        <div className="mb-6 select-none animate-fade-in-up">
          {illustration ?? (
            <ErrorIllustration variant={variant} size={compact ? 120 : 168} />
          )}
        </div>

        <h2
          className={`font-display font-semibold tracking-tight text-gray-900 dark:text-white ${
            compact ? 'text-lg' : 'text-2xl'
          }`}
        >
          {resolvedTitle}
        </h2>

        <p className={`mt-2 leading-relaxed text-gray-500 dark:text-gray-400 ${compact ? 'text-sm' : 'text-[15px]'}`}>
          {resolvedDescription}
        </p>

        {(primaryAction || secondaryAction) && (
          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row">
            {primaryAction && (
              <button
                type="button"
                onClick={primaryAction.onClick}
                className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-brand-foreground shadow-sm transition-colors hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                {primaryAction.label}
              </button>
            )}
            {secondaryAction && (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="rounded-full px-5 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                {secondaryAction.label}
              </button>
            )}
          </div>
        )}

        {reference && (
          <p className="mt-6 text-xs text-gray-400 dark:text-gray-600">
            Referencia: <span className="font-mono">{reference}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default ErrorState;
