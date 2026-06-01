import React from 'react';
import { Calendar, ClipboardCheck, ShoppingBag } from 'lucide-react';

const FLOW_STEPS = [
  {
    title: 'Reserva',
    body: 'Precio cerrado. Coordináis los detalles por chat tras reservar.',
    Icon: ShoppingBag,
  },
  {
    title: 'Cita de inspección',
    body: 'Acordáis fecha, hora y lugar dentro del horario y la zona del experto.',
    Icon: Calendar,
  },
  {
    title: 'Informe y cierre',
    body: 'Recibes fotos, vídeo y conclusiones. Confirmas el resultado para cerrar la reserva.',
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

    <ol className="relative m-0 list-none space-y-0 p-0">
      {FLOW_STEPS.map((step, i) => {
        const isLast = i === FLOW_STEPS.length - 1;
        return (
          <li key={step.title} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast && (
              <span
                className="absolute left-[15px] top-9 bottom-0 w-px bg-[#e8e8e8]"
                aria-hidden
              />
            )}
            <div
              className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f3f4f6] text-[#6a6a6a]"
              aria-hidden
            >
              <step.Icon className="h-3.5 w-3.5" strokeWidth={2} />
            </div>
            <div className="min-w-0 pt-0.5">
              <h3 className="text-[15px] font-semibold leading-tight text-[#1c1c1c]">{step.title}</h3>
              <p className="mt-1 text-sm leading-snug text-[#6a6a6a]">{step.body}</p>
            </div>
          </li>
        );
      })}
    </ol>

    <p className="mt-4 text-xs leading-relaxed text-[#9ca3af]">
      Si cancelas antes de que empiece la revisión, reembolso completo.
    </p>
  </section>
);
