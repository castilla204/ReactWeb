import React from 'react';

/**
 * Aclaración honesta de captura diferida bajo el botón de pago (letra pequeña).
 * El paso intermedio cambia según quién agenda la cita: en modo vendedor lo primero
 * es que el vendedor reserve con el enlace (y si no lo hace, se reembolsa); en modo
 * propio la cita queda reservada al instante y solo falta que el experto la confirme.
 */
export const CheckoutReserveHint: React.FC<{
  className?: string;
  coordinationMode?: 'self' | 'seller';
}> = ({ className = '', coordinationMode = 'self' }) => (
  <div
    className={`space-y-2 text-xs leading-relaxed text-[#6a6a6a] ${className}`.trim()}
    aria-label="Cómo funciona el cobro"
  >
    <p>
      <span className="font-semibold text-[#1c1c1c]">Hoy no se te cobra nada</span>: solo reservamos el
      importe en tu tarjeta.
    </p>
    {coordinationMode === 'seller' ? (
      <p>
        Tras pagar, el vendedor recibe un enlace para elegir el día y la hora con el experto. Si no
        reserva a tiempo, te devolvemos el importe.
      </p>
    ) : (
      <p>
        El cargo se hace cuando el experto confirme la cita. Si no la confirma, se libera solo y listo.
      </p>
    )}
    <p>
      El experto no cobra hasta que tú des el visto bueno al informe. Cancelación gratuita antes de que
      empiece la revisión.
    </p>
  </div>
);
