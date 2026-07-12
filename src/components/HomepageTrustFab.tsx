import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { HomepageTrustChip } from './HomepageTrustChip';
import { CHATBOT_FAB_BOTTOM_WITH_TAB_BAR_CLASS } from '../constants/homepageTypography';
import { useWindowSize } from '../hooks/useWindowSize';

function hasCookieConsent(): boolean {
  if (typeof window === 'undefined') return true;
  return Boolean(localStorage.getItem('cookie-consent'));
}

/** FAB móvil de confianza — desktop usa el chip anclado al hero. */
export const HomepageTrustFab: React.FC = () => {
  const [cookiesAccepted, setCookiesAccepted] = useState(hasCookieConsent);
  const [mobileSearchOverlay, setMobileSearchOverlay] = useState(false);
  const location = useLocation();
  const { width } = useWindowSize();
  const isMobile = width === 0 || width < 768;
  const isHome = location.pathname === '/';

  useEffect(() => {
    const onOverlay = (event: Event) => {
      const active = (event as CustomEvent<{ active?: boolean }>).detail?.active === true;
      setMobileSearchOverlay(active);
    };
    window.addEventListener('mobile-search-overlay', onOverlay);
    return () => window.removeEventListener('mobile-search-overlay', onOverlay);
  }, []);

  useEffect(() => {
    const onConsent = () => setCookiesAccepted(true);
    window.addEventListener('cookieConsentChanged', onConsent);
    return () => window.removeEventListener('cookieConsentChanged', onConsent);
  }, []);

  useEffect(() => {
    setMobileSearchOverlay(false);
  }, [location.pathname]);

  if (!isHome || !isMobile || mobileSearchOverlay || !cookiesAccepted) return null;

  return (
    <div
      className={cn(
        'fixed z-40 left-4 max-w-[calc(100vw-5.5rem)] font-display',
        CHATBOT_FAB_BOTTOM_WITH_TAB_BAR_CLASS,
        'animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none',
      )}
    >
      <HomepageTrustChip variant="mobile-fab" />
    </div>
  );
};

export default HomepageTrustFab;
