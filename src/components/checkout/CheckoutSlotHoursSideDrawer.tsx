import React from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '../ui/sheet';
import { cn } from '../../lib/utils';

interface CheckoutSlotHoursSideDrawerProps {
    open: boolean;
    dateLabel: string;
    selectedLabel?: string | null;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}

/** Panel lateral de horas al elegir día (checkout desktop). */
export function CheckoutSlotHoursSideDrawer({
    open,
    dateLabel,
    selectedLabel,
    onOpenChange,
    children,
}: CheckoutSlotHoursSideDrawerProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className={cn(
                    'flex w-[min(20rem,92vw)] max-w-[20rem] flex-col gap-0 border-line p-0 sm:max-w-[20rem]',
                    '[&>button]:right-4 [&>button]:top-4 [&>button]:rounded-full [&>button]:border [&>button]:border-line [&>button]:bg-white [&>button]:opacity-100',
                )}
            >
                <SheetHeader className="space-y-1 border-b border-line px-5 pb-4 pr-14 pt-5 text-left">
                    <SheetTitle className="text-body font-semibold capitalize leading-snug tracking-[-0.01em] text-ink-strong">
                        {dateLabel}
                    </SheetTitle>
                    <SheetDescription className="text-meta text-ink-muted">
                        {selectedLabel ? (
                            <>
                                Hora elegida:{' '}
                                <span className="font-semibold tabular-nums text-brand">{selectedLabel}</span>
                            </>
                        ) : (
                            'Elige un hueco libre'
                        )}
                    </SheetDescription>
                </SheetHeader>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
                    {children}
                </div>
            </SheetContent>
        </Sheet>
    );
}
