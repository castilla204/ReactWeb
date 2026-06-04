import React from 'react';

/** Fallback ligero mientras carga un chunk de ruta */
export const PageRouteFallback: React.FC = () => (
  <div
    className="flex min-h-[40vh] w-full items-center justify-center bg-[#fafafa]"
    aria-busy="true"
    aria-label="Cargando página"
  >
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
  </div>
);
