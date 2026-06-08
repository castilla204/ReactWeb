import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Headset, X } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  CHATBOT_FAB_BOTTOM_STANDALONE_CLASS,
  CHATBOT_FAB_BOTTOM_WITH_RESERVE_FOOTER_CLASS,
  CHATBOT_FAB_BOTTOM_WITH_TAB_BAR_CLASS,
  CHATBOT_FAB_RIGHT_MOBILE_CLASS,
} from '../constants/homepageTypography';

const HIDDEN_PATH_PREFIXES = ['/admin', '/chat-pre-contratacion', '/mis-mensajes'];

const TAB_BAR_PATHS = new Set(['/', '/explorar', '/busquedas', '/como-funciona']);

const RESERVE_FOOTER_PATH_PREFIXES = ['/service/', '/checkout/'];

function hasMobileTabBar(pathname: string): boolean {
  return TAB_BAR_PATHS.has(pathname) || pathname.startsWith('/busquedas/');
}

function hasMobileReserveFooter(pathname: string): boolean {
  return RESERVE_FOOTER_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function getMobileBottomClass(pathname: string): string {
  if (hasMobileTabBar(pathname)) return CHATBOT_FAB_BOTTOM_WITH_TAB_BAR_CLASS;
  if (hasMobileReserveFooter(pathname)) return CHATBOT_FAB_BOTTOM_WITH_RESERVE_FOOTER_CLASS;
  return CHATBOT_FAB_BOTTOM_STANDALONE_CLASS;
}

function hasCookieConsent(): boolean {
  if (typeof window === 'undefined') return true;
  return Boolean(localStorage.getItem('cookie-consent'));
}

export const ChatbotFab: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cookiesAccepted, setCookiesAccepted] = useState(hasCookieConsent);
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const isHidden = HIDDEN_PATH_PREFIXES.some((path) => location.pathname.startsWith(path));
  const mobileBottomClass = getMobileBottomClass(location.pathname);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onConsent = () => setCookiesAccepted(true);
    window.addEventListener('cookieConsentChanged', onConsent);
    return () => window.removeEventListener('cookieConsentChanged', onConsent);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const goToFaq = useCallback(() => {
    setIsOpen(false);
    navigate('/faq');
  }, [navigate]);

  if (isHidden || !cookiesAccepted) return null;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[54] bg-[#1c1c1c]/6 md:bg-transparent md:pointer-events-none"
          aria-hidden
        />
      )}

      <div
        ref={containerRef}
        className={cn(
          'fixed z-[55] flex flex-col items-end gap-3 font-display',
          CHATBOT_FAB_RIGHT_MOBILE_CLASS,
          'md:right-6',
          `${mobileBottomClass} md:bottom-6`,
        )}
      >
        {isOpen && (
          <div
            className={cn(
              'w-[min(calc(100vw-2rem),19.5rem)] md:w-[min(calc(100vw-3rem),22.5rem)]',
              'overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white',
              'shadow-[0_4px_24px_rgba(15,23,42,0.08)]',
            )}
            role="dialog"
            aria-label="Atención al cliente"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#ebebeb] bg-[#fafafa] px-4 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white"
                  aria-hidden
                >
                  <Headset className="h-4 w-4" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-5 tracking-[-0.01em] text-[#1c1c1c]">
                    ¿Necesitas ayuda?
                  </p>
                  <p className="text-xs leading-4 text-[#6a6a6a]">Estamos aquí para ti</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="sd-icon-btn h-9 w-9 shrink-0 touch-manipulation [-webkit-tap-highlight-color:transparent]"
                aria-label="Cerrar asistente"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-3 px-4 py-4">
              <p className="text-sm leading-[18px] text-[#6a6a6a]">
                Hola, ¿tienes dudas sobre inspecciones, pagos o cómo contratar un experto?
              </p>
              <button
                type="button"
                onClick={goToFaq}
                className={cn(
                  'flex min-h-11 w-full items-center justify-center rounded-full',
                  'bg-brand px-4 py-2.5 text-sm font-semibold text-white',
                  'shadow-[0_4px_16px_hsl(var(--brand)/0.2)]',
                  'transition-colors duration-200 hover:bg-brand-hover',
                  'active:scale-[0.99] touch-manipulation [-webkit-tap-highlight-color:transparent]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
                )}
              >
                Ver preguntas frecuentes
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand text-white',
            'shadow-[0_4px_16px_hsl(var(--brand)/0.22)] ring-2 ring-white',
            'transition-[background-color,box-shadow] duration-200 ease-out',
            'hover:bg-brand-hover hover:shadow-[0_6px_20px_hsl(var(--brand)/0.28)]',
            'active:scale-[0.98]',
            'touch-manipulation [-webkit-tap-highlight-color:transparent]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
          )}
          aria-label={isOpen ? 'Cerrar atención al cliente' : 'Abrir atención al cliente'}
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <X className="h-6 w-6" strokeWidth={2} aria-hidden />
          ) : (
            <Headset className="h-6 w-6" strokeWidth={2} aria-hidden />
          )}
        </button>
      </div>
    </>
  );
};
