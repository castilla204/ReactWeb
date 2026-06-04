import React from 'react';
import { Check, X } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '../ui/drawer';
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

/**
 * Drawer de filtros para "Mis inspecciones".
 *
 * Rediseño 2026-06: migración completa de `slate-*` a los tokens del sistema
 * (ink #1c1c1c / muted #6a6a6a / línea #e8e8e8 / brand #0066CC). Categorías
 * como pills clickables (no checkbox + icono + texto desalineado), visibilidad
 * como switch real estilo iOS, estado como pills mutuamente excluyentes.
 *
 * Header con cierre explícito (X), footer sticky con Reset + Aplicar.
 */
export const SearchDashboardFiltersSheet: React.FC<SearchDashboardFiltersSheetProps> = ({
    open,
    onOpenChange,
    filters,
    setFilters,
    categories,
}) => {
    const totalCategories = Array.isArray(categories) ? categories.length : 0;
    const selectedCount = filters.selectedCategories.length;
    const allSelected = totalCategories > 0 && selectedCount === totalCategories;

    const resetFilters = () => {
        setFilters((prev) => ({
            ...prev,
            showInactives: false,
            searchHireStatus: '',
            selectedCategories: Array.isArray(categories) ? categories.map((c) => c.id) : [],
        }));
    };

    const toggleCategory = (id: number, checked: boolean) => {
        setFilters((prev) => ({
            ...prev,
            selectedCategories: checked
                ? [...prev.selectedCategories, id]
                : prev.selectedCategories.filter((cid) => cid !== id),
        }));
    };

    const toggleAllCategories = () => {
        if (!Array.isArray(categories)) return;
        setFilters((prev) => ({
            ...prev,
            selectedCategories: allSelected ? [] : categories.map((c) => c.id),
        }));
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent
                className="max-h-[88dvh] rounded-t-2xl border-t border-[#e8e8e8] bg-white"
                style={{ fontFamily: HP_FONT }}
            >
                {/* Header */}
                <DrawerHeader className="border-b border-[#ebebeb] pb-4 pt-3 text-left">
                    <div className="flex items-center justify-between gap-3">
                        <DrawerTitle className="text-[18px] font-semibold tracking-[-0.015em] text-[#1c1c1c]">
                            Filtros
                        </DrawerTitle>
                        <DrawerClose asChild>
                            <button
                                type="button"
                                aria-label="Cerrar"
                                className="flex h-9 w-9 items-center justify-center rounded-full text-[#737373] transition-colors hover:bg-[#fafafa] hover:text-[#1c1c1c]"
                            >
                                <X className="h-4 w-4" strokeWidth={2} aria-hidden />
                            </button>
                        </DrawerClose>
                    </div>
                </DrawerHeader>

                {/* Body */}
                <div className="space-y-7 overflow-y-auto px-5 pb-[88px] pt-5">
                    {/* Categorías como pills */}
                    {totalCategories > 0 && (
                        <section>
                            <div className="mb-3 flex items-baseline justify-between gap-3">
                                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#737373]">
                                    Categorías
                                </h3>
                                <button
                                    type="button"
                                    onClick={toggleAllCategories}
                                    className="text-[12px] font-semibold text-brand underline-offset-4 hover:underline"
                                >
                                    {allSelected ? 'Quitar todas' : 'Seleccionar todas'}
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(categories ?? []).map((category) => {
                                    const checked = filters.selectedCategories.includes(category.id);
                                    return (
                                        <button
                                            key={category.id}
                                            type="button"
                                            role="checkbox"
                                            aria-checked={checked}
                                            onClick={() => toggleCategory(category.id, !checked)}
                                            className={[
                                                'group inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors',
                                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
                                                checked
                                                    ? 'border-brand bg-brand/[0.08] text-brand'
                                                    : 'border-[#e8e8e8] bg-white text-[#1c1c1c] hover:bg-[#fafafa]',
                                            ].join(' ')}
                                        >
                                            <SearchCategoryIcon
                                                categoryName={category.name}
                                                className={`h-4 w-4 object-contain ${checked ? '' : 'opacity-70'}`}
                                            />
                                            <span className="truncate max-w-[160px]">
                                                {category.name || 'Sin nombre'}
                                            </span>
                                            {checked && (
                                                <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Visibilidad como switch real */}
                    <section>
                        <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#737373]">
                            Visibilidad
                        </h3>
                        <label
                            className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-[#e8e8e8] bg-white px-4 py-3.5"
                        >
                            <div className="min-w-0">
                                <div className="text-[14px] font-semibold leading-tight text-[#1c1c1c]">
                                    Inspecciones inactivas
                                </div>
                                <div className="mt-0.5 text-[12px] leading-snug text-[#6a6a6a]">
                                    Incluye las que cancelaste o están sin movimiento.
                                </div>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={filters.showInactives}
                                onClick={() =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        showInactives: !prev.showInactives,
                                    }))
                                }
                                className={[
                                    'relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
                                    filters.showInactives ? 'bg-brand' : 'bg-[#e8e8e8]',
                                ].join(' ')}
                            >
                                <span
                                    className={[
                                        'inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform',
                                        filters.showInactives ? 'translate-x-[18px]' : 'translate-x-0.5',
                                    ].join(' ')}
                                />
                            </button>
                        </label>
                    </section>

                    {/* Estado del servicio como pills mutuamente excluyentes */}
                    <section>
                        <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#737373]">
                            Estado del servicio
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {HIRE_STATUS_OPTIONS.map((status) => {
                                const value = status.value;
                                const checked = filters.searchHireStatus === value;
                                return (
                                    <button
                                        key={value || 'all'}
                                        type="button"
                                        role="radio"
                                        aria-checked={checked}
                                        onClick={() =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                searchHireStatus: value,
                                            }))
                                        }
                                        className={[
                                            'inline-flex items-center rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors',
                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
                                            checked
                                                ? 'border-brand bg-brand text-white'
                                                : 'border-[#e8e8e8] bg-white text-[#1c1c1c] hover:bg-[#fafafa]',
                                        ].join(' ')}
                                    >
                                        {status.label}
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                </div>

                {/* Footer sticky */}
                <div className="sticky bottom-0 border-t border-[#ebebeb] bg-white px-5 py-3">
                    <div className="flex gap-3 pb-[max(0.25rem,env(safe-area-inset-bottom,0px))]">
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="flex-1 rounded-full border border-[#e8e8e8] bg-white py-3 text-[14px] font-semibold text-[#1c1c1c] transition-colors hover:bg-[#fafafa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                        >
                            Restablecer
                        </button>
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 rounded-full bg-brand py-3 text-[14px] font-semibold text-white shadow-[0_4px_16px_hsl(var(--brand)/0.2)] transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                        >
                            Aplicar filtros
                        </button>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
};
