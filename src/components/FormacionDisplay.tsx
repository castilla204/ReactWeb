import { Building2, CalendarDays } from 'lucide-react';
import { parseFormacion } from './expertPanel/formacion';

interface FormacionDisplayProps {
    /** JSON de la formación del experto (campo `formacion` del perfil). */
    value?: string | null;
    className?: string;
}

/**
 * Muestra la formación del experto en la ficha de servicio como señal de confianza.
 * Mismo estilo visual que "Qué entregará": lista limpia con filas divisibles,
 * tipografía sobria y metadatos secundarios. Sin iconos repetitivos.
 */
export default function FormacionDisplay({ value, className }: FormacionDisplayProps) {
    const items = parseFormacion(value);
    if (items.length === 0) return null;

    return (
        <section className={className} aria-labelledby="sd-formacion-heading">
            <p id="sd-formacion-heading" className="sd-section-label mb-3">
                Formación y certificaciones
            </p>

            <ul className="m-0 list-none divide-y divide-[#ebebeb] border-y border-[#ebebeb] p-0">
                {items.map((it, i) => (
                    <li key={i} className="py-3.5 first:pt-0 last:pb-0">
                        <div className="text-sm font-medium leading-snug text-[#1c1c1c]">
                            {it.titulo}
                        </div>
                        {(it.centro || it.anio) && (
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] leading-snug text-[#6a6a6a]">
                                {it.centro && (
                                    <span className="inline-flex items-center gap-1">
                                        <Building2 size={12} strokeWidth={2} className="shrink-0" />
                                        {it.centro}
                                    </span>
                                )}
                                {it.anio && (
                                    <span className="inline-flex items-center gap-1">
                                        <CalendarDays size={12} strokeWidth={2} className="shrink-0" />
                                        {it.anio}
                                    </span>
                                )}
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </section>
    );
}
