import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Headset, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { ChatbotPanel } from './supportChat/ChatbotPanel';
import { Drawer, DrawerContent } from './ui/drawer';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from './ui/sheet';
import { useWindowSize } from '../hooks/useWindowSize';
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
  const location = useLocation();
  const { width } = useWindowSize();
  const isMobile = width === 0 || width < 768;

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

  const handleOpenChange = (open: boolean) => {
    if (open) setPanelKey((k) => k + 1);
    setIsOpen(open);
  };

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
      {isMobile ? (
        <Drawer
          open={isOpen}
          onOpenChange={handleOpenChange}
          shouldScaleBackground={false}
        >
          <DrawerContent
            className="flex h-[92dvh] max-h-[92dvh] min-h-0 flex-col overflow-hidden rounded-t-[1.25rem] border-0 bg-white p-0 shadow-[0_-8px_40px_rgba(15,23,42,0.12)]"
            title="Asistente de Inspecciono"
            description="Respuestas sobre la plataforma"
          >
            <ChatbotPanel
              key={panelKey}
              variant="drawer"
              onClose={() => setIsOpen(false)}
            />
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet open={isOpen} onOpenChange={handleOpenChange}>
          <SheetContent
            side="right"
            className="flex h-full w-full max-w-[24rem] flex-col gap-0 border-l border-[#e8e8e8] bg-white p-0 sm:max-w-[24rem] [&>button]:hidden"
          >
            <SheetTitle className="sr-only">Asistente de Inspecciono</SheetTitle>
            <SheetDescription className="sr-only">
              Respuestas sobre la plataforma
            </SheetDescription>
            <ChatbotPanel
              key={panelKey}
              variant="drawer"
              onClose={() => setIsOpen(false)}
            />
          </SheetContent>
        </Sheet>
      )}

      <div
        className={cn(
          'fixed z-[55] flex flex-col items-end gap-3 font-display',
          CHATBOT_FAB_RIGHT_MOBILE_CLASS,
          'md:right-6',
          `${mobileBottomClass} md:bottom-6`,
          isOpen && 'pointer-events-none opacity-0',
        )}
      >
        <button
          type="button"
          onClick={toggleOpen}
          className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand text-white',
            'shadow-[0_4px_16px_hsl(var(--brand)/0.22)] ring-2 ring-white',
            'transition-[background-color,box-shadow,transform] duration-200 ease-out',
            'hover:bg-brand-hover hover:shadow-[0_6px_22px_hsl(var(--brand)/0.3)]',
            'active:scale-[0.96]',
            'touch-manipulation [-webkit-tap-highlight-color:transparent]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
            !isOpen && 'support-chat-fab-pulse',
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
