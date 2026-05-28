import React from 'react';

const STEPS = [
  {
    title: 'Pago en custodia',
    body: 'Tu dinero queda retenido hasta que apruebes el informe.',
  },
  {
    title: 'Cita con el experto',
    body: 'Propón fecha, hora y lugar dentro del horario y zona de cobertura.',
  },
  {
    title: 'Inspección y entrega',
    body: 'Recibes informe, fotos y vídeo. El pago se libera al confirmar.',
  },
] as const;

export const ServiceDetailHowItWorks: React.FC = () => (
  <section className="mt-10 border-t border-[#e8e8e8] pt-8" aria-labelledby="sd-how-heading">
    <h2 id="sd-how-heading" className="sd-page-title mb-4">
      ¿Cómo funciona?
    </h2>
    <div className="grid gap-4 md:grid-cols-3">
      {STEPS.map((step, i) => (
        <div key={step.title} className="border border-[#e8e8e8] rounded-lg bg-white p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#0066CC]">
            Paso {i + 1}
          </span>
          <h3 className="mt-2 text-sm font-semibold text-[#1c1c1c]">{step.title}</h3>
          <p className="mt-1 text-sm leading-snug text-[#6a6a6a]">{step.body}</p>
        </div>
      ))}
    </div>
  </section>
);
