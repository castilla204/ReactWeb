import React from 'react';

/** Reserva la barra inferior móvil para evitar salto al montar MobileBottomBar. */
export const HomeBottomBarLoading: React.FC = () => (
  <div
    className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-white"
    style={{
      height: 'calc(65px + env(safe-area-inset-bottom, 0px))',
      paddingTop: '11px',
      paddingBottom: 'max(11px, env(safe-area-inset-bottom))',
    }}
    aria-hidden
  >
    <div className="flex items-center justify-center gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex h-11 w-11 flex-col items-center justify-center gap-1">
          <div className="h-5 w-5 rounded-md bg-line-soft" />
          <div className="h-1.5 w-7 rounded-sm bg-surface-tinted" />
        </div>
      ))}
    </div>
  </div>
);

