import React from 'react';
import { Lock } from 'lucide-react';
import { ESCROW_TRUST_TAGLINE } from '../constants/escrowCopy';
import { cn } from '../lib/utils';

interface EscrowTrustLineProps {
  align?: 'start' | 'center';
  className?: string;
}

/** Línea de confianza escrow — copy largo con icono discreto (homepage, modales). */
export function EscrowTrustLine({
  align = 'start',
  className = '',
}: EscrowTrustLineProps) {
  return (
    <p
      className={cn(
        'sd-escrow-trust-line flex gap-1.5 text-xs leading-relaxed text-ink-muted',
        align === 'center' ? 'items-center justify-center text-center' : 'items-start',
        className,
      )}
    >
      <Lock
        className={cn(
          'h-3.5 w-3.5 shrink-0 text-ink-muted',
          align === 'start' ? 'mt-0.5' : '',
        )}
        strokeWidth={2}
        aria-hidden
      />
      {ESCROW_TRUST_TAGLINE}
    </p>
  );
}
