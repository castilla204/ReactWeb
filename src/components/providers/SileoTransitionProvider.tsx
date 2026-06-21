import React from 'react';
import { Ssgoi } from '@ssgoi/react';
import { fade } from '@ssgoi/react/view-transitions';

/**
 * Proveedor de transiciones de ruta con SSGOI.
 *
 * Añade transiciones suaves entre páginas sin depender de la View Transitions API
 * del navegador (funciona en Chrome, Safari y Firefox).
 *
 * Usamos `fade()` por defecto porque es sutil y no distrae de la carga real.
 * Se puede evolucionar a `drill()` o `hero()` para flujos específicos.
 */
export function SileoTransitionProvider({ children }: { children: React.ReactNode }) {
  return (
    <Ssgoi
      config={{
        transitions: [fade({ paths: ['*'] })],
      }}
    >
      {children}
    </Ssgoi>
  );
}
