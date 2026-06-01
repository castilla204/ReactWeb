import React from 'react';

/** Texto compacto bajo el resumen del servicio (mismo panel, letra pequeña). */
export const CheckoutReserveHint: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`space-y-2.5 text-xs leading-relaxed text-[#6a6a6a] ${className}`.trim()}
    aria-label="Qué ocurre después de reservar"
  >
    <p>
      <span className="font-semibold text-[#1c1c1c]">Al reservar</span> confirmas la contratación y
      pasas a un pago seguro con Stripe. El importe queda retenido y no se libera al experto hasta que
      apruebes el informe.
    </p>
    <p>
      Después coordinas fecha, hora y lugar por chat (mínimo 24&nbsp;h de antelación, dentro del
      horario del experto y su zona de cobertura).
    </p>
    <p>
      Recibes informe, fotos y vídeo según el servicio. Si cancelas antes de que empiece la revisión,
      reembolso completo.
    </p>
  </div>
);
