import React from 'react';
import { Lock } from 'lucide-react';
import { cn } from '../lib/utils';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from './ui/sheet';
import { ESCROW_TRUST_TAGLINE } from '../constants/escrowCopy';
import {
  TRUST_EASE,
  TrustDesktopPopover,
  TrustPanelBody,
  useTrustPanel,
} from './homepageTrustShared';

export type HomepageTrustVariant = 'mobile-fab' | 'hero-desktop';

interface HomepageTrustChipProps {
  variant: HomepageTrustVariant;
  className?: string;
}

/**
 * Chip de confianza chupachups — disco verde + pastilla (izq. plana, der. redonda).
 * `mobile-fab`: compacto flotante. `hero-desktop`: variante legacy con caja propia.
 */
export const HomepageTrustChip: React.FC<HomepageTrustChipProps> = ({
  variant,
  className,
}) => {
  const { isOpen, setIsOpen, cookiesAccepted, triggerRef, panelId, toggle, close } = useTrustPanel();
  const isHeroDesktop = variant === 'hero-desktop';

  if (!cookiesAccepted) return null;

  const chipButton = (
    <button
      ref={triggerRef}
      type="button"
      onClick={toggle}
      tabIndex={isOpen ? -1 : 0}
      className={cn(
        'homepage-trust-chip group flex min-w-0 items-center text-left',
        'touch-manipulation [-webkit-tap-highlight-color:transparent]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success/40 focus-visible:ring-offset-2',
        'transition-[transform,box-shadow] duration-200',
        TRUST_EASE,
        'hover:-translate-y-px active:scale-[0.99]',
        'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        isOpen && 'ring-2 ring-success/20 ring-offset-2',
        isHeroDesktop && 'w-full max-w-[22rem]',
      )}
      aria-label={`Pago retenido. ${ESCROW_TRUST_TAGLINE}`}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      aria-controls={panelId}
    >
      <span
        className={cn(
          'relative z-10 flex shrink-0 items-center justify-center rounded-full bg-success text-success-foreground',
          'shadow-[0_4px_16px_hsl(var(--success)/0.28)]',
          'transition-[box-shadow] duration-200',
          TRUST_EASE,
          'group-hover:shadow-[0_6px_20px_hsl(var(--success)/0.34)]',
          'ring-2 ring-surface',
          isHeroDesktop ? 'h-12 w-12' : 'h-11 w-11',
        )}
        aria-hidden
      >
        <Lock
          className={cn(isHeroDesktop ? 'h-5 w-5' : 'h-[18px] w-[18px]')}
          strokeWidth={2.25}
        />
      </span>

      <span
        className={cn(
          'min-w-0 flex-1 rounded-l-none border border-line bg-surface',
          'transition-[border-color,box-shadow,background-color] duration-200',
          TRUST_EASE,
          'group-hover:border-success-border group-hover:bg-success-tint',
          isHeroDesktop
            ? [
                '-ml-6 rounded-r-2xl py-2.5 pl-9 pr-4',
                'shadow-[0_4px_24px_rgba(15,23,42,0.06)]',
                'group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]',
                'border-success-border/60 bg-surface/95 backdrop-blur-[6px]',
              ]
            : [
                '-ml-[22px] rounded-r-full py-1.5 pl-[26px] pr-3',
                'shadow-[0_2px_8px_rgba(15,23,42,0.07)]',
                'group-hover:shadow-[0_4px_14px_rgba(15,23,42,0.09)]',
              ],
        )}
      >
        {isHeroDesktop ? (
          <span className="min-w-0 text-pretty">
            <span className="block text-kicker font-semibold text-success">Compra protegida</span>
            <span className="mt-0.5 block font-display text-meta font-semibold leading-tight text-ink-strong">
              Pago retenido
            </span>
            <span className="mt-1 block text-caption leading-snug text-ink">
              {ESCROW_TRUST_TAGLINE}
            </span>
            <span className="mt-1 block text-kicker leading-snug text-ink-muted">
              Peritos verificados · Informe con fotos y vídeo
            </span>
          </span>
        ) : (
          <span className="min-w-0">
            <span className="block truncate font-display text-caption font-semibold leading-tight text-ink-strong">
              Pago retenido
            </span>
            <span className="mt-0.5 block truncate text-kicker leading-tight text-ink-muted">
              Hasta que tú confirmes
            </span>
          </span>
        )}
      </span>
    </button>
  );

  if (isHeroDesktop) {
    return (
      <TrustDesktopPopover isOpen={isOpen} panelId={panelId} onClose={close} className={className}>
        {chipButton}
      </TrustDesktopPopover>
    );
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          id={panelId}
          side="bottom"
          className="flex flex-col gap-0 rounded-t-2xl border-t border-line bg-surface p-0 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 [&>button]:hidden"
        >
          <SheetTitle className="sr-only">Pago retenido</SheetTitle>
          <SheetDescription className="sr-only">
            Información sobre el pago retenido en Inspecciono
          </SheetDescription>
          <TrustPanelBody onClose={close} />
        </SheetContent>
      </Sheet>

      <div
        className={cn(
          'font-display transition-opacity duration-200 motion-reduce:transition-none',
          isOpen && 'pointer-events-none opacity-0',
          className,
        )}
        aria-hidden={isOpen}
      >
        {chipButton}
      </div>
    </>
  );
};

export default HomepageTrustChip;
