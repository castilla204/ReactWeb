import React from 'react';

/** Aclaración honesta de captura diferida bajo el botón de pago (letra pequeña). */
export const CheckoutReserveHint: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`space-y-2 text-xs leading-relaxed text-[#6a6a6a] ${className}`.trim()}
    aria-label="Cómo funciona el cobro"
  >
    <p>
      <span className="font-semibold text-[#1c1c1c]">Hoy no se te cobra nada</span>: solo reservamos el
      importe en tu tarjeta.
    </p>
    <p>
      El cargo se hace cuando el experto confirme la cita. Si no la confirma, se libera solo y listo.
    </p>
    <p>
      El experto no cobra hasta que tú des el visto bueno al informe. Cancelación gratuita antes de que
      empiece la revisión.
    </p>
  </div>
);
