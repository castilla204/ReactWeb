import React from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import {
  SD_DESKTOP_ASIDE_MAX_H_CLASS,
  SD_DESKTOP_STICKY_TOP_CLASS,
  SD_CHECKOUT_MOBILE_META_CLASS,
} from '../../constants/homepageTypography';
import { ESCROW_CHECKOUT_FOOTER_NOTE } from '../../constants/escrowCopy';

interface CheckoutPaymentAsideProps {
  priceDisplay: React.ReactNode;
  priceSubline?: React.ReactNode;
  showPriceDetails: boolean;
  onTogglePriceDetails: () => void;
  timezoneLabel?: string | null;
  canPay: boolean;
  isProcessing: boolean;
  onPay: () => void;
  legalNotices: React.ReactNode;
}

/** Columna sticky de pago — checkout desktop, sin duplicar resumen del servicio. */
export function CheckoutPaymentAside({
  priceDisplay,
  priceSubline,
  showPriceDetails,
  onTogglePriceDetails,
  timezoneLabel,
  canPay,
  isProcessing,
  onPay,
  legalNotices,
}: CheckoutPaymentAsideProps) {
  return (
    <aside className={`lg:sticky lg:self-start ${SD_DESKTOP_STICKY_TOP_CLASS}`}>
      <article
        className={`flex flex-col overflow-hidden rounded-xl border border-[#dddddd] bg-white ${SD_DESKTOP_ASIDE_MAX_H_CLASS}`}
      >
        <section className="px-5 py-5">
          <p className={SD_CHECKOUT_MOBILE_META_CLASS}>Precio total · impuestos incluidos</p>
          <p className="mt-1 font-display text-[1.625rem] font-semibold leading-none tracking-[-0.02em] tabular-nums text-[#222222]">
            {priceDisplay}
          </p>
          {priceSubline ? (
            <p className={`mt-1.5 ${SD_CHECKOUT_MOBILE_META_CLASS}`}>{priceSubline}</p>
          ) : null}

          <button
            type="button"
            onClick={onTogglePriceDetails}
            className={`mt-2 inline-flex items-center gap-0.5 ${SD_CHECKOUT_MOBILE_META_CLASS} font-medium text-[#222222] hover:text-[#1c1c1c]`}
            aria-expanded={showPriceDetails}
          >
            <ChevronDown
              aria-hidden
              className={`h-3.5 w-3.5 transition-transform ${showPriceDetails ? 'rotate-180' : ''}`}
            />
            {showPriceDetails ? 'Ocultar detalles' : 'Detalles del precio'}
          </button>

          {showPriceDetails ? (
            <div
              className={`mt-3 border-t border-[#ebebeb] pt-3 ${SD_CHECKOUT_MOBILE_META_CLASS}`}
              role="region"
              aria-label="Detalles del precio"
            >
              <p>Impuestos incluidos. El IVA se calcula en Stripe según tu país de facturación.</p>
            </div>
          ) : null}
        </section>

        {timezoneLabel ? (
          <p className="flex items-center gap-1.5 border-t border-[#ebebeb] px-5 py-3 text-xs text-[#6a6a6a]">
            <Globe className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
            Horario del experto: {timezoneLabel}
          </p>
        ) : null}

        <footer className="mt-auto space-y-3 border-t border-[#ebebeb] px-5 py-5">
          {!canPay ? (
            <p className="text-xs text-amber-800">
              Este experto no puede recibir contrataciones ahora.
            </p>
          ) : null}

          <p className={`${SD_CHECKOUT_MOBILE_META_CLASS} leading-snug`}>{ESCROW_CHECKOUT_FOOTER_NOTE}</p>

          <button
            onClick={onPay}
            disabled={!canPay || isProcessing}
            type="button"
            aria-busy={isProcessing}
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-brand text-base font-semibold text-white shadow-[0_4px_16px_hsl(var(--brand)/0.2)] transition-colors hover:bg-brand-hover hover:shadow-[0_8px_24px_hsl(var(--brand)/0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 active:scale-[0.99] disabled:cursor-wait disabled:opacity-75"
          >
            {isProcessing ? 'Procesando…' : 'Reservar'}
          </button>

          {legalNotices}
        </footer>
      </article>
    </aside>
  );
}
