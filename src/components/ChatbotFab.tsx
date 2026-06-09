import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Headset, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { ChatbotPanel } from './supportChat/ChatbotPanel';
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
  const [panelKey, setPanelKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

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

  const toggleOpen = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) setPanelKey((k) => k + 1);
      return next;
    });
  };

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
        {isOpen && <ChatbotPanel key={panelKey} onClose={() => setIsOpen(false)} />}

        <button
          type="button"
          onClick={toggleOpen}
          className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand text-white',
            'shadow-[0_4px_16px_hsl(var(--brand)/0.22)] ring-2 ring-white',
            'transition-[background-color,box-shadow] duration-200 ease-out',
            'hover:bg-brand-hover hover:shadow-[0_6px_20px_hsl(var(--brand)/0.28)]',
            'active:scale-[0.98]',
            'touch-manipulation [-webkit-tap-highlight-color:transparent]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
          )}
          aria-label={isOpen ? 'Cerrar asistente' : 'Abrir asistente de Inspecciono'}
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
