import React from 'react';
import { ChevronRight, MessageSquare } from 'lucide-react';
import StatusBadge from '../StatusBadge';
import { getStatusInfoWithFallback } from '../../utils/statusUtils';
import { HP_FONT } from '../../constants/homepageTypography';
import type { SearchItem } from '../../hooks/useSearch.hooks';
import { SearchCategoryIcon } from './searchCategoryIcon';

function resolveStatusInfo(search: SearchItem) {
    if (!search.searchHire) return null;
    const info = getStatusInfoWithFallback(search.searchHire.statusInfo, search.searchHire.status);
    if (search.searchHire.status === 'pending' || info?.statusValue === 'pending') {
        return { ...info, statusTranslated: 'Servicio activo' };
    }
    return info;
}

function formatDate(iso: string) {
    try {
        return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(
            new Date(iso),
        );
    } catch {
        return '';
    }
}

export interface SearchInspectionListItemProps {
    search: SearchItem;
    categoryLabel: string;
    onClick: () => void;
    highlightUnreviewed?: boolean;
}

export const SearchInspectionListItem: React.FC<SearchInspectionListItemProps> = ({
    search,
    categoryLabel,
    onClick,
    highlightUnreviewed = false,
}) => {
    const statusInfo = resolveStatusInfo(search);
    const hasUnread = search.unreadMessagesCount > 0;
    const dateLabel = search.createdAt ? formatDate(search.createdAt) : null;

    return (
        <button
            type="button"
            onClick={onClick}
            className={`group flex w-full items-center gap-3.5 rounded-xl border bg-white p-3 text-left transition-all hover:border-slate-300 hover:shadow-sm active:bg-slate-50/80 md:gap-4 md:p-4 ${
                highlightUnreviewed ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200/90'
            }`}
            style={{ fontFamily: HP_FONT }}
        >
            <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg bg-slate-100 md:h-20 md:w-20">
                {search.serviceImageUrl ? (
                    <img
                        src={search.serviceImageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-50">
                        <SearchCategoryIcon categoryName={categoryLabel} className="h-9 w-9 object-contain opacity-80" />
                    </div>
                )}
                {hasUnread && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#0066CC] ring-2 ring-white">
                        <MessageSquare className="h-2.5 w-2.5 text-white" strokeWidth={2.5} />
                    </span>
                )}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-slate-900">
                        {search.title}
                    </h3>
                    {statusInfo && (
                        <div className="hidden shrink-0 sm:block">
                            <StatusBadge statusInfo={statusInfo} size="sm" />
                        </div>
                    )}
                </div>

                <p className="mt-0.5 truncate text-[13px] text-slate-500">
                    {categoryLabel}
                    {search.expertCity ? ` · ${search.expertCity}` : ''}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                    {statusInfo && (
                        <div className="sm:hidden">
                            <StatusBadge statusInfo={statusInfo} size="sm" />
                        </div>
                    )}
                    {hasUnread && (
                        <span className="text-[12px] font-medium text-[#0066CC]">
                            {search.unreadMessagesCount}{' '}
                            {search.unreadMessagesCount === 1 ? 'mensaje nuevo' : 'mensajes nuevos'}
                        </span>
                    )}
                    {dateLabel && (
                        <span className="text-[12px] text-slate-400">{dateLabel}</span>
                    )}
                    {search.hasPendingAppointment && (
                        <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200/80">
                            Cita pendiente
                        </span>
                    )}
                </div>
            </div>

            <ChevronRight
                className="h-5 w-5 shrink-0 text-slate-300 transition-colors group-hover:text-slate-500"
                strokeWidth={1.75}
                aria-hidden
            />
        </button>
    );
};
