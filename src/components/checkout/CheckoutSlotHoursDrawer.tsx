import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SD_CHECKOUT_MOBILE_FOOTER_PAD_BOTTOM_CLASS, SD_CHECKOUT_MOBILE_GUTTER_CLASS } from '../../constants/homepageTypography';
import { cn } from '../../lib/utils';

interface CheckoutSlotHoursDrawerProps {
    open: boolean;
    dateLabel: string;
    selectedLabel?: string | null;
    expanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

/**
 * Alto máximo capado a un % del viewport, recalculado en resize/rotación.
 * Deliberadamente en JS y no `max-h-[min(36vh,260px)]`: Chromium no anima una
 * transición de max-height cuyo destino es una función min() — el valor computado
 * se queda clavado en el arranque (0) para siempre. Un número en px sí interpola bien.
 */
function useViewportCappedHeight(vhFraction: number, capPx: number) {
    const [px, setPx] = useState(() => Math.round(Math.min(window.innerHeight * vhFraction, capPx)));
    useEffect(() => {
        const onResize = () => setPx(Math.round(Math.min(window.innerHeight * vhFraction, capPx)));
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [vhFraction, capPx]);
    return px;
}

/** Drawer inferior de horas al elegir día en el calendario (móvil checkout). */
export function CheckoutSlotHoursDrawer({
    open,
    dateLabel,
    selectedLabel,
    expanded,
    onToggle,
    children,
}: CheckoutSlotHoursDrawerProps) {
    const [entered, setEntered] = useState(false);
    const expandedMaxHeightPx = useViewportCappedHeight(0.5, 340);
    const bodyMaxHeightPx = useViewportCappedHeight(0.36, 260);

    useEffect(() => {
        if (!open) {
            setEntered(false);
            return;
        }
        const frame = window.requestAnimationFrame(() => setEntered(true));
        return () => window.cancelAnimationFrame(frame);
    }, [open]);

    if (!open) return null;

    return (
        <>
            {expanded ? (
                <button
                    type="button"
                    className="fixed inset-0 z-[80] bg-black/20 transition-opacity duration-300 motion-reduce:transition-none lg:hidden"
                    onClick={onToggle}
                    aria-label="Cerrar selector de hora"
                />
            ) : null}

            <div
                className={cn(
                    'pointer-events-none fixed inset-x-0 bottom-0 z-[81] motion-reduce:transition-none lg:hidden',
                    SD_CHECKOUT_MOBILE_FOOTER_PAD_BOTTOM_CLASS,
                )}
                aria-live="polite"
            >
                <div
                    className={cn(
                        'pointer-events-auto relative flex flex-col overflow-hidden rounded-t-2xl border border-b-0 border-line bg-white shadow-[0_-12px_40px_rgba(15,23,42,0.14)] transition-[max-height,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
                        entered ? 'translate-y-0' : 'translate-y-full',
                        !expanded && 'max-h-none',
                    )}
                    style={expanded ? { maxHeight: expandedMaxHeightPx } : undefined}
                >
                    <div
                        className={cn(
                            'relative shrink-0 bg-white pt-1',
                            SD_CHECKOUT_MOBILE_GUTTER_CLASS,
                            expanded ? 'pb-2.5' : 'pb-4',
                        )}
                    >
                        <button
                            type="button"
                            onClick={onToggle}
                            className="mx-auto flex w-full justify-center pb-1.5 pt-0.5"
                            aria-expanded={expanded}
                            aria-label={expanded ? 'Contraer horarios' : 'Expandir horarios'}
                        >
                            <span className="h-1 w-9 rounded-full bg-line" aria-hidden />
                        </button>

                        <button
                            type="button"
                            onClick={onToggle}
                            aria-expanded={expanded}
                            className="flex w-full items-center gap-2.5 text-left"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-lead font-semibold leading-snug tracking-[-0.01em] text-ink-strong">
                                    {dateLabel}
                                </p>
                                {!expanded && !selectedLabel ? (
                                    <p className="mt-1 truncate text-caption leading-snug text-ink-muted">
                                        Elige una hora
                                    </p>
                                ) : null}
                            </div>
                            {selectedLabel && !expanded ? (
                                <span className="shrink-0 rounded-lg bg-brand px-2.5 py-1 text-caption font-bold tabular-nums text-white">
                                    {selectedLabel}
                                </span>
                            ) : (
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface-tinted text-ink-muted">
                                    <ChevronDown
                                        className={cn(
                                            'h-4 w-4 transition-transform duration-300',
                                            expanded && 'rotate-180',
                                        )}
                                        aria-hidden
                                    />
                                </span>
                            )}
                        </button>
                    </div>

                    <div
                        className={cn(
                            // Solo opacity se anima: una transición de max-height en este elemento
                            // se queda clavada en el valor inicial en vez de interpolar (comprobado
                            // en el propio motor, independiente del valor de destino). El alto pasa
                            // a ser 100% inline e instantáneo; el crecimiento visual ya lo aporta la
                            // lámina exterior, que sí anima su max-height sin problemas.
                            'min-h-0 overflow-y-auto overscroll-contain border-t border-line bg-white transition-opacity duration-300',
                            SD_CHECKOUT_MOBILE_GUTTER_CLASS,
                            expanded
                                ? 'visible pb-4 pt-2.5 opacity-100'
                                : 'invisible border-t-0 pb-0 pt-0 opacity-0',
                        )}
                        style={{ maxHeight: expanded ? bodyMaxHeightPx : 0 }}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </>
    );
}
