import { SileoSkeleton } from '../ui/sileo-skeleton';

export function BecomeExpertMapSkeleton({ className = 'h-[260px] sm:h-[300px]' }: { className?: string }) {
    return (
        <div className={className} aria-hidden>
            <SileoSkeleton className="h-full w-full rounded-none" />
        </div>
    );
}
