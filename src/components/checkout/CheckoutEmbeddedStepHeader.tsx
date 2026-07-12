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
                borderedTop && 'border-t border-line pt-4',
                className,
            )}
        >
            <div className="flex items-start gap-3">
                <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-caption font-semibold tabular-nums text-white"
                    aria-hidden
                >
                    {step}
                </span>
                <div className="min-w-0 flex-1">
                    <h3 className="text-lead font-semibold tracking-[-0.01em] text-ink-strong">
                        {title}
                    </h3>
                    <p className="mt-0.5 max-w-none text-meta leading-[1.5] text-ink-muted">
                        {description}
                    </p>
                </div>
            </div>
        </div>
    );
}
