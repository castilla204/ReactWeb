import React, { useMemo, useState } from 'react';
import { AlertCircle, ClipboardList, Plus, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from './ui/button';
import { useSearchDashboard } from '../hooks/useSearchDashboard';
import { HP_FONT, HP_SERVICE_CTA_CLASS } from '../constants/homepageTypography';
import { SearchDashboardSkeleton } from './searches/SearchDashboardSkeleton';
import { SearchDashboardToolbar } from './searches/SearchDashboardToolbar';
import { SearchDashboardFiltersSheet } from './searches/SearchDashboardFiltersSheet';
import { SearchInspectionListItem } from './searches/SearchInspectionListItem';

/**
 * SearchDashboard — "La bandeja del despacho" (rediseño 2026-06).
 *
 * Orquestador de /busquedas. Renderiza toolbar + sheet de filtros + lista
 * de fichas de informe (SearchInspectionListItem) o estado vacío con sello
 * brand. La voz visual completa vive en SearchInspectionListItem; aquí solo
 * componemos.
 */

function countActiveFilters(
    filters: ReturnType<typeof useSearchDashboard>['filters'],
    totalCategories: number,
): number {
    let n = 0;
    if (filters.showInactives) n += 1;
    if (filters.searchHireStatus) n += 1;
    if (totalCategories > 0 && filters.selectedCategories.length < totalCategories) n += 1;
    return n;
}

const SearchDashboard: React.FC = () => {
    const [filtersOpen, setFiltersOpen] = useState(false);
    const {
        isAdmin,
        categories,
        filters,
        setFilters,
        searchInput,
        searchInputRef,
        handleSearchChange,
        handleSearchFocus,
        handleSearchBlur,
        searches,
        pagination,
        loading,
        isFetching,
        isNetworkErr,
        error,
        getCategoryName,
        handleSearchClick,
        goToCreateInspection,
        clearSearch,
        refetch,
        navigate,
    } = useSearchDashboard();

    const totalCategories = categories?.length ?? 0;
    const activeFilterCount = useMemo(
        () => countActiveFilters(filters, totalCategories),
        [filters, totalCategories],
    );

    if (loading) {
        return <SearchDashboardSkeleton />;
    }

    if (error && !isNetworkErr) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white p-6 pb-[calc(65px+env(safe-area-inset-bottom,0px))]">
                <div className="max-w-sm text-center">
                    <AlertCircle className="mx-auto mb-3 h-10 w-10 text-[#cccccc]" />
                    <p className="text-sm text-[#6a6a6a]" style={{ fontFamily: HP_FONT }}>
                        {error instanceof Error ? error.message : 'Error al cargar las inspecciones'}
                    </p>
                    <Button type="button" onClick={refetch} variant="outline" className="mt-4 rounded-lg">
                        Reintentar
                    </Button>
                </div>
            </div>
        );
    }

    const countLabel =
        isAdmin && pagination
            ? `${pagination.totalCount} resultado${pagination.totalCount !== 1 ? 's' : ''}`
            : `${searches.length} inspección${searches.length !== 1 ? 'es' : ''}`;

    return (
        <div className="min-h-screen bg-[#fafafa] pb-[calc(65px+env(safe-area-inset-bottom,0px))] md:pb-10">
            <SearchDashboardToolbar
                searchInput={searchInput}
                searchInputRef={searchInputRef}
                activeFilterCount={activeFilterCount}
                isFetching={isFetching}
                onSearchChange={handleSearchChange}
                onSearchFocus={handleSearchFocus}
                onSearchBlur={handleSearchBlur}
                onBack={() => navigate('/')}
                onCreate={goToCreateInspection}
                onOpenFilters={() => setFiltersOpen(true)}
                onClearSearch={clearSearch}
            />

            <SearchDashboardFiltersSheet
                open={filtersOpen}
                onOpenChange={setFiltersOpen}
                filters={filters}
                setFilters={setFilters}
                categories={categories}
            />

            <main className="mx-auto w-full max-w-3xl px-4 py-4 md:max-w-5xl md:px-6 md:py-6 lg:max-w-6xl">
                {isNetworkErr ? (
                    <div className="rounded-xl border border-[#e8e8e8] bg-white px-6 py-16 text-center">
                        <WifiOff className="mx-auto mb-3 h-9 w-9 text-[#737373]" />
                        <p className="text-sm font-medium text-[#1c1c1c]" style={{ fontFamily: HP_FONT }}>
                            Sin conexión
                        </p>
                        <Button type="button" onClick={refetch} variant="outline" className="mt-4 rounded-lg">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reintentar
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="mb-3 flex items-center justify-between">
                            <p className="text-[13px] font-medium text-[#6a6a6a]" style={{ fontFamily: HP_FONT }}>
                                {countLabel}
                            </p>
                            {isAdmin && pagination && pagination.totalPages > 1 && (
                                <p className="text-[12px] text-[#737373]" style={{ fontFamily: HP_FONT }}>
                                    Pág. {pagination.currentPage}/{pagination.totalPages}
                                </p>
                            )}
                        </div>

                        {searches.length === 0 ? (
                            <div className="w-full px-6 py-12 text-center md:py-16">
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f5f5f5]">
                                    <ClipboardList className="h-6 w-6 text-[#737373]" strokeWidth={1.5} aria-hidden />
                                </div>

                                <h2
                                    className="text-[18px] font-semibold tracking-[-0.015em] text-[#1c1c1c] md:text-[20px]"
                                    style={{ fontFamily: HP_FONT }}
                                >
                                    Aún no tienes inspecciones
                                </h2>
                                <p
                                    className="mx-auto mt-2 max-w-md text-[14px] leading-snug text-[#6a6a6a]"
                                    style={{ fontFamily: HP_FONT }}
                                >
                                    Cuando contrates una revisión, aparecerá aquí con su
                                    número de informe, su estado y el experto asignado.
                                </p>
                                <button
                                    type="button"
                                    onClick={goToCreateInspection}
                                    className={`${HP_SERVICE_CTA_CLASS} mt-6`}
                                >
                                    <Plus className="mr-2 inline h-4 w-4" />
                                    Pedir mi primera revisión
                                </button>
                            </div>
                        ) : (
                            // Grid 2-col desktop (auto-fit minmax 420px) para que las cards
                            // dejen de ser slabs de ancho completo. Stack vertical en mobile.
                            // gap-y-9 (36px) deja espacio limpio para que la pestaña de la
                            // siguiente fila no quede tapada por la card de arriba.
                            <ul
                                className="grid gap-x-4 gap-y-9 pt-3"
                                style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))' }}
                            >
                                {searches.map((search) => (
                                    <li key={search.id}>
                                        <SearchInspectionListItem
                                            search={search}
                                            categoryLabel={
                                                search.categoryName || getCategoryName(search.category)
                                            }
                                            onClick={() => handleSearchClick(search)}
                                            highlightUnreviewed={isAdmin && !search.isRevised}
                                        />
                                    </li>
                                ))}
                            </ul>
                        )}

                        {isAdmin && pagination && pagination.totalPages > 1 && (
                            <nav
                                className="mt-8 flex items-center justify-center gap-2"
                                style={{ fontFamily: HP_FONT }}
                                aria-label="Paginación"
                            >
                                <button
                                    type="button"
                                    disabled={!pagination.hasPrevious}
                                    className="rounded-lg border border-[#e8e8e8] bg-white px-4 py-2 text-sm font-medium text-[#1c1c1c] hover:bg-[#fafafa] transition-colors disabled:opacity-40 disabled:hover:bg-white"
                                >
                                    Anterior
                                </button>
                                <button
                                    type="button"
                                    disabled={!pagination.hasNext}
                                    className="rounded-lg border border-[#e8e8e8] bg-white px-4 py-2 text-sm font-medium text-[#1c1c1c] hover:bg-[#fafafa] transition-colors disabled:opacity-40 disabled:hover:bg-white"
                                >
                                    Siguiente
                                </button>
                            </nav>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export { SearchDashboard };
