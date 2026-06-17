import React from 'react';
import AvailabilityCalendar from './AvailabilityCalendar';
import AvailabilityRulesEditor from './AvailabilityRulesEditor';

/** Pestaña "Disponibilidad" del panel del experto: calendario arriba + horario semanal (desplegable). */
const AvailabilityTab: React.FC = () => (
    <div className="mx-auto w-full max-w-3xl space-y-5 p-4 lg:p-6">
        <header className="space-y-1">
            <h2 className="text-xl font-bold tracking-[-0.02em] text-[#12151a]">Disponibilidad</h2>
            <p className="max-w-[58ch] text-[13.5px] leading-relaxed text-[#5a606b] [text-wrap:pretty]">
                Tu <span className="font-semibold text-[#33373f]">horario semanal</span> pinta el calendario.
                Pulsa cualquier día para hacer una <span className="font-semibold text-[#33373f]">excepción</span>:
                cerrarlo, abrirlo o cambiarle las horas solo ese día.
            </p>
        </header>
        <AvailabilityCalendar />
        <AvailabilityRulesEditor collapsible />
    </div>
);

export default AvailabilityTab;
