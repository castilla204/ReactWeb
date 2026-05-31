import React from 'react';
import { SD_PAGE_INNER_MAX_CLASS } from '../../constants/homepageTypography';

export const SearchDashboardSkeleton: React.FC = () => (
    <div className="min-h-screen bg-white pb-[65px]">
        <div className="border-b border-slate-200 px-4 py-4">
            <div className="mx-auto max-w-3xl space-y-3">
                <div className="flex gap-3">
                    <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-100" />
                    <div className="flex-1 space-y-2">
                        <div className="h-5 w-36 animate-pulse rounded bg-slate-100" />
                        <div className="h-3 w-48 animate-pulse rounded bg-slate-100" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="h-11 flex-1 animate-pulse rounded-xl bg-slate-100" />
                    <div className="h-11 w-11 animate-pulse rounded-xl bg-slate-100" />
                </div>
            </div>
        </div>
        <div className={`${SD_PAGE_INNER_MAX_CLASS} mx-auto max-w-3xl space-y-2 py-4`}>
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-3 rounded-xl border border-slate-100 p-3">
                    <div className="h-[72px] w-[72px] animate-pulse rounded-lg bg-slate-100" />
                    <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);
