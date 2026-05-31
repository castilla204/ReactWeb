import React, { useMemo, useState } from 'react';
import { AlertCircle, ClipboardList, Plus, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from './ui/button';
import { useSearchDashboard } from '../hooks/useSearchDashboard';
import { HP_FONT, HP_SERVICE_CTA_CLASS } from '../constants/homepageTypography';
import { SearchDashboardSkeleton } from './searches/SearchDashboardSkeleton';
import { SearchDashboardToolbar } from './searches/SearchDashboardToolbar';
import { SearchDashboardFiltersSheet } from './searches/SearchDashboardFiltersSheet';
import { SearchInspectionListItem } from './searches/SearchInspectionListItem';

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
            <div className="flex min-h-screen items-center justify-center bg-white p-6 pb-[65px]">
                <div className="max-w-sm text-center">
                    <AlertCircle className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                    <p className="text-sm text-slate-600" style={{ fontFamily: HP_FONT }}>
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
        <div className="min-h-screen bg-slate-50/80 pb-[65px] md:bg-white md:pb-10">
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

            <main className="mx-auto w-full max-w-3xl px-4 py-4 md:max-w-4xl md:px-6 md:py-6">
                {isNetworkErr ? (
                    <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
                        <WifiOff className="mx-auto mb-3 h-9 w-9 text-slate-400" />
                        <p className="text-sm font-medium text-slate-800" style={{ fontFamily: HP_FONT }}>
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
                            <p className="text-[13px] font-medium text-slate-500" style={{ fontFamily: HP_FONT }}>
                                {countLabel}
                            </p>
                            {isAdmin && pagination && pagination.totalPages > 1 && (
                                <p className="text-[12px] text-slate-400" style={{ fontFamily: HP_FONT }}>
                                    Pág. {pagination.currentPage}/{pagination.totalPages}
                                </p>
                            )}
                        </div>

                        {searches.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                                    <ClipboardList className="h-6 w-6 text-slate-500" strokeWidth={1.5} />
                                </div>
                                <h2
                                    className="text-base font-semibold text-slate-900"
                                    style={{ fontFamily: HP_FONT }}
                                >
                                    No hay inspecciones
                                </h2>
                                <p className="mx-auto mt-1.5 max-w-xs text-sm text-slate-500" style={{ fontFamily: HP_FONT }}>
                                    Contrata una revisión desde el inicio o cambia los filtros aplicados
                                </p>
                                <button
                                    type="button"
                                    onClick={goToCreateInspection}
                                    className={`${HP_SERVICE_CTA_CLASS} mt-6`}
                                >
                                    <Plus className="mr-2 inline h-4 w-4" />
                                    Nueva inspección
                                </button>
                            </div>
                        ) : (
                            <ul className="flex flex-col gap-2 md:gap-2.5">
                                {searches.map((search) => (
                                    <li key={search.id}>
                                        <SearchInspectionListItem
                                            search={search}
                                            categoryLabel={
                                                search.categoryName || getCategoryName(search.category)
                                            }
                                            onClick={() => handleSearchClick(search.id)}
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
                                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
                                >
                                    Anterior
                                </button>
                                <button
                                    type="button"
                                    disabled={!pagination.hasNext}
                                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
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
