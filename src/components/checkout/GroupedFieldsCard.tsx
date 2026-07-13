import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

/** Etiqueta DENTRO de un campo agrupado (fila de GroupedFieldsCard) o de un campo
 *  secundario subrayado: más tenue que una etiqueta de campo normal — el contorno del
 *  grupo (o el propio underline) ya hace de contenedor, la etiqueta solo identifica la
 *  fila. #6b7280 es el gris tenue validado en el resto del checkout (≥4.5:1 de
 *  contraste; el más claro #8a9099 falla AA a este tamaño). */
export const groupedLabelClass = 'block text-kicker font-medium text-ink-muted';

/** Input SIN caja propia para usar dentro de GroupedFieldsCard: el contorno, la sombra y
 *  el anillo de foco los pinta el grupo (focus-within), no cada campo por separado. */
export const bareGroupedInputClass =
    'h-10 w-full bg-transparent px-0 text-body text-ink-strong outline-none placeholder:text-ink-soft';

/** Campo secundario/opcional, fuera de cualquier grupo obligatorio: subrayado en vez de
 *  caja propia, para demotarlo deliberadamente por debajo en peso visual (mismo recurso
 *  que usan los formularios de Stripe para campos opcionales de baja frecuencia). */
export const underlineFieldInputClass =
    'h-10 w-full border-b border-line bg-transparent px-0 text-body text-ink-strong outline-none transition-colors duration-150 placeholder:text-ink-soft focus:border-brand';

/**
 * Agrupa 2+ campos que responden a UNA sola pregunta («¿cómo contactamos al vendedor?»)
 * en un único contenedor con filetes internos — patrón Stripe/Linear — en vez de cajas
 * independientes con su propio borde+sombra cada una (leía a kit de formulario genérico,
 * feedback 2026-07-10). El foco y el error se pintan en el CONTENEDOR (todo el grupo se
 * ilumina), reforzando que las filas son una única obligación con varias vías.
 *
 * Un solo componente para desktop (CheckoutDesktopLocationStepBody) y móvil
 * (CheckoutSellerCoordinationFields): mismo look en los dos, no dos formularios distintos
 * para el mismo dato.
 */
export function GroupedFieldsCard({
    error,
    children,
}: {
    error?: boolean;
    children: ReactNode;
}) {
    return (
        <div
            className={cn(
                'overflow-hidden rounded-xl border bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow] duration-150',
                error
                    ? 'border-destructive focus-within:shadow-[0_0_0_3px_rgba(240,68,56,0.12)]'
                    : 'border-line focus-within:border-brand focus-within:shadow-[0_0_0_3px_rgba(0,102,204,0.12)]',
            )}
        >
            {children}
        </div>
    );
}

/** Filete separador entre filas del grupo con una palabra montada encima («o»): codifica
 *  la relación entre los campos (alternativas, no dos obligaciones) con estructura en vez
 *  de con una frase suelta encima del grupo. La fila siguiente debe llevar `first` para
 *  no pintar su propio border-t. */
export function GroupedFieldsDivider({ label }: { label?: string }) {
    return (
        <div className="relative" role="separator" aria-hidden>
            <div className="border-t border-line-soft" />
            {label ? (
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 bg-white pr-1.5 text-[10.5px] font-medium leading-none text-ink-muted">
                    {label}
                </span>
            ) : null}
        </div>
    );
}

export function GroupedFieldRow({
    label,
    htmlFor,
    children,
    first,
    comfortable,
}: {
    label: ReactNode;
    htmlFor: string;
    children: ReactNode;
    first?: boolean;
    comfortable?: boolean;
}) {
    return (
        <div
            className={cn(
                comfortable ? 'px-4 py-3' : 'px-3.5 py-2.5',
                !first && 'border-t border-line-soft',
            )}
        >
            <label htmlFor={htmlFor} className={groupedLabelClass}>
                {label}
            </label>
            {children}
        </div>
    );
}
