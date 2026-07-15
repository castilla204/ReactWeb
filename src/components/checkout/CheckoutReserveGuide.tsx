import React from 'react';
import { ShieldCheck, RotateCcw, Lock } from 'lucide-react';

/**
 * Señales de confianza bajo el botón de pago. Antes era un muro de 5 párrafos de letra
 * gris; ahora son 3 filas escaneables con icono (candado / reembolso / cobro diferido),
 * que refuerzan la confianza en el momento de pagar en lugar de diluirla.
 *
 * El mensaje del medio cambia según quién agenda la cita: en modo vendedor lo primero es
 * que el vendedor reserve con el enlace (y si no lo hace, se reembolsa); en modo propio la
 * cita queda al instante y solo falta que el experto la confirme.
 */
interface TrustRow {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  strong: string;
  rest: string;
}

function buildRows(coordinationMode: 'self' | 'seller'): TrustRow[] {
  return [
    {
      icon: ShieldCheck,
      strong: 'Hoy no se te cobra',
      rest: 'solo reservamos el importe en tu tarjeta.',
    },
    {
      icon: RotateCcw,
      strong: coordinationMode === 'seller' ? 'Reembolso garantizado' : 'Se libera solo',
      rest:
        coordinationMode === 'seller'
          ? 'el vendedor elige la cita con el enlace que le enviamos; si no reserva a tiempo, te devolvemos el importe.'
          : 'el cargo se hace al confirmar el experto; si no la confirma, se libera solo. Cancelación gratis antes de empezar.',
    },
    {
      icon: Lock,
      strong: 'Pago seguro con Stripe',
      rest: 'tus datos de tarjeta viajan cifrados (SSL). El experto no cobra hasta que des el visto bueno.',
    },
  ];
}

export const CheckoutReserveHint: React.FC<{
  className?: string;
  coordinationMode?: 'self' | 'seller';
  /** Versión más compacta para el paso de pago móvil (menos scroll antes del CTA). */
  compact?: boolean;
  /** Omite la fila "Hoy no se te cobra" cuando ya aparece en la barra fija inferior del móvil. */
  omitLeadBullet?: boolean;
}> = ({ className = '', coordinationMode = 'self', compact = false, omitLeadBullet = false }) => {
  const rows = omitLeadBullet ? buildRows(coordinationMode).slice(1) : buildRows(coordinationMode);

  return (
    <ul
      className={`m-0 list-none p-0 ${compact ? 'space-y-2.5' : 'space-y-3'} ${className}`.trim()}
      aria-label="Cómo funciona el cobro"
    >
      {rows.map(({ icon: Icon, strong, rest }) => (
        <li key={strong} className="flex items-start gap-2.5">
          <span
            className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/[0.08] text-brand"
            aria-hidden
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
          </span>
          <p className="text-caption leading-snug text-ink-muted">
            <span className="font-semibold text-ink-strong">{strong}</span>: {rest}
          </p>
        </li>
      ))}
    </ul>
  );
};
