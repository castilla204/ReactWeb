import React, { useEffect, useState } from 'react';

/**
 * Anti-flicker para fallbacks de <Suspense>.
 *
 * Un skeleton que aparece y desaparece en <200ms se percibe como un GLITCH y hace
 * que la página se sienta MÁS lenta, no más rápida (NN/g, Productboard). Este gate
 * monta el fallback pero no pinta nada hasta pasados `delayMs`; si el contenido
 * suspendido resuelve antes, React desmonta este componente (el timer se limpia) y
 * el skeleton no llega a verse. Solo en cargas realmente lentas se muestra.
 */
export const Delayed: React.FC<{ delayMs?: number; children: React.ReactNode }> = ({
  delayMs = 200,
  children,
}) => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setShow(true), delayMs);
    return () => clearTimeout(id);
  }, [delayMs]);
  return show ? <>{children}</> : null;
};

export default Delayed;
