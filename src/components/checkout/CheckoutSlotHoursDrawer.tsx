import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SD_CHECKOUT_MOBILE_FOOTER_PAD_BOTTOM_CLASS } from '../../constants/homepageTypography';
import { cn } from '../../lib/utils';

interface CheckoutSlotHoursDrawerProps {
    open: boolean;
    dateLabel: string;
    selectedLabel?: string | null;
    expanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
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

    useEffect(() => {
        if (!open) {
            setEntered(false);
            return;
        }
        const frame = window.requestAnimationFrame(() => setEntered(true));
        return () => window.cancelAnimationFrame(frame);
    }, [open]);

    if (!open) return null;

    const expandedMaxHeight = 'max-h-[min(50vh,340px)]';
    const bodyMaxHeight = 'max-h-[min(36vh,260px)]';

    return (
        <>
            {expanded ? (
                <button
                    type="button"
                    className="fixed inset-0 z-[35] bg-black/20 transition-opacity duration-300 lg:hidden"
                    onClick={onToggle}
                    aria-label="Cerrar selector de hora"
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
                        'pointer-events-auto relative flex flex-col overflow-hidden rounded-t-[1.25rem] border border-b-0 border-[#e8ecf1] bg-white shadow-[0_-12px_40px_rgba(15,23,42,0.14)] transition-[max-height,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
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
                            aria-label={expanded ? 'Contraer horarios' : 'Expandir horarios'}
                        >
                            <span className="h-1 w-9 rounded-full bg-[#d1d5db]" aria-hidden />
                        </button>

                        <button
                            type="button"
                            onClick={onToggle}
                            className="flex w-full items-center gap-2.5 text-left"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-[15px] font-semibold capitalize leading-snug tracking-[-0.02em] text-[#14161a]">
                                    {dateLabel}
                                </p>
                                {!expanded ? (
                                    <p className="mt-1 truncate text-[12px] leading-relaxed text-[#64748b]">
                                        {selectedLabel ? null : 'Elige una hora'}
                                    </p>
                                ) : null}
                            </div>
                            {selectedLabel && !expanded ? (
                                <span className="shrink-0 rounded-lg bg-brand px-2.5 py-1 text-[12px] font-bold tabular-nums text-white">
                                    {selectedLabel}
                                </span>
                            ) : (
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e5e7eb] bg-[#fafafa] text-[#64748b]">
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
                            'min-h-0 overflow-y-auto overscroll-contain border-t border-[#f0f1f3] bg-white px-4 transition-[opacity,max-height] duration-300',
                            expanded
                                ? cn(bodyMaxHeight, 'pb-4 pt-2.5 opacity-100')
                                : 'max-h-0 border-t-0 pb-0 pt-0 opacity-0',
                        )}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </>
    );
}
