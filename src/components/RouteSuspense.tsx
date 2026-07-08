import React, { Suspense, type ReactNode } from 'react';
import { PageRouteFallback } from './PageRouteFallback';
import { Delayed } from './ui/Delayed';

// Anti-flicker: el fallback de ruta solo se pinta si el chunk tarda >200ms. En
// navegaciones cacheadas/rápidas no aparece nada → sin parpadeo del skeleton.
export const RouteSuspense: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({
  children,
  fallback,
}) => (
  <Suspense fallback={<Delayed>{fallback ?? <PageRouteFallback />}</Delayed>}>{children}</Suspense>
);
