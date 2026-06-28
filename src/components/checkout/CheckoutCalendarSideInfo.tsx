import { cn } from '../../lib/utils';

interface InfoPoint {
    title: string;
    body: string;
}

/**
 * Tarjeta de confianza bajo el calendario (columna derecha, checkout desktop).
 * Rellena el espacio que queda bajo el calendario —que es de alto fijo— con
 * argumentos de tranquilidad. Sin iconos: solo tipografía limpia y un filete
 * sutil entre puntos.
 */
export function CheckoutCalendarSideInfo({ className }: { className?: string }) {
    const points: InfoPoint[] = [
        {
            title: 'Pago protegido',
            body: 'Retenemos el importe y solo se libera al experto cuando termina la inspección.',
        },
    ];

    return (
        <div
            className={cn(
                'flex min-h-0 flex-col justify-center rounded-xl border border-[#e5e7eb] bg-white px-5 py-2 shadow-[0_1px_3px_rgba(15,23,42,0.04)] xl:px-6',
                className,
            )}
        >
            <ul className="flex flex-col divide-y divide-[#f1f3f6]">
                {points.map(({ title, body }) => (
                    <li key={title} className="py-3.5">
                        <p className="text-[13.5px] font-semibold leading-snug text-[#1c1c1c]">{title}</p>
                        <p className="mt-1 text-[12.5px] leading-[1.5] text-[#6b7280]">{body}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}
