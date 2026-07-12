import { cn } from '../../lib/utils';

export interface InfoPoint {
    title: string;
    body: string;
}

const DEFAULT_POINTS: InfoPoint[] = [
    {
        title: 'Pago protegido',
        body: 'Retenemos el importe y solo se libera al experto cuando termina la inspección.',
    },
];

/**
 * Tarjeta de confianza que rellena el hueco bajo el bloque principal de la columna
 * derecha del checkout desktop (calendario en flujo self, tarjeta de contacto en flujo
 * seller — ambos de alto fijo). Sin iconos: solo tipografía limpia y un filete sutil
 * entre puntos; MISMA estructura en los dos flujos para que ambas columnas se lean como
 * pares (antes el flujo seller tenía una tarjeta de pasos numerados con icono, un
 * lenguaje visual distinto al resto del checkout — feedback 2026-07-10).
 *
 * `points` por defecto trae 1 solo punto A PROPÓSITO: la altura de esta tarjeta la fija
 * el hueco que queda bajo el bloque de arriba (flex-1 la estira). Con 2-3 puntos crecía
 * más que ese hueco y descuadraba los bajos con la columna izquierda (feedback
 * 2026-07-09). Si se pasan más puntos, comprobar que el conjunto siga cabiendo.
 */
export function CheckoutCalendarSideInfo({
    className,
    points = DEFAULT_POINTS,
}: {
    className?: string;
    points?: InfoPoint[];
}) {
    return (
        <div
            className={cn(
                'flex min-h-0 flex-col justify-center rounded-xl border border-line bg-white px-4 py-2 shadow-[0_1px_3px_rgba(15,23,42,0.04)] xl:px-5',
                className,
            )}
        >
            <ul className="flex flex-col divide-y divide-line-soft">
                {points.map(({ title, body }) => (
                    <li key={title} className="py-3.5">
                        <p className="text-meta font-semibold leading-snug text-ink-strong">{title}</p>
                        <p className="mt-1 text-caption leading-[1.5] text-ink-muted">{body}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}
