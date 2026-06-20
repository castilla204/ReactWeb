import React from 'react';
import {
  SD_DESKTOP_STICKY_TOP_CLASS,
  SD_CHECKOUT_MOBILE_TABLE_CLASS,
  SD_CHECKOUT_MOBILE_META_CLASS,
} from '../../constants/homepageTypography';
import { CheckoutReserveHint } from './CheckoutReserveGuide';

interface CheckoutPaymentAsideProps {
  priceDisplay: React.ReactNode;
  canPay: boolean;
  isProcessing: boolean;
  onPay: () => void;
  /** Dentro de la tarjeta sticky del sidebar desktop (sin sticky propio). */
  embedded?: boolean;
}

/** Panel de pago desktop — minimalista. */
export function CheckoutPaymentAside({
  priceDisplay,
  canPay,
  isProcessing,
  onPay,
  embedded = false,
}: CheckoutPaymentAsideProps) {
  const content = (
    <>
      <section className={embedded ? 'px-4 py-4' : 'px-4 py-4'}>
        <p className={SD_CHECKOUT_MOBILE_META_CLASS}>Total</p>
        <p className="mt-1 font-display text-[1.5rem] font-semibold tabular-nums leading-none tracking-[-0.02em] text-[#1c1c1c]">
          {priceDisplay}
        </p>
        <p className={`mt-1 ${SD_CHECKOUT_MOBILE_META_CLASS}`}>Impuestos incluidos</p>
      </section>

      <footer className="space-y-3 border-t border-[#f5f5f5] px-4 py-4">
        {!canPay ? (
          <p className="text-xs text-amber-800">
            Este experto no puede recibir contrataciones ahora.
          </p>
        ) : null}

        <button
          onClick={onPay}
          disabled={!canPay || isProcessing}
          type="button"
          aria-busy={isProcessing}
          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-brand text-[15px] font-semibold text-white transition-colors hover:bg-brand-hover active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-75"
        >
          {isProcessing ? 'Procesando…' : 'Reservar y pagar'}
        </button>

        <CheckoutReserveHint />

        <p className="text-center">
          <a
            href="/terms.html"
            target="_blank"
            rel="noopener noreferrer"
            className={`${SD_CHECKOUT_MOBILE_META_CLASS} underline decoration-[#d4d4d4] underline-offset-2 hover:no-underline`}
          >
            Condiciones
          </a>
        </p>
      </footer>
    </>
  );

  if (embedded) {
    return <div className="mt-auto w-full shrink-0 border-t border-[#f0f0f0]">{content}</div>;
  }

  return (
    <aside className={`lg:sticky lg:self-start ${SD_DESKTOP_STICKY_TOP_CLASS}`}>
      <article className={`flex flex-col ${SD_CHECKOUT_MOBILE_TABLE_CLASS}`}>{content}</article>
    </aside>
  );
}
