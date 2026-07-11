import React from 'react';
import { Star } from 'lucide-react';
import { SD_DESKTOP_STICKY_TOP_CLASS } from '../../constants/homepageTypography';
import { CheckoutReserveHint } from './CheckoutReserveGuide';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { VerifiedBadge } from '../ui/VerifiedBadge';

interface CheckoutPaymentAsideProps {
  priceDisplay: React.ReactNode;
  canPay: boolean;
  isProcessing: boolean;
  onPay: () => void;
  /** Dentro de la tarjeta sticky del sidebar desktop (sin sticky propio). */
  embedded?: boolean;
  expertName?: string;
  expertPicture?: string;
  serviceName?: string;
  /** Valoración media del experto — refuerza confianza en el momento de pagar. */
  expertRating?: number;
  expertReviewCount?: number;
  /**
   * Aviso opcional bajo el Total cuando el importe mostrado está convertido a la divisa preferida
   * del usuario (p.ej. "≈ 115 $ · cargo en EUR"). El cobro real lo hace Stripe en la divisa del
   * servicio; sin este aviso, el usuario ve un número/divisa distintos al de su extracto bancario.
   * El móvil ya lo muestra vía CheckoutSummaryTable; esto cierra el hueco del panel desktop.
   */
  priceSubline?: React.ReactNode;
  /** Modo de coordinación — adapta la nota de cobro (self vs vendedor). */
  coordinationMode?: 'self' | 'seller';
}

/** Panel de pago desktop — más informativo. */
export function CheckoutPaymentAside({
  priceDisplay,
  canPay,
  isProcessing,
  onPay,
  embedded = false,
  expertName = 'Experto',
  expertPicture,
  serviceName = 'Servicio',
  expertRating,
  expertReviewCount,
  priceSubline,
  coordinationMode = 'self',
}: CheckoutPaymentAsideProps) {
  const ratingLabel =
    expertRating != null && expertRating > 0 && (expertReviewCount ?? 0) > 0
      ? expertRating.toFixed(1).replace('.', ',')
      : null;

  const content = (
    <>
      <section className={embedded ? 'px-5 py-5 bg-white' : 'px-3.5 py-3 bg-white rounded-lg shadow-sm'}>
        <h2 className={`text-[13px] font-medium text-[#6a6a6a] mb-3`}>Resumen del pago</h2>
        <div className="flex items-center gap-3 mb-4">
          <div className="relative shrink-0">
            <Avatar className="h-10 w-10 rounded-full">
              <AvatarImage src={expertPicture} alt={expertName} />
              <AvatarFallback className="rounded-full bg-[#1c1c1c] text-[11px] font-semibold text-white">
                {expertName.charAt(0) || 'E'}
              </AvatarFallback>
            </Avatar>
            <VerifiedBadge className="absolute -bottom-0.5 -right-0.5 h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-[#1c1c1c] truncate">{serviceName}</p>
            <p className="flex items-center gap-1.5 text-[11px] text-[#64748b]">
              <span className="truncate">{expertName}</span>
              {ratingLabel ? (
                <>
                  <span className="text-[#d4d4d4]" aria-hidden>
                    ·
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-0.5 font-semibold tabular-nums text-[#1c1c1c]">
                    <Star className="h-3 w-3 fill-[#F59E0B] text-[#F59E0B]" aria-hidden />
                    {ratingLabel}
                    <span className="font-normal text-[#64748b]">({expertReviewCount})</span>
                  </span>
                </>
              ) : null}
            </p>
          </div>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-t border-[#ebebeb] pt-4">
          <p className="text-[13px] text-[#6a6a6a]">Total a pagar</p>
          <p className="font-display text-xl font-semibold tabular-nums leading-none tracking-[-0.02em] text-[#1c1c1c]">
            {priceDisplay}
          </p>
        </div>
        <p className="mt-1 text-[11px] text-[#64748b]">Impuestos incluidos</p>
        {priceSubline ? (
          <p className="mt-0.5 text-[11px] text-[#64748b]">{priceSubline}</p>
        ) : null}
      </section>

      <footer className={embedded ? 'space-y-4 border-t border-[#ebebeb] px-5 py-5' : 'space-y-3 border-t border-[#f5f5f5] px-3.5 py-3'}>
        {!canPay ? (
          <p className="text-xs text-amber-800 bg-amber-50 p-2 rounded-md">
            Este experto no puede recibir contrataciones ahora.
          </p>
        ) : null}

        <button
          onClick={onPay}
          disabled={!canPay || isProcessing}
          type="button"
          aria-busy={isProcessing}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#171717] px-7 text-[14px] font-semibold text-white transition-colors hover:bg-[#2a2d33] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <svg className="h-4 w-4 animate-spin inline mr-1.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Procesando…
            </>
          ) : (
            <>
              Reservar y pagar
              <svg className="ml-1.5 h-3.5 w-3.5 shrink-0 translate-y-[1px] opacity-70" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3.5" y="8" width="13" height="8.5" rx="1.5" />
                <path d="M6.5 8V5.5a3.5 3.5 0 117 0V8" />
              </svg>
            </>
          )}
        </button>

        <CheckoutReserveHint coordinationMode={coordinationMode} />

        <p className="text-center text-[11px] text-[#64748b]">
          Al reservar, aceptas los{' '}
          <a
            href="/terms.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand hover:text-brand-hover transition-colors"
          >
            Términos de servicio
          </a>
        </p>
      </footer>
    </>
  );

  if (embedded) {
    return (
      <div className="w-full shrink-0 rounded-2xl border border-[#ebebeb] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        {content}
      </div>
    );
  }

  return (
    <aside className={`lg:sticky lg:self-start ${SD_DESKTOP_STICKY_TOP_CLASS}`}>
      <div className="rounded-2xl border border-[#ebebeb] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        {content}
      </div>
    </aside>
  );
}
