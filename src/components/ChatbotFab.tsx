import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Headset, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { ChatbotPanel } from './supportChat/ChatbotPanel';
import { Drawer, DrawerContent } from './ui/drawer';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from './ui/sheet';
import { useMobileDrawerKeyboard } from '../hooks/useMobileDrawerKeyboard';
import { useWindowSize } from '../hooks/useWindowSize';
import {
  CHATBOT_FAB_BOTTOM_STANDALONE_CLASS,
  CHATBOT_FAB_BOTTOM_WITH_RESERVE_FOOTER_CLASS,
  CHATBOT_FAB_BOTTOM_WITH_EXPERT_SERVICES_CLASS,
  CHATBOT_FAB_BOTTOM_WITH_TAB_BAR_CLASS,
  CHATBOT_FAB_RIGHT_MOBILE_CLASS,
} from '../constants/homepageTypography';

const HIDDEN_PATH_PREFIXES = [
  '/admin',
  '/chat-pre-contratacion',
  '/mis-mensajes',
  '/service/',
  '/checkout/',
  '/crear-busqueda',
];

const TAB_BAR_PATHS = new Set(['/', '/explorar', '/busquedas', '/como-funciona']);

const RESERVE_FOOTER_PATH_PREFIXES = ['/service/', '/checkout/'];

function hasMobileTabBar(pathname: string): boolean {
  return TAB_BAR_PATHS.has(pathname) || pathname.startsWith('/busquedas/');
}

function hasMobileReserveFooter(pathname: string): boolean {
  return RESERVE_FOOTER_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/** Panel del experto: el FAB tapa barras fijas y el área de trabajo. */
function isExpertPanelRoute(pathname: string): boolean {
  return pathname === '/expert-panel' || pathname.startsWith('/expert-panel/');
}

function getMobileBottomClass(pathname: string, expertServicesFooter: boolean): string {
  if (hasMobileTabBar(pathname)) return CHATBOT_FAB_BOTTOM_WITH_TAB_BAR_CLASS;
  if (hasMobileReserveFooter(pathname)) return CHATBOT_FAB_BOTTOM_WITH_RESERVE_FOOTER_CLASS;
  if (expertServicesFooter) return CHATBOT_FAB_BOTTOM_WITH_EXPERT_SERVICES_CLASS;
  return CHATBOT_FAB_BOTTOM_STANDALONE_CLASS;
}

function hasCookieConsent(): boolean {
  if (typeof window === 'undefined') return true;
  return Boolean(localStorage.getItem('cookie-consent'));
}

export const ChatbotFab: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cookiesAccepted, setCookiesAccepted] = useState(hasCookieConsent);
  const [expertServicesFooter, setExpertServicesFooter] = useState(false);
  const [mobileSearchOverlay, setMobileSearchOverlay] = useState(false);
  const [panelKey, setPanelKey] = useState(0);
  const fabRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const { width } = useWindowSize();
  const isMobile = width === 0 || width < 768;
  const keyboardLayout = useMobileDrawerKeyboard(isMobile && isOpen);

  const isHidden =
    HIDDEN_PATH_PREFIXES.some((path) => location.pathname.startsWith(path))
    || isExpertPanelRoute(location.pathname)
    || mobileSearchOverlay;
  const mobileBottomClass = getMobileBottomClass(location.pathname, expertServicesFooter);

  useEffect(() => {
    const onExpertServicesBar = (event: Event) => {
      const active = (event as CustomEvent<{ active?: boolean }>).detail?.active === true;
      setExpertServicesFooter(active);
    };
    const onMobileSearchOverlay = (event: Event) => {
      const active = (event as CustomEvent<{ active?: boolean }>).detail?.active === true;
      setMobileSearchOverlay(active);
    };
    window.addEventListener('expert-services-mobile-bar', onExpertServicesBar);
    window.addEventListener('mobile-search-overlay', onMobileSearchOverlay);
    return () => {
      window.removeEventListener('expert-services-mobile-bar', onExpertServicesBar);
      window.removeEventListener('mobile-search-overlay', onMobileSearchOverlay);
    };
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setExpertServicesFooter(false);
    setMobileSearchOverlay(false);
  }, [location.pathname]);

  useEffect(() => {
    const onConsent = () => setCookiesAccepted(true);
    window.addEventListener('cookieConsentChanged', onConsent);
    return () => window.removeEventListener('cookieConsentChanged', onConsent);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.dataset.drawerOpen = 'chatbot';
      fabRef.current?.blur();
    } else if (document.body.dataset.drawerOpen === 'chatbot') {
      delete document.body.dataset.drawerOpen;
    }

    return () => {
      if (document.body.dataset.drawerOpen === 'chatbot') {
        delete document.body.dataset.drawerOpen;
      }
    };
  }, [isOpen]);

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
          handleOnly
          autoFocus
        >
          <DrawerContent
            className={cn(
              'flex min-h-0 flex-col overflow-hidden rounded-t-[1.25rem] border-0 p-0 shadow-[0_-8px_40px_rgba(15,23,42,0.12)]',
              !keyboardLayout && 'h-[92dvh] max-h-[92dvh]',
            )}
            noOverlay
            style={{
              backgroundColor: '#ffffff',
              backgroundImage:
                'linear-gradient(90deg, rgba(247,193,75,0.45) 0%, rgba(253,237,205,0.42) 36%, rgba(221,233,250,0.48) 62%, rgba(63,127,224,0.45) 100%)',
              backgroundRepeat: 'no-repeat',
              ...(keyboardLayout
                ? {
                    height: keyboardLayout.height,
                    maxHeight: keyboardLayout.height,
                    top: keyboardLayout.top,
                    bottom: 'auto',
                    transform: 'none',
                  }
                : {}),
            }}
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
          'fixed z-[55] flex flex-col items-end gap-3 font-display transition-opacity duration-200',
          CHATBOT_FAB_RIGHT_MOBILE_CLASS,
          'md:right-6',
          `${mobileBottomClass} md:bottom-6`,
          isOpen && 'pointer-events-none invisible opacity-0',
        )}
        aria-hidden={isOpen}
      >
        <button
          ref={fabRef}
          type="button"
          onClick={toggleOpen}
          tabIndex={isOpen ? -1 : 0}
          className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#161616] text-white',
            'shadow-[0_6px_20px_rgba(0,0,0,0.18)] ring-1 ring-black/5',
            'transition-[background-color,box-shadow,transform] duration-200 ease-out',
            'hover:bg-black hover:shadow-[0_8px_26px_rgba(0,0,0,0.24)] hover:-translate-y-0.5',
            'active:translate-y-0 active:scale-[0.96]',
            'touch-manipulation [-webkit-tap-highlight-color:transparent]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#161616] focus-visible:ring-offset-2',
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
