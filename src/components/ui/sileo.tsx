import { useEffect } from 'react';
import 'sileo/styles.css';
import './../../styles/sileo-theme.css';
import { Toaster as SileoToaster } from 'sileo';

/**
 * Contenedor de toasts de la app, servido por Sileo (físicos / opinionated).
 * Anclado arriba a la derecha en TODAS las pantallas, igual que escritorio.
 */
const Toaster = () => {
  useSileoDomFixes();
  return (
    <SileoToaster
      position="top-right"
      theme="light"
      options={{ roundness: 18 }}
    />
  );
};

const SVG_SELECTOR = '[data-sileo-svg]';
const TOP_CLEARANCE_GAP = 12;
const TOP_CLEARANCE_MIN = 12;

/**
 * Dos arreglos al runtime de Sileo que no se pueden hacer solo con CSS:
 *
 * 1) `preserveAspectRatio`: el <svg> del pill trae ancho/alto HARDCODEADOS en
 *    el runtime (`const WIDTH = 350`) y no es un atributo estilable por CSS.
 *    Sin este parche, anclado a la derecha, ese ancho fijo sobresale por el
 *    lateral en pantallas estrechas y el mensaje se pierde fuera de la
 *    pantalla. Lo forzamos a "none" para que `width/height:100%` (ver
 *    sileo-theme.css) lo estire solo en horizontal — sin dejar hueco en
 *    blanco vertical — y siga el ancho real del toast (`--sileo-width`) en
 *    cualquier pantalla.
 *
 * 2) Despejar la cabecera: el toast va en la misma esquina que la cabecera
 *    fija de casi toda la app (mismo z-index; el toast, montado después,
 *    gana el empate y bloquea el click de sus botones si se solapan). Pero
 *    no todas las páginas tienen cabecera arriba (la home en móvil no la
 *    muestra hasta hacer scroll) — un offset fijo o se queda corto o empuja
 *    el toast sobre contenido real (pasó: 4.5rem fijos tapaban la tarjeta de
 *    héroe de la home). Medimos la cabecera sticky/fixed realmente pegada
 *    arriba y publicamos el resultado como `--sileo-top-clearance` (lo
 *    consume el padding-top del viewport en sileo-theme.css).
 */
function useSileoDomFixes() {
  useEffect(() => {
    let raf = 0;

    const patchSvgs = () => {
      document.querySelectorAll(SVG_SELECTOR).forEach((el) => {
        if (el.getAttribute('preserveAspectRatio') !== 'none') {
          el.setAttribute('preserveAspectRatio', 'none');
        }
      });
    };

    const computeTopClearance = () => {
      let bottom = 0;
      document.querySelectorAll('header').forEach((header) => {
        const cs = getComputedStyle(header);
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        if (cs.position !== 'sticky' && cs.position !== 'fixed') return;
        const rect = header.getBoundingClientRect();
        // Solo cabeceras con alto real y realmente pegadas al borde superior.
        if (rect.height === 0 || rect.top > 4) return;
        bottom = Math.max(bottom, rect.bottom);
      });
      const clearance = bottom > 0 ? bottom + TOP_CLEARANCE_GAP : TOP_CLEARANCE_MIN;
      document.documentElement.style.setProperty('--sileo-top-clearance', `${clearance}px`);
    };

    const run = () => {
      patchSvgs();
      computeTopClearance();
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(run);
    };

    run();
    window.addEventListener('resize', schedule);
    // Cubre navegación SPA (cabecera distinta por página) y toasts nuevos.
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', schedule);
      observer.disconnect();
    };
  }, []);
}

export { Toaster };
