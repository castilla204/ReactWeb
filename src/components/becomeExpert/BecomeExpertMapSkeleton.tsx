import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export function BecomeExpertMapSkeleton({ className = 'h-[260px] sm:h-[300px]' }: { className?: string }) {
    return (
        <SkeletonTheme baseColor="#f3f4f6" highlightColor="#e5e7eb" duration={1.2}>
            <div className={className} aria-hidden>
                <Skeleton height="100%" borderRadius={0} />
            </div>
        </SkeletonTheme>
    );
}
