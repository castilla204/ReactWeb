import React, { Suspense, type ReactNode } from 'react';
import { PageRouteFallback } from './PageRouteFallback';
import { Delayed } from './ui/Delayed';

// Anti-flicker: el fallback de ruta solo se pinta si el chunk tarda >200ms. En
// navegaciones cacheadas/rápidas no aparece nada → sin parpadeo del skeleton.
// `immediateFallback` (home): skeleton al instante — la primera visita móvil no
// puede permitirse 200ms de blanco antes del layout.
export const RouteSuspense: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
  immediateFallback?: boolean;
}> = ({ children, fallback, immediateFallback = false }) => (
  <Suspense
    fallback={
      immediateFallback ? (
        (fallback ?? <PageRouteFallback />)
      ) : (
        <Delayed>{fallback ?? <PageRouteFallback />}</Delayed>
      )
    }
  >
    {children}
  </Suspense>
);
