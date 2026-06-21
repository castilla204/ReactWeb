import React from 'react';
import { SileoLoader } from '../ui/sileo-loader';
import { HP_PANEL_GRADIENT } from '../../constants/homepageTypography';

/** Fallback del portal de búsqueda móvil — ahora con mensaje contextual y marca. */
export const MobileSearchPortalFallback: React.FC = () => (
  <div
    className="md:hidden fixed inset-0 z-50 flex flex-col"
    style={{ background: HP_PANEL_GRADIENT }}
    aria-busy
    aria-label="Cargando categorías"
  >
    <div className="flex-1 flex items-center justify-center">
      <SileoLoader
        size="lg"
        layout="center"
        message="Preparando categorías…"
        color="brand"
      />
    </div>
  </div>
);
