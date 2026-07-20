import { useEffect, useState } from 'react';

/**
 * Viewport < breakpoint (por defecto 768px, Tailwind md). Una sola suscripción
 * resize por árbol. Pasa un breakpoint distinto para alinear con el punto de
 * corte CSS real del componente que consume el hook (p.ej. 900 para que
 * coincida con `@media (min-width: 900px)` del panel de experto).
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < breakpoint;
    }
    return false;
  });

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [breakpoint]);

  return isMobile;
}
