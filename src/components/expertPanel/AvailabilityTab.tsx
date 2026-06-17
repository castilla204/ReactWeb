import React from 'react';
import AvailabilityCalendar from './AvailabilityCalendar';
import AvailabilityRulesEditor from './AvailabilityRulesEditor';

/** Pestaña "Disponibilidad" del panel del experto. */
const AvailabilityTab: React.FC = () => (
    <div className="av-page">
        <header className="av-page-intro">
            <p className="av-page-intro__lead">
                Tu <strong>horario semanal</strong> colorea el calendario según las horas de cada día
                (jornada completa, horario reducido o turnos partidos). Pulsa cualquier fecha para crear una
                <strong> excepción</strong>: cerrar un día, abrir uno suelto o cambiar solo sus horas.
            </p>
            <ol className="av-page-intro__steps" aria-label="Cómo funciona">
                <li>Configura el horario que se repite cada semana</li>
                <li>Ajusta los días concretos que necesites y pulsa <strong>Guardar cambios</strong> una sola vez</li>
            </ol>
        </header>

        <AvailabilityCalendar />
        <AvailabilityRulesEditor collapsible defaultOpen={false} />
    </div>
);

export default AvailabilityTab;
