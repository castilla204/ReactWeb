import React from 'react';
import { ESCROW_TRUST_TAGLINE } from '../constants/escrowCopy';

interface EscrowTrustLineProps {
  align?: 'start' | 'center';
  className?: string;
}

/** Línea de confianza escrow — icono de la app + copy unificado. */
export function EscrowTrustLine({ align = 'start', className = '' }: EscrowTrustLineProps) {
  return (
    <p
      className={[
        'flex gap-1.5 text-xs leading-relaxed text-[#6a6a6a]',
        align === 'center' ? 'items-center justify-center text-center' : 'items-start',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <img
        src="/favicon.png"
        alt=""
        width={14}
        height={14}
        decoding="async"
        className={`h-3.5 w-3.5 shrink-0 rounded-[3px] object-contain ${align === 'start' ? 'mt-0.5' : ''}`}
        aria-hidden
      />
      {ESCROW_TRUST_TAGLINE}
    </p>
  );
}
