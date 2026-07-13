import React from 'react';
import { Lock } from 'lucide-react';

import {
  ESCROW_TRUST_CHIP_HEADLINE,
  ESCROW_TRUST_PILL_SUBLINE,
} from '../../constants/escrowCopy';
import { cn } from '../../lib/utils';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '../ui/sheet';
import { TRUST_EASE, TrustPanelBody, useTrustPanel } from '../homepageTrustShared';

/** Cola del pill — chip-deliverable sobre foto (DESIGN.md §5). */
const HERO_TRUST_TAIL_CLASS = cn(
  'flex min-w-0 flex-col justify-center rounded-r-full border border-white/50',
  'bg-white/70 py-0.5 pl-6 pr-2 backdrop-blur-[10px] backdrop-saturate-150',
  'shadow-[0_2px_8px_rgba(15,23,42,0.12)]',
);

/**
 * Pill compacto en el hero móvil — mini «chupachups» de confianza.
 * Sustituye al FAB flotante; un toque abre el panel con el detalle del escrow.
 */
export const HomepageMobileHeroTrustPill: React.FC = () => {
  const { isOpen, setIsOpen, cookiesAccepted, panelId, toggle, close, triggerRef } =
    useTrustPanel();

  if (!cookiesAccepted) return null;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          id={panelId}
          side="bottom"
          className="flex flex-col gap-0 rounded-t-2xl border-t border-line bg-surface p-0 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 [&>button]:hidden"
        >
          <SheetTitle className="sr-only">{ESCROW_TRUST_CHIP_HEADLINE}</SheetTitle>
          <SheetDescription className="sr-only">
            Información sobre la compra protegida en Inspecciono
          </SheetDescription>
          <TrustPanelBody onClose={close} variant="mobile" />
        </SheetContent>
      </Sheet>

      <div
        className={cn(
          'transition-opacity duration-200 motion-reduce:transition-none',
          isOpen && 'pointer-events-none opacity-0',
        )}
        aria-hidden={isOpen}
      >
        <button
          ref={triggerRef}
          type="button"
          onClick={toggle}
          className={cn(
            'group mt-2 inline-flex min-h-[44px] max-w-full items-center py-1 text-left',
            'touch-manipulation [-webkit-tap-highlight-color:transparent]',
            'transition-[transform] duration-200',
            TRUST_EASE,
            'hover:-translate-y-px active:scale-[0.98]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
            'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
          )}
          aria-label={`${ESCROW_TRUST_CHIP_HEADLINE}. ${ESCROW_TRUST_PILL_SUBLINE}`}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-controls={panelId}
        >
          <span
            className={cn(
              'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground',
              'shadow-[0_2px_8px_rgba(15,23,42,0.08)] ring-2 ring-white/90',
              'transition-[box-shadow] duration-200',
              TRUST_EASE,
              'group-hover:shadow-[0_3px_12px_rgba(15,23,42,0.1)]',
            )}
            aria-hidden
          >
            <Lock className="h-4 w-4" strokeWidth={2.25} />
          </span>

          <span
            className={cn(
              HERO_TRUST_TAIL_CLASS,
              '-ml-5 min-h-8',
              'transition-[border-color,box-shadow,background-color] duration-200',
              TRUST_EASE,
              'group-hover:border-success-border/40 group-hover:bg-white/82 group-hover:shadow-[0_3px_12px_rgba(15,23,42,0.1)]',
            )}
          >
            <span className="truncate text-caption font-semibold leading-tight text-success">
              {ESCROW_TRUST_CHIP_HEADLINE}
            </span>
            <span className="truncate text-kicker font-medium leading-tight text-ink-muted">
              {ESCROW_TRUST_PILL_SUBLINE}
            </span>
          </span>
        </button>
      </div>
    </>
  );
};
