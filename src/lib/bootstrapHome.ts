import type { QueryClient } from '@tanstack/react-query';
import { HERO_BANNER_AVIF, HERO_BANNER_WEBP, MOBILE_HERO_BANNER_SVG } from '../constants/homepageHeroMap';
import { prefetchHomepageWall } from '../hooks/useHomepageWall';

function isHomePathname(): boolean {
  if (typeof window === 'undefined') return false;
  return ['/'].includes(window.location.pathname);
}

function preloadHeroImages(): void {
  if (!isHomePathname()) return;

  const addPreload = (href: string, type: string) => {
    if (document.querySelector(`link[rel="preload"][href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = href;
    link.type = type;
    link.setAttribute('fetchpriority', 'high');
    document.head.appendChild(link);
  };

  addPreload(HERO_BANNER_AVIF, 'image/avif');
  addPreload(HERO_BANNER_WEBP, 'image/webp');

  if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
    addPreload(MOBILE_HERO_BANNER_SVG, 'image/svg+xml');
  }
}

function resolveBootstrapCountryCode(): string {
  if (typeof navigator !== 'undefined' && navigator.language) {
    const lang = navigator.language.split('-')[1];
    if (lang) return lang.toUpperCase();
  }
  return 'ES';
}

function warmupSecondaryHomeChunksOnIdle(): void {
  if (typeof window === 'undefined') return;

  const warmup = () => {
    void import('../components/AirbnbSearchBar');
    void import('../components/MobileBottomBar');
  };

  if ('requestIdleCallback' in window) {
    (window as Window & { requestIdleCallback: (cb: IdleRequestCallback) => number }).requestIdleCallback(
      () => warmup(),
    );
    return;
  }

  window.setTimeout(warmup, 120);
}

/** Precalienta LCP (hero) y datos del muro antes del primer render de HomePage. */
export function bootstrapHomeCriticalPath(queryClient: QueryClient): void {
  if (!isHomePathname()) return;

  preloadHeroImages();
  void import('../components/HomepageWall');
  warmupSecondaryHomeChunksOnIdle();

  void prefetchHomepageWall(queryClient, {
    categoryId: 3,
    latitude: null,
    longitude: null,
    countryCode: resolveBootstrapCountryCode(),
    locationRange: 50,
    nearbyPage: 1,
    nearbyPageSize: 20,
    popularPage: 1,
    popularPageSize: 20,
    _enabled: true,
  });
}
