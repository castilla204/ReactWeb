import React, { Suspense, type ReactNode } from 'react';
import { PageRouteFallback } from './PageRouteFallback';

export const RouteSuspense: React.FC<{ children: ReactNode }> = ({ children }) => (
  <Suspense fallback={<PageRouteFallback />}>{children}</Suspense>
);
