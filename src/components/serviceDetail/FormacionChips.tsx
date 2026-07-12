import { parseFormacion } from '../expertPanel/formacion';

interface FormacionChipsProps {
    /** JSON de la formación del experto (campo `formacion` del perfil). */
    value?: string | null;
    /** Una sola línea con desplazamiento horizontal (en vez de envolver). */
    scrollable?: boolean;
    className?: string;
}

/**
 * Formación del experto como chips neutros discretos — MISMO estilo que los que
 * salen junto al nombre en desktop (ServiceDetailExpertHostRow). Se usa en móvil,
 * bajo "Acerca del servicio", para mostrar la titulación sin robar protagonismo.
 * Con `scrollable`, queda en una fila con scroll horizontal y sin barra visible.
 */
export default function FormacionChips({ value, scrollable = false, className }: FormacionChipsProps) {
    const items = parseFormacion(value);
    if (items.length === 0) return null;

    return (
        <div
            className={`flex items-center gap-1.5 ${
                scrollable
                    ? 'flex-nowrap overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
                    : 'flex-wrap'
            } ${className ?? ''}`}
        >
            {items.map((it, i) => (
                <span
                    key={i}
                    title={it.titulo}
                    className={`inline-flex items-center rounded-full bg-surface-tinted px-2.5 py-1 text-caption font-medium leading-none text-ink-muted ring-1 ring-line ${
                        scrollable ? 'shrink-0 whitespace-nowrap' : 'max-w-full'
                    }`}
                >
                    <span className={scrollable ? undefined : 'truncate'}>{it.titulo}</span>
                </span>
            ))}
        </div>
    );
}
