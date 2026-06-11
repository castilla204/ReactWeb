import { useEffect, useState } from 'react';

/** Umbral px: por debajo = teclado virtual abierto (iOS/Android). */
const KEYBOARD_OPEN_DELTA_PX = 80;

export interface MobileDrawerKeyboardLayout {
  height: number;
  top: number;
}

/**
 * Ajusta un drawer inferior al visualViewport cuando aparece el teclado móvil.
 * Sin teclado devuelve null (el drawer usa su altura CSS normal).
 */
export function useMobileDrawerKeyboard(active: boolean): MobileDrawerKeyboardLayout | null {
  const [layout, setLayout] = useState<MobileDrawerKeyboardLayout | null>(null);

  useEffect(() => {
    if (!active || typeof window === 'undefined') {
      setLayout(null);
      return;
    }

    const vv = window.visualViewport;

    const update = () => {
      const visibleHeight = vv?.height ?? window.innerHeight;
      const offsetTop = vv?.offsetTop ?? 0;
      const layoutHeight = window.innerHeight;
      const keyboardOpen = layoutHeight - visibleHeight > KEYBOARD_OPEN_DELTA_PX;

      if (keyboardOpen) {
        setLayout({
          height: Math.round(visibleHeight),
          top: Math.round(offsetTop),
        });
      } else {
        setLayout(null);
      }
    };

    update();

    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    vv?.addEventListener('resize', update);
    vv?.addEventListener('scroll', update);

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      vv?.removeEventListener('resize', update);
      vv?.removeEventListener('scroll', update);
      setLayout(null);
    };
  }, [active]);

  return layout;
}
