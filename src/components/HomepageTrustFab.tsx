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

/** FAB móvil de confianza — solo home móvil. Desktop usa ola + popover. */
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

  // Móvil: pill en hero (`HomepageMobileHeroTrustPill`). FAB desactivado para no estorbar.
  if (!isHome || !isMobile || mobileSearchOverlay || !cookiesAccepted) return null;

  return null;
};

export default HomepageTrustFab;
