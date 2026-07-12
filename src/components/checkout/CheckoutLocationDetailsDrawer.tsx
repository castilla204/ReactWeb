import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SD_CHECKOUT_MOBILE_FOOTER_PAD_BOTTOM_CLASS } from '../../constants/homepageTypography';
import { cn } from '../../lib/utils';

interface CheckoutLocationDetailsDrawerProps {
    open: boolean;
    addressLabel: string;
    /** Texto corto cuando hay puerta/referencias (badge colapsado). */
    detailBadge?: string | null;
    expanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

/** Drawer inferior de detalles de ubicación (móvil checkout — mismo patrón que horas). */
export function CheckoutLocationDetailsDrawer({
    open,
    addressLabel,
    detailBadge,
    expanded,
    onToggle,
    children,
}: CheckoutLocationDetailsDrawerProps) {
    const [entered, setEntered] = useState(false);

    useEffect(() => {
        if (!open) {
            setEntered(false);
            return;
        }
        const frame = window.requestAnimationFrame(() => setEntered(true));
        return () => window.cancelAnimationFrame(frame);
    }, [open]);

    if (!open) return null;

    const expandedMaxHeight = 'max-h-[min(58vh,400px)]';
    const bodyMaxHeight = 'max-h-[min(44vh,320px)]';

    return (
        <>
            {expanded ? (
                <button
                    type="button"
                    className="fixed inset-0 z-[35] bg-black/20 transition-opacity duration-300 lg:hidden"
                    onClick={onToggle}
                    aria-label="Cerrar detalles de ubicación"
                />
            ) : null}

            <div
                className={cn(
                    'pointer-events-none fixed inset-x-0 bottom-0 z-[36] lg:hidden',
                    SD_CHECKOUT_MOBILE_FOOTER_PAD_BOTTOM_CLASS,
                )}
                aria-live="polite"
            >
                <div
                    className={cn(
                        'pointer-events-auto relative flex flex-col overflow-hidden rounded-t-[1.25rem] border border-b-0 border-line bg-white shadow-[0_-12px_40px_rgba(15,23,42,0.14)] transition-[max-height,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
                        entered ? 'translate-y-0' : 'translate-y-full',
                        expanded ? expandedMaxHeight : 'max-h-none',
                    )}
                >
                    <div
                        className={cn(
                            'relative shrink-0 bg-white px-4 pt-1',
                            expanded ? 'pb-2.5' : 'pb-4',
                        )}
                    >
                        <button
                            type="button"
                            onClick={onToggle}
                            className="mx-auto flex w-full justify-center pb-1.5 pt-0.5"
                            aria-expanded={expanded}
                            aria-label={expanded ? 'Contraer detalles' : 'Expandir detalles'}
                        >
                            <span className="h-1 w-9 rounded-full bg-line" aria-hidden />
                        </button>

                        <button
                            type="button"
                            onClick={onToggle}
                            className="flex w-full items-center gap-2.5 text-left"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-lead font-semibold leading-snug tracking-[-0.02em] text-ink-strong">
                                    {addressLabel}
                                </p>
                                {!expanded ? (
                                    <p className="mt-1 truncate text-caption leading-relaxed text-ink-muted">
                                        {detailBadge ? 'Detalles añadidos' : 'Puerta y referencias (opcional)'}
                                    </p>
                                ) : null}
                            </div>
                            {detailBadge && !expanded ? (
                                <span className="max-w-[5.5rem] shrink-0 truncate text-kicker font-medium text-ink-muted">
                                    {detailBadge}
                                </span>
                            ) : null}
                            <ChevronDown
                                className={cn(
                                    'h-[18px] w-[18px] shrink-0 text-ink-soft transition-transform duration-300',
                                    expanded && 'rotate-180',
                                )}
                                aria-hidden
                            />
                        </button>
                    </div>

                    <div
                        className={cn(
                            'min-h-0 overflow-y-auto overscroll-contain bg-white px-4 transition-[opacity,max-height] duration-300',
                            expanded
                                ? cn(bodyMaxHeight, 'pb-4 pt-1 opacity-100')
                                : 'max-h-0 pb-0 pt-0 opacity-0 pointer-events-none',
                        )}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </>
    );
}
