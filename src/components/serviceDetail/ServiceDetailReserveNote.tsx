import React from 'react';
import { cn } from '../../lib/utils';

interface ServiceDetailReserveNoteProps {
  /** aside = panel desktop; footer = barra fija móvil encima del precio */
  variant?: 'aside' | 'footer';
  className?: string;
}

/** Nota procedural de pago — aside desktop o barra inferior móvil. */
export function ServiceDetailReserveNote({
  variant = 'footer',
  className,
}: ServiceDetailReserveNoteProps) {
  if (variant === 'aside') {
    return (
      <p className={cn('text-meta leading-relaxed text-ink-muted', className)}>
        En el checkout eliges fecha, hora y lugar. Pagas al reservar; el experto cobra
        cuando des el visto bueno al informe.
      </p>
    );
  }

  return (
    <p
      className={cn(
        'sd-mobile-footer-note text-caption leading-snug text-ink-muted text-pretty',
        className,
      )}
    >
      Pagas al reservar; el experto cobra cuando apruebes el informe.
    </p>
  );
}
