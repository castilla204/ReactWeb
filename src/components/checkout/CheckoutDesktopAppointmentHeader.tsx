import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function CheckoutDesktopAppointmentHeader({
    title,
    description,
    onBack,
    className,
}: {
    title: string;
    description: ReactNode;
    onBack?: () => void;
    className?: string;
}) {
    return (
        <header
            className={cn(
                'shrink-0 bg-white px-3.5 pb-3.5 pt-3 lg:px-5 lg:pb-4 lg:pt-4',
                className,
            )}
        >
            <div className="flex items-start gap-2.5">
                {onBack ? (
                    <button
                        type="button"
                        onClick={onBack}
                        className="sd-icon-btn mt-px shrink-0"
                        aria-label="Volver"
                    >
                        <ArrowLeft className="h-5 w-5" strokeWidth={2.1} aria-hidden />
                    </button>
                ) : null}
                <div className="min-w-0 flex-1">
                    <h2 className="text-[17px] font-semibold leading-snug tracking-[-0.02em] text-[#1c1c1c]">
                        {title}
                    </h2>
                    <p className="mt-1 max-w-2xl text-[13px] leading-[1.5] text-[#565d6b]">{description}</p>
                </div>
            </div>
        </header>
    );
}
