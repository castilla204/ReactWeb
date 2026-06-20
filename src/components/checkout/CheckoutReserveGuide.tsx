import React from 'react';

/** Aclaración honesta de captura diferida bajo el botón de pago (letra pequeña). */
export const CheckoutReserveHint: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`space-y-2 text-xs leading-relaxed text-[#6a6a6a] ${className}`.trim()}
    aria-label="Cómo funciona el cobro"
  >
    <p>
      <span className="font-semibold text-[#1c1c1c]">Al reservar</span> autorizamos el importe en tu
      tarjeta, pero <span className="font-semibold text-[#1c1c1c]">no se cobra nada todavía</span>. El
      cargo solo se hace efectivo cuando el experto confirma la cita.
    </p>
    <p>
      Si el experto rechaza la cita o no responde a tiempo, la autorización se libera y no se te cobra
      nada.
    </p>
    <p>
      El experto no recibe su pago hasta que revises el informe y des el visto bueno. Cancelación
      gratuita antes de que empiece la revisión.
    </p>
  </div>
);
