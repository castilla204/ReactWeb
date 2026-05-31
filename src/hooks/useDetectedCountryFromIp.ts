import { useEffect, useRef, useState } from 'react';
import {
  fetchCountryFromIpBackend,
  landingFromNavigatorLanguage,
  type MapLandingFromIp,
} from '../utils/detectCountryFromIpClient';
import { readLandingGeoCache, writeLandingGeoCache } from '../utils/landingGeoCache';

/** Máx. espera IP en 1ª visita (coincide ~con el hold del globo). */
const IP_CLIENT_MAX_WAIT_MS = 380;

export type { MapLandingFromIp };

function getInstantLanding(): MapLandingFromIp {
  return readLandingGeoCache() ?? landingFromNavigatorLanguage();
}

/**
 * País para centrar el mapa hero.
 * 1. Cache localStorage 24h (0 ms)
 * 2. Backend /detected-country-from-ip (ya permitido en CSP)
 * 3. Fallback navigator.language o ES
 */
export function useDetectedCountryFromIp() {
  const cachedOnMount = useRef(readLandingGeoCache());
  const [landingTarget, setLandingTarget] = useState<MapLandingFromIp>(getInstantLanding);
  const [isResolved, setIsResolved] = useState(() => cachedOnMount.current != null);
  const [source, setSource] = useState<'cache' | 'backend' | 'locale' | 'fallback'>(
    () => (cachedOnMount.current ? 'cache' : 'locale'),
  );

  useEffect(() => {
    if (cachedOnMount.current) {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const finish = (target: MapLandingFromIp, src: typeof source) => {
      if (cancelled) return;
      writeLandingGeoCache(target);
      setLandingTarget(target);
      setSource(src);
      setIsResolved(true);
    };

    const maxWaitTimer = window.setTimeout(() => {
      if (!cancelled) {
        setLandingTarget((prev) => prev ?? landingFromNavigatorLanguage());
        setIsResolved(true);
        setSource('locale');
      }
    }, IP_CLIENT_MAX_WAIT_MS);

    fetchCountryFromIpBackend(controller.signal)
      .then((result) => finish(result, 'backend'))
      .catch(() => {
        if (!cancelled) {
          setIsResolved(true);
          setSource('locale');
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(maxWaitTimer);
    };
  }, []);

  return {
    landingTarget,
    isResolved,
    source,
  };
}
