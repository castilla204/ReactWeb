import React, { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  ESCROW_TRUST_CHIP_HEADLINE,
  ESCROW_TRUST_DESKTOP_PANEL_BODY,
  ESCROW_TRUST_DESKTOP_PANEL_HEADLINE,
  ESCROW_TRUST_PANEL_BODY,
  ESCROW_TRUST_PANEL_CTA,
  ESCROW_TRUST_PANEL_HEADLINE,
  ESCROW_TRUST_PANEL_PROOF,
  ESCROW_TRUST_TAGLINE,
} from '../constants/escrowCopy';

export function hasCookieConsent(): boolean {
  if (typeof window === 'undefined') return true;
  return Boolean(localStorage.getItem('cookie-consent'));
}

export const TRUST_EASE = 'ease-[cubic-bezier(0.22,1,0.36,1)]';

export type TrustPanelVariant = 'mobile' | 'desktop';

export function TrustPanelBody({
  onClose,
  variant = 'mobile',
}: {
  onClose: () => void;
  variant?: TrustPanelVariant;
}) {
  const isDesktop = variant === 'desktop';

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 pt-0.5">
          {isDesktop ? (
            <>
              <p className="font-display text-lead font-semibold leading-tight tracking-[-0.015em] text-ink-strong">
                {ESCROW_TRUST_DESKTOP_PANEL_HEADLINE}
              </p>
              <p className="mt-1.5 text-meta leading-relaxed text-pretty text-ink-muted">
                {ESCROW_TRUST_TAGLINE}. {ESCROW_TRUST_DESKTOP_PANEL_BODY}
              </p>
            </>
          ) : (
            <>
              <p className="text-caption font-semibold text-brand">
                {ESCROW_TRUST_CHIP_HEADLINE}
              </p>
              <p className="mt-1 text-lead font-semibold leading-tight tracking-[-0.015em] text-ink-strong text-pretty">
                {ESCROW_TRUST_PANEL_HEADLINE}
              </p>
              <p className="mt-1.5 text-meta leading-relaxed text-pretty text-ink-muted">
                {ESCROW_TRUST_PANEL_BODY}
              </p>
              <p className="mt-1 text-meta leading-relaxed text-pretty text-ink-muted">
                {ESCROW_TRUST_PANEL_PROOF}
              </p>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-tinted hover:text-ink-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" strokeWidth={2.1} aria-hidden />
        </button>
      </div>

      <Link
        to="/help#como-funciona"
        onClick={onClose}
        className="mt-4 inline-flex text-meta font-semibold text-brand underline-offset-2 transition-colors hover:text-brand-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      >
        {ESCROW_TRUST_PANEL_CTA}
      </Link>
    </>
  );
}

/** Estado compartido del panel de confianza (desktop popover / móvil sheet). */
export function useTrustPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [cookiesAccepted, setCookiesAccepted] = useState(hasCookieConsent);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    const onConsent = () => setCookiesAccepted(true);
    window.addEventListener('cookieConsentChanged', onConsent);
    return () => window.removeEventListener('cookieConsentChanged', onConsent);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.dataset.drawerOpen = 'trust';
      triggerRef.current?.blur();
    } else if (document.body.dataset.drawerOpen === 'trust') {
      delete document.body.dataset.drawerOpen;
    }
    return () => {
      if (document.body.dataset.drawerOpen === 'trust') {
        delete document.body.dataset.drawerOpen;
      }
    };
  }, [isOpen]);

  return {
    isOpen,
    setIsOpen,
    cookiesAccepted,
    triggerRef,
    panelId,
    toggle: () => setIsOpen((prev) => !prev),
    close: () => setIsOpen(false),
  };
}

interface TrustDesktopPopoverProps {
  isOpen: boolean;
  panelId: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

/** Popover desktop reutilizable (ola / chip hero). */
export function TrustDesktopPopover({
  isOpen,
  panelId,
  onClose,
  children,
  className,
}: TrustDesktopPopoverProps) {
  return (
    <div className={cn('relative font-display', className)}>
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 cursor-default bg-ink-strong/[0.04] motion-reduce:transition-none"
          aria-label="Cerrar información de pago retenido"
          onClick={onClose}
        />
      )}

      {isOpen && (
        <div
          id={panelId}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${panelId}-title`}
          className={cn(
            'absolute bottom-[calc(100%+0.75rem)] right-0 z-40 w-[min(22rem,calc(100vw-2.5rem))]',
            'rounded-2xl border border-line bg-surface p-5',
            'shadow-[0_8px_32px_rgba(15,23,42,0.12)]',
            'animate-in fade-in slide-in-from-bottom-2 duration-200 motion-reduce:animate-none',
            TRUST_EASE,
          )}
        >
          <p id={`${panelId}-title`} className="sr-only">
            Pago retenido
          </p>
          <TrustPanelBody onClose={onClose} variant="desktop" />
        </div>
      )}

      <div
        className={cn(
          'transition-opacity duration-200 motion-reduce:transition-none',
          isOpen && 'pointer-events-none opacity-0',
        )}
        aria-hidden={isOpen}
      >
        {children}
      </div>
    </div>
  );
}
