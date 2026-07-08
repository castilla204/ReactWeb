import { useEffect, useState } from 'react';

/** Umbral px: por debajo = teclado virtual abierto. */
const KEYBOARD_OPEN_DELTA_PX = 80;

export interface KeyboardViewport {
  height: number;
  top: number;
}

/**
 * Mide el visualViewport cuando el teclado virtual tapa parte de la pantalla.
 *
 * `index.html` declara `interactive-widget=resizes-content`, así que en Chrome/Android
 * el layout viewport ya encoge solo y `100dvh` basta: aquí devolvemos `null`.
 * Safari/iOS todavía no implementa `interactive-widget` (solo encoge el visual
 * viewport), así que allí devolvemos alto y desplazamiento para que un contenedor
 * `position: fixed; inset: 0` no quede por debajo del teclado.
 *
 * Solo debe aplicarse a elementos que no lleven `transform` propio: superponer esto
 * a un drawer con gesto de arrastre hace que dos sistemas peleen por el mismo nodo.
 */
export function useKeyboardViewport(active: boolean): KeyboardViewport | null {
  const [viewport, setViewport] = useState<KeyboardViewport | null>(null);

  useEffect(() => {
    if (!active || typeof window === 'undefined') {
      setViewport(null);
      return;
    }

    const vv = window.visualViewport;

    const update = () => {
      const visibleHeight = vv?.height ?? window.innerHeight;
      const offsetTop = vv?.offsetTop ?? 0;
      const keyboardOpen = window.innerHeight - visibleHeight > KEYBOARD_OPEN_DELTA_PX;

      setViewport(
        keyboardOpen ? { height: Math.round(visibleHeight), top: Math.round(offsetTop) } : null,
      );
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
      setViewport(null);
    };
  }, [active]);

  return viewport;
}
