import React from 'react';
import { cn } from '../../lib/utils';

interface ServiceDetailReserveNoteProps {
  className?: string;
}

/** Nota procedural de pago en el panel de reserva desktop. */
export function ServiceDetailReserveNote({ className }: ServiceDetailReserveNoteProps) {
  return (
    <p className={cn('text-meta leading-relaxed text-ink-muted', className)}>
      En el checkout eliges fecha, hora y lugar. Pagas al reservar; el experto cobra
      cuando des el visto bueno al informe.
    </p>
  );
}
