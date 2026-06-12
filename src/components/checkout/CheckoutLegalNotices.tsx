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
      <p className="text-xs leading-relaxed text-[#595959]">
        <strong className="text-[#1c1c1c]">Conversión bancaria:</strong> Stripe cobra en{' '}
        {sourceCurrency}. Tu banco puede aplicar comisiones distintas; el importe final puede variar
        ligeramente respecto a la estimación.
      </p>
      {showCancellation ? (
        <p className="mt-2 text-xs leading-relaxed text-[#595959]">
          <strong className="text-[#1c1c1c]">Cancelación gratuita</strong> antes de que empiece la
          revisión.{' '}
          <a
            href="/terms.html"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#1c1c1c] underline decoration-brand underline-offset-2 hover:no-underline"
          >
            Ver condiciones
          </a>
        </p>
      ) : (
        <p className="mt-2 text-xs leading-relaxed text-[#595959]">
          <a
            href="/terms.html"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#1c1c1c] underline decoration-brand underline-offset-2 hover:no-underline"
          >
            Ver condiciones
          </a>
        </p>
      )}
    </>
  );

  const boxClass =
    variant === 'plain' ? 'space-y-2' : 'rounded-xl border border-[#e8e8e8] bg-[#fafafa] p-3';

  if (!collapsible) {
    return <div className={boxClass}>{body}</div>;
  }

  return (
    <details className="group" defaultOpen={defaultOpen}>
      <summary className="cursor-pointer list-none text-xs font-medium text-[#6a6a6a] underline-offset-2 hover:text-[#222222] hover:underline [&::-webkit-details-marker]:hidden">
        Condiciones y cancelación
      </summary>
      <div className={variant === 'plain' ? 'mt-2 space-y-2' : `${boxClass} mt-2`}>{body}</div>
    </details>
  );
}
