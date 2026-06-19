import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { SD_CHECKOUT_EMBEDDED_SECTION_TITLE_CLASS } from '../../constants/homepageTypography';

export function CheckoutEmbeddedStepHeader({
    step,
    title,
    description,
    className,
    borderedTop = false,
}: {
    step: number;
    title: string;
    description: ReactNode;
    className?: string;
    borderedTop?: boolean;
}) {
    return (
        <div
            className={cn(
                SD_CHECKOUT_EMBEDDED_SECTION_TITLE_CLASS,
                borderedTop && 'border-t border-[#eceef2] pt-4',
                className,
            )}
        >
            <div className="flex items-start gap-2.5">
                <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[12px] font-bold tabular-nums text-brand"
                    aria-hidden
                >
                    {step}
                </span>
                <div className="min-w-0 flex-1">
                    <h3 className="text-[14px] font-semibold tracking-[-0.02em] text-[#1c1c1c]">
                        {title}
                    </h3>
                    <p className="mt-1 max-w-none text-[13px] leading-[1.55] text-[#475569]">
                        {description}
                    </p>
                </div>
            </div>
        </div>
    );
}
