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

/**
 * Toolbar de "Mis inspecciones" — UNA SOLA FILA.
 *
 * Estructura desktop (≥md):
 *   [← Volver] [Mis inspecciones] [search ════════] [Filtros (n)] [+ Nueva]
 *
 * Estructura mobile (<md): mismo layout, sin el título (contexto implícito
 * porque el usuario ya está en /busquedas), tamaños compactos:
 *   [←] [search ════════] [filtros] [+]
 *
 * Sin glassmorphism, sin subtítulo redundante. Pildoras coherentes con
 * DESIGN.md (rounded-full + brand para primary, border-line para
 * secondary).
 */
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
    <header
        // En desktop el topbar global de la homepage (sticky top-0, h-12) va encima:
        // este toolbar se pega debajo con md:top-12. En móvil ese topbar está oculto,
        // así que aquí seguimos pegados arriba (top-0).
        className="sticky top-0 z-30 border-b border-line bg-white md:top-12"
        style={{ fontFamily: HP_FONT }}
    >
        <div className={`${SD_PAGE_INNER_MAX_CLASS} max-w-5xl lg:max-w-6xl`}>
            <div className="flex items-center gap-2 py-3 sm:gap-3 md:py-3.5">
                {/* Back */}
                <button
                    type="button"
                    onClick={onBack}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-strong transition-colors hover:bg-surface-tinted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                    aria-label="Volver"
                >
                    <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={1.75} />
                </button>

                {/* Título — solo desktop. En mobile el contexto es implícito */}
                <h1 className="hidden shrink-0 text-title font-semibold tracking-[-0.015em] text-ink-strong md:block md:text-title">
                    Mis inspecciones
                </h1>

                {/* Search ocupa todo el ancho disponible */}
                <div className="relative flex min-w-0 flex-1 items-center">
                    <Search
                        className="pointer-events-none absolute left-3.5 h-4 w-4 text-ink-muted"
                        strokeWidth={2}
                        aria-hidden
                    />
                    <input
                        ref={searchInputRef}
                        type="search"
                        value={searchInput}
                        onChange={onSearchChange}
                        onFocus={onSearchFocus}
                        onBlur={onSearchBlur}
                        placeholder="Buscar por bien, ciudad, experto…"
                        className="h-10 w-full rounded-full border border-line bg-white pl-10 pr-9 text-body text-ink-strong placeholder:text-ink-muted transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
                    />
                    {searchInput ? (
                        <button
                            type="button"
                            onClick={onClearSearch}
                            className="absolute right-1 flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-surface-tinted hover:text-ink-strong"
                            aria-label="Borrar búsqueda"
                        >
                            <X className="h-4 w-4" strokeWidth={2} />
                        </button>
                    ) : isFetching ? (
                        <div
                            className="absolute right-3 h-4 w-4 animate-spin rounded-full border-2 border-line border-t-brand"
                            role="status"
                            aria-label="Buscando"
                        />
                    ) : null}
                </div>

                {/* Filtros pill: en mobile icon-only (h-10 w-10), en sm+ con texto */}
                <button
                    type="button"
                    onClick={onOpenFilters}
                    className="relative flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full border border-line bg-white text-ink-strong transition-colors hover:bg-surface-tinted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 sm:px-4 w-10 sm:w-auto"
                    aria-label={
                        activeFilterCount > 0
                            ? `Filtros (${activeFilterCount} activos)`
                            : 'Filtros'
                    }
                >
                    <SlidersHorizontal className="h-[15px] w-[15px]" strokeWidth={2} aria-hidden />
                    <span className="hidden text-meta font-medium sm:inline">Filtros</span>
                    {activeFilterCount > 0 && (
                        <span
                            className="ml-0.5 hidden h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-badge font-bold leading-none text-white sm:inline-flex"
                            aria-hidden
                        >
                            {activeFilterCount}
                        </span>
                    )}
                    {activeFilterCount > 0 && (
                        <span
                            className="absolute -right-0.5 -top-0.5 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-brand px-1 text-badge font-bold leading-none text-white sm:hidden"
                            aria-hidden
                        >
                            {activeFilterCount}
                        </span>
                    )}
                </button>

                {/* Nueva CTA brand: en mobile icon-only, en sm+ con texto */}
                <button
                    type="button"
                    onClick={onCreate}
                    className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-brand text-white shadow-[0_4px_16px_hsl(var(--brand)/0.2)] transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 sm:px-4 w-10 sm:w-auto"
                    aria-label="Nueva inspección"
                >
                    <Plus className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
                    <span className="hidden text-meta font-semibold sm:inline">Nueva</span>
                </button>
            </div>
        </div>
    </header>
);
