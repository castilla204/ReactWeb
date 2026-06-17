import { Lock } from 'lucide-react';

/** Señal de confianza bajo el CTA: métodos y procesador, sin logos de marca. */
export function CheckoutSecurePaymentNote({ className = '' }: { className?: string }) {
  return (
    <p
      className={`flex items-center justify-center gap-1.5 text-center text-[11px] leading-snug text-[#6a6a6a] ${className}`.trim()}
    >
      <Lock className="h-3 w-3 shrink-0 text-brand" aria-hidden strokeWidth={2.25} />
      <span>
        Pago seguro con tarjeta, Apple Pay o Google Pay · procesado por{' '}
        <span className="font-semibold text-[#1c1c1c]">Stripe</span>
      </span>
    </p>
  );
}
