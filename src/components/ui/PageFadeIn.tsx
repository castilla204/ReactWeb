import { type ReactNode } from 'react';

/**
 * Envuelve el contenido REAL de una ruta para que aparezca con un fundido suave al
 * montarse (justo cuando el chunk lazy termina de cargar y el skeleton se retira),
 * en lugar de un corte seco skeleton → página.
 *
 * Decisiones clave:
 * - **El contenido es visible por defecto (opacity:1)**; el fundido es una MEJORA
 *   puramente CSS (`.route-fade-in` en index.css, keyframe 0→1 sin `fill-mode`
 *   backwards). NUNCA se condiciona la visibilidad a un estado de JS/rAF: en una
 *   pestaña en segundo plano o en un render headless los rAF/animaciones no corren,
 *   y si gateáramos la opacidad la página se quedaría en blanco. Sin animación, el
 *   estado en reposo es opacity:1 → siempre visible.
 * - **Solo anima `opacity`**, nunca `transform`: un `translate` en el envoltorio
 *   convertiría a los descendientes `position: fixed` (mapa a pantalla completa,
 *   barra inferior del detalle, franjas del checkout) en fixed relativo al
 *   envoltorio y romperían su anclaje al viewport. `opacity` no reparenta a los fixed.
 * - `prefers-reduced-motion: reduce`: la animación se desactiva (gated en el CSS) →
 *   aparece al instante, sin fundido.
 */
export function PageFadeIn({ children }: { children: ReactNode }) {
  return <div className="route-fade-in">{children}</div>;
}
