import { useState, useEffect } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    function apply() {
      setWindowSize((prev) => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        if (width === prev.width && height === prev.height) return prev; // sin cambios → sin re-render
        // ⚡ Móvil: ignora el "ruido" de la barra de direcciones (colapsa/expande al hacer
        //    scroll → cambios SOLO de alto de ~60-100px) que disparaba re-renders en cascada
        //    (SearchParameterForm, ResponsiveModal, mapa…). Rotación y teclado cambian el ancho
        //    o el alto >120px, así que esos sí pasan.
        if (width === prev.width && Math.abs(height - prev.height) < 120) return prev;
        return { width, height };
      });
    }

    function handleResize() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(apply, 150); // debounce: colapsa ráfagas de resize en un solo update
    }

    window.addEventListener('resize', handleResize);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return windowSize;
}

