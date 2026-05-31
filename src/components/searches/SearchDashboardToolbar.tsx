import React from 'react';
import { ArrowLeft, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { HP_FONT, SD_PAGE_INNER_MAX_CLASS } from '../../constants/homepageTypography';

interface SearchDashboardToolbarProps {
    searchInput: string;
    searchInputRef: React.RefObject<HTMLInputElement | null>;
    activeFilterCount: number;
    isFetching?: boolean;
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSearchFocus: () => void;
    onSearchBlur: () => void;
    onBack: () => void;
    onCreate: () => void;
    onOpenFilters: () => void;
    onClearSearch: () => void;
}

export const SearchDashboardToolbar: React.FC<SearchDashboardToolbarProps> = ({
    searchInput,
    searchInputRef,
    activeFilterCount,
    isFetching = false,
    onSearchChange,
    onSearchFocus,
    onSearchBlur,
    onBack,
    onCreate,
    onOpenFilters,
    onClearSearch,
}) => (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className={`${SD_PAGE_INNER_MAX_CLASS} max-w-3xl md:max-w-4xl`}>
            <div className="flex items-center gap-3 py-3.5">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100"
                    aria-label="Volver"
                >
                    <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
                </button>
                <div className="min-w-0 flex-1">
                    <h1
                        className="text-[17px] font-semibold tracking-tight text-slate-900"
                        style={{ fontFamily: HP_FONT }}
                    >
                        Mis inspecciones
                    </h1>
                    <p className="text-[12px] text-slate-500" style={{ fontFamily: HP_FONT }}>
                        Seguimiento de tus revisiones contratadas
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onCreate}
                    className="hidden shrink-0 items-center gap-1.5 rounded-lg bg-[#0066CC] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#005bb5] sm:inline-flex"
                    style={{ fontFamily: HP_FONT }}
                >
                    <Plus className="h-4 w-4" strokeWidth={2} />
                    Nueva
                </button>
                <button
                    type="button"
                    onClick={onCreate}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0066CC] text-white sm:hidden"
                    aria-label="Nueva inspección"
                >
                    <Plus className="h-5 w-5" strokeWidth={2} />
                </button>
            </div>

            <div className="flex gap-2 pb-3.5">
                <div className="relative flex min-w-0 flex-1 items-center rounded-xl bg-slate-100/90 ring-1 ring-slate-200/60 focus-within:bg-white focus-within:ring-[#0066CC]/30">
                    <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" strokeWidth={2} />
                    <input
                        ref={searchInputRef}
                        type="search"
                        value={searchInput}
                        onChange={onSearchChange}
                        onFocus={onSearchFocus}
                        onBlur={onSearchBlur}
                        placeholder="Buscar inspección…"
                        className="h-11 w-full border-0 bg-transparent pl-10 pr-9 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                        style={{ fontFamily: HP_FONT }}
                    />
                    {searchInput ? (
                        <button
                            type="button"
                            onClick={onClearSearch}
                            className="absolute right-2 flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
                            aria-label="Borrar"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    ) : isFetching ? (
                        <div
                            className="absolute right-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-[#0066CC]"
                            aria-label="Buscando"
                        />
                    ) : null}
                </div>
                <button
                    type="button"
                    onClick={onOpenFilters}
                    className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50"
                    aria-label="Filtros"
                >
                    <SlidersHorizontal className="h-[18px] w-[18px]" strokeWidth={1.75} />
                    {activeFilterCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#0066CC] px-1 text-[10px] font-bold text-white">
                            {activeFilterCount}
                        </span>
                    )}
                </button>
            </div>
        </div>
    </header>
);
