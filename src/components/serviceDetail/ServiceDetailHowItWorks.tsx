import React from 'react';
import { Calendar, ClipboardCheck, Shield } from 'lucide-react';

const STEPS = [
  {
    title: 'Pago en custodia',
    body: 'Tu dinero queda retenido de forma segura hasta que apruebes el informe del experto.',
    Icon: Shield,
  },
  {
    title: 'Cita con el experto',
    body: 'Propón fecha, hora y lugar dentro de su disponibilidad y zona de cobertura.',
    Icon: Calendar,
  },
  {
    title: 'Inspección y entrega',
    body: 'Recibes informe, fotos y vídeo. El pago se libera cuando confirmas que todo está correcto.',
    Icon: ClipboardCheck,
  },
] as const;

interface ServiceDetailHowItWorksProps {
  className?: string;
}

export const ServiceDetailHowItWorks: React.FC<ServiceDetailHowItWorksProps> = ({ className = '' }) => (
  <section
    className={`mt-6 pt-6 lg:mt-8 lg:pt-8 ${className}`}
    aria-labelledby="sd-how-heading"
  >
    <h2 id="sd-how-heading" className="hp-section-title mb-4">
      ¿Cómo funciona?
    </h2>
    <ol className="space-y-4">
      {STEPS.map((step, i) => (
        <li key={step.title} className="flex gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f0f6fc] text-[#0066CC]"
            aria-hidden
          >
            <step.Icon className="h-4 w-4" strokeWidth={2} />
          </div>
          <div className="min-w-0 pt-0.5">
            <p className="hp-eyebrow mb-0.5">Paso {i + 1}</p>
            <h3 className="text-base font-semibold text-[#1c1c1c]">{step.title}</h3>
            <p className="mt-1 text-sm leading-snug text-[#6a6a6a]">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  </section>
);
