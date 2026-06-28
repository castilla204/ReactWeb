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
                'shrink-0 px-0.5 pb-1 pt-0.5 lg:pb-1.5 lg:pt-1',
                className,
            )}
        >
            <div className="flex items-start gap-2.5">
                {onBack ? (
                    <button
                        type="button"
                        onClick={onBack}
                        className="group/back mt-px grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#e6e9ef] bg-white text-[#475569] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 hover:border-[#cdd3db] hover:bg-[#f7f8fa] hover:text-[#1c1c1c] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:ring-offset-2"
                        aria-label="Volver"
                    >
                        <ArrowLeft
                            className="h-[18px] w-[18px] transition-transform duration-200 group-hover/back:-translate-x-0.5"
                            strokeWidth={2.1}
                            aria-hidden
                        />
                    </button>
                ) : null}
                <div className="min-w-0 flex-1">
                    <h2 className="text-[17px] font-semibold leading-snug tracking-[-0.02em] text-[#1c1c1c] lg:text-[19px]">
                        {title}
                    </h2>
                    <p className="mt-1 max-w-2xl text-[13px] leading-[1.5] text-[#565d6b] lg:mt-1.5 lg:text-[14px]">{description}</p>
                </div>
            </div>
        </header>
    );
}
