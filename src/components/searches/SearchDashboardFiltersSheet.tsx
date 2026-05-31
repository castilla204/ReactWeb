import React from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '../ui/drawer';
import { HP_FONT } from '../../constants/homepageTypography';
import { HIRE_STATUS_OPTIONS } from './searchDashboardConstants';
import { SearchCategoryIcon } from './searchCategoryIcon';
import type { SearchDashboardFilters } from '../../hooks/useSearchDashboard';

interface Category {
    id: number;
    name: string;
}

interface SearchDashboardFiltersSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters: SearchDashboardFilters;
    setFilters: React.Dispatch<React.SetStateAction<SearchDashboardFilters>>;
    categories: Category[] | undefined;
}

export const SearchDashboardFiltersSheet: React.FC<SearchDashboardFiltersSheetProps> = ({
    open,
    onOpenChange,
    filters,
    setFilters,
    categories,
}) => {
    const resetFilters = () => {
        setFilters((prev) => ({
            ...prev,
            showInactives: false,
            searchHireStatus: '',
            selectedCategories: Array.isArray(categories) ? categories.map((c) => c.id) : [],
        }));
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[85dvh] rounded-t-2xl">
                <DrawerHeader className="border-b border-slate-100 pb-4 text-left">
                    <DrawerTitle className="text-lg font-semibold text-slate-900" style={{ fontFamily: HP_FONT }}>
                        Filtros
                    </DrawerTitle>
                </DrawerHeader>
                <div className="space-y-6 overflow-y-auto px-4 pb-8 pt-2" style={{ fontFamily: HP_FONT }}>
                    <section>
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Categorías
                        </h3>
                        <div className="space-y-1">
                            {Array.isArray(categories) &&
                                categories.map((category) => {
                                    const checked = filters.selectedCategories.includes(category.id);
                                    return (
                                        <label
                                            key={category.id}
                                            className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={(e) => {
                                                    setFilters((prev) => {
                                                        if (e.target.checked) {
                                                            return {
                                                                ...prev,
                                                                selectedCategories: [
                                                                    ...prev.selectedCategories,
                                                                    category.id,
                                                                ],
                                                            };
                                                        }
                                                        return {
                                                            ...prev,
                                                            selectedCategories: prev.selectedCategories.filter(
                                                                (id) => id !== category.id,
                                                            ),
                                                        };
                                                    });
                                                }}
                                                className="rounded border-slate-300 text-[#0066CC] focus:ring-[#0066CC]"
                                            />
                                            <SearchCategoryIcon
                                                categoryName={category.name}
                                                className="h-7 w-7 object-contain"
                                            />
                                            <span className="text-sm text-slate-800">{category.name}</span>
                                        </label>
                                    );
                                })}
                        </div>
                    </section>

                    <section>
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Visibilidad
                        </h3>
                        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                            <span className="text-sm text-slate-800">Incluir inspecciones inactivas</span>
                            <input
                                type="checkbox"
                                checked={filters.showInactives}
                                onChange={(e) =>
                                    setFilters((prev) => ({ ...prev, showInactives: e.target.checked }))
                                }
                                className="rounded border-slate-300 text-[#0066CC] focus:ring-[#0066CC]"
                            />
                        </label>
                    </section>

                    <section>
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Estado del servicio
                        </h3>
                        <div className="space-y-1">
                            {HIRE_STATUS_OPTIONS.map((status) => (
                                <label
                                    key={status.value || 'all'}
                                    className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50"
                                >
                                    <input
                                        type="radio"
                                        name="hireStatusFilter"
                                        checked={filters.searchHireStatus === status.value}
                                        onChange={() =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                searchHireStatus: status.value,
                                            }))
                                        }
                                        className="border-slate-300 text-[#0066CC] focus:ring-[#0066CC]"
                                    />
                                    <span className="text-sm text-slate-800">{status.label}</span>
                                </label>
                            ))}
                        </div>
                    </section>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-700"
                        >
                            Restablecer
                        </button>
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 rounded-xl bg-[#0066CC] py-3 text-sm font-semibold text-white"
                        >
                            Aplicar
                        </button>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
};
