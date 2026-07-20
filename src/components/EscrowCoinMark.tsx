import { cn } from '../lib/utils';

interface EscrowCoinMarkProps {
  /** Diámetro de la moneda en px (el disco de fondo lo aporta el contenedor). */
  coinPx?: number;
  /** Pulso del aro al asentar la moneda. Desactívalo en sitios muy densos. */
  withRing?: boolean;
  className?: string;
}

/**
 * Marca de escrow «moneda → depósito».
 *
 * Una moneda € cae y se queda retenida dentro del disco de marca. Sustituye al
 * candado verde (el cliché SSL de «cifrado») por el gesto real del escrow:
 * retenemos tu pago hasta que apruebes el informe. Armoniza con el `Vault` azul
 * de la ola de confianza desktop (HomepageDesktopTrustWave) — la moneda entra al
 * depósito.
 *
 * Se coloca DENTRO de un contenedor `relative` que pinta el disco de fondo
 * (`bg-brand`); esta marca solo dibuja la moneda y el pulso del aro.
 *
 * Motion: al montar reproduce UNA vez la caída + un pulso del aro. El estado por
 * defecto ya es la moneda centrada y quieta, así que con `prefers-reduced-motion`
 * (via `motion-safe:`) simplemente no hay entrada — nunca queda en blanco.
 */
export function EscrowCoinMark({ coinPx = 14, withRing = true, className }: EscrowCoinMarkProps) {
  return (
    <>
      {withRing ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full bg-brand/30 motion-safe:animate-[trust-rail-pulse_2.4s_ease-out_1]"
        />
      ) : null}
      <span
        aria-hidden
        className={cn(
          'relative flex shrink-0 items-center justify-center rounded-full bg-white font-bold leading-none text-brand',
          'motion-safe:animate-[escrow-coin-drop_0.7s_cubic-bezier(0.22,1,0.36,1)_1]',
          className,
        )}
        style={{ width: coinPx, height: coinPx, fontSize: Math.round(coinPx * 0.62) }}
      >
        €
      </span>
    </>
  );
}

export default EscrowCoinMark;
