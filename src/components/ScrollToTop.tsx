import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Componente optimizado que hace scroll al inicio de la página cuando cambia la ruta
 * 
 * Optimizaciones aplicadas:
 * - Usa requestAnimationFrame para sincronizar con el ciclo de renderizado
 * - Una sola llamada a window.scrollTo (suficiente para todos los navegadores modernos)
 * - No hace DOM queries innecesarias (getElementById)
 * - Comportamiento 'instant' para evitar animaciones que causen retrasos
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // ✅ OPTIMIZADO: Usar requestAnimationFrame para sincronizar con el ciclo de renderizado
    // Esto asegura que el scroll se ejecute en el momento óptimo sin bloquear el hilo principal
    const rafId = requestAnimationFrame(() => {
      // ✅ Una sola llamada es suficiente - window.scrollTo funciona en todos los navegadores modernos
      // ✅ Usar behavior: 'instant' para evitar animaciones que causen retrasos
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });

    // ✅ Cleanup: cancelar el requestAnimationFrame si el componente se desmonta antes de ejecutarse
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [pathname]);

  return null;
}
