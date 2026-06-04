import React from 'react';
import { HP_PANEL_GRADIENT } from '../../constants/homepageTypography';

export const MobileSearchPortalFallback: React.FC = () => (
  <div
    className="md:hidden fixed inset-0 z-50 flex flex-col"
    style={{ background: HP_PANEL_GRADIENT }}
    aria-busy
    aria-label="Cargando categorías"
  >
    <div className="flex-1 flex items-center justify-center">
      <div className="h-10 w-10 rounded-full border-2 border-brand/30 border-t-brand animate-spin" />
    </div>
  </div>
);
