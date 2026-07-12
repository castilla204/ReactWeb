import React from 'react';

interface CheckoutLegalNoticesProps {
  sourceCurrency: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  /** Oculta el párrafo de cancelación (ya mostrado arriba en móvil). */
  showCancellation?: boolean;
  /** plain = sin caja (checkout móvil); boxed = card con borde (desktop). */
  variant?: 'boxed' | 'plain';
}

export function CheckoutLegalNotices({
  sourceCurrency,
  collapsible = false,
  defaultOpen = false,
  showCancellation = true,
  variant = 'boxed',
}: CheckoutLegalNoticesProps) {
  const body = (
    <>
      <p className="text-xs leading-relaxed text-ink-muted">
        <strong className="text-ink-strong">Conversión bancaria:</strong> Stripe cobra en{' '}
        {sourceCurrency}. Tu banco puede aplicar comisiones distintas; el importe final puede variar
        ligeramente respecto a la estimación.
      </p>
      {showCancellation ? (
        <p className="mt-2 text-xs leading-relaxed text-ink-muted">
          <strong className="text-ink-strong">Cancelación gratuita</strong> antes de que empiece la
          revisión.{' '}
          <a
            href="/legal/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-ink-strong underline decoration-brand underline-offset-2 hover:no-underline"
          >
            Ver condiciones
          </a>
        </p>
      ) : (
        <p className="mt-2 text-xs leading-relaxed text-ink-muted">
          <a
            href="/legal/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-ink-strong underline decoration-brand underline-offset-2 hover:no-underline"
          >
            Ver condiciones
          </a>
        </p>
      )}
    </>
  );

  const boxClass =
    variant === 'plain' ? 'space-y-2' : 'rounded-xl border border-line bg-surface-tinted p-3';

  if (!collapsible) {
    return <div className={boxClass}>{body}</div>;
  }

  return (
    <details className="group" defaultOpen={defaultOpen}>
      <summary className="cursor-pointer list-none text-xs font-medium text-ink-muted underline-offset-2 hover:text-ink hover:underline [&::-webkit-details-marker]:hidden">
        Condiciones y cancelación
      </summary>
      <div className={variant === 'plain' ? 'mt-2 space-y-2' : `${boxClass} mt-2`}>{body}</div>
    </details>
  );
}
