import React, { Suspense, type ReactNode } from 'react';
import { PageRouteFallback } from './PageRouteFallback';
import { Delayed } from './ui/Delayed';
import { PageFadeIn } from './ui/PageFadeIn';

// Anti-flicker: el fallback de ruta solo se pinta si el chunk tarda >200ms. En
// navegaciones cacheadas/rápidas no aparece nada → sin parpadeo del skeleton.
// `immediateFallback` (home/mapa): skeleton al instante — la primera visita móvil no
// puede permitirse 200ms de blanco antes del layout.
//
// Crossfade: el contenido real se envuelve en `PageFadeIn` para que aparezca con un
// fundido suave al montarse (cuando el chunk resuelve y el skeleton se retira), en
// vez de un corte seco. Solo `opacity`, seguro para descendientes `position: fixed`.
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
    <PageFadeIn>{children}</PageFadeIn>
  </Suspense>
);
