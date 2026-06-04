<<<<<<< Updated upstream
import React from 'react';
=======
import React, { useMemo } from 'react';
>>>>>>> Stashed changes
import { Check, X } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '../ui/drawer';
import { HP_FONT } from '../../constants/homepageTypography';
import { HIRE_STATUS_OPTIONS } from './searchDashboardConstants';
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
<<<<<<< Updated upstream
 * Drawer de filtros para "Mis inspecciones".
 *
 * Rediseño 2026-06: migración completa de `slate-*` a los tokens del sistema
 * (ink #1c1c1c / muted #6a6a6a / línea #e8e8e8 / brand #0066CC). Categorías
 * como pills clickables (no checkbox + icono + texto desalineado), visibilidad
 * como switch real estilo iOS, estado como pills mutuamente excluyentes.
 *
 * Header con cierre explícito (X), footer sticky con Reset + Aplicar.
=======
 * Drawer de filtros de "Mis inspecciones" (v2 — 2026-06).
 *
 * Cambios respecto a v1:
 *  · Pills de categoría compactos (h-8, padding bajo) en lugar de pills enormes
 *    que ocupaban media pantalla.
 *  · Filtramos categorías sin nombre real ("", "Sin nombre", "Sin categoría",
 *    null) — no aparecen como "Sin nombre" + icono carpeta fantasma.
 *  · Sin SearchCategoryIcon en los pills: el nombre + el estado checked
 *    seleccionado bastan; el icono añadía altura sin valor cuando los assets
 *    no matcheaban.
 *  · Overlay del drawer base bajado de bg-black/40 a bg-black/25 (cambio en
 *    drawer.tsx) — el background no queda tan oscuro.
 *  · Switch iOS-style para Visibilidad. Pills para Estado del servicio.
 *  · Footer sticky con safe-area-inset.
>>>>>>> Stashed changes
 */
export const SearchDashboardFiltersSheet: React.FC<SearchDashboardFiltersSheetProps> = ({
    open,
    onOpenChange,
    filters,
    setFilters,
    categories,
}) => {
<<<<<<< Updated upstream
    const totalCategories = Array.isArray(categories) ? categories.length : 0;
    const selectedCount = filters.selectedCategories.length;
    const allSelected = totalCategories > 0 && selectedCount === totalCategories;
=======
    // Filtramos categorías con nombre real. Si el backend devuelve "" o
    // "Sin nombre" no las mostramos: no hay nada útil que ofrecer al usuario.
    const realCategories = useMemo(() => {
        if (!Array.isArray(categories)) return [];
        return categories.filter((c) => {
            const n = (c.name || '').trim();
            if (!n) return false;
            if (/^sin\s+(nombre|categor)/i.test(n)) return false;
            return true;
        });
    }, [categories]);

    const totalReal = realCategories.length;
    const selectedRealCount = realCategories.filter((c) =>
        filters.selectedCategories.includes(c.id),
    ).length;
    const allSelected = totalReal > 0 && selectedRealCount === totalReal;
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
        if (!Array.isArray(categories)) return;
        setFilters((prev) => ({
            ...prev,
            selectedCategories: allSelected ? [] : categories.map((c) => c.id),
        }));
=======
        if (totalReal === 0) return;
        setFilters((prev) => {
            if (allSelected) {
                const realIds = new Set(realCategories.map((c) => c.id));
                return {
                    ...prev,
                    selectedCategories: prev.selectedCategories.filter((id) => !realIds.has(id)),
                };
            }
            const next = new Set(prev.selectedCategories);
            realCategories.forEach((c) => next.add(c.id));
            return { ...prev, selectedCategories: Array.from(next) };
        });
>>>>>>> Stashed changes
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent
<<<<<<< Updated upstream
                className="max-h-[88dvh] rounded-t-2xl border-t border-[#e8e8e8] bg-white"
                style={{ fontFamily: HP_FONT }}
            >
                {/* Header */}
                <DrawerHeader className="border-b border-[#ebebeb] pb-4 pt-3 text-left">
                    <div className="flex items-center justify-between gap-3">
                        <DrawerTitle className="text-[18px] font-semibold tracking-[-0.015em] text-[#1c1c1c]">
=======
                className="max-h-[86dvh] rounded-t-[20px] border-t border-[#e8e8e8] bg-white"
                style={{ fontFamily: HP_FONT }}
            >
                {/* Header compacto */}
                <DrawerHeader className="border-b border-[#ebebeb] pb-3 pt-2 text-left">
                    <div className="flex items-center justify-between gap-3">
                        <DrawerTitle className="text-[17px] font-semibold tracking-[-0.015em] text-[#1c1c1c]">
>>>>>>> Stashed changes
                            Filtros
                        </DrawerTitle>
                        <DrawerClose asChild>
                            <button
                                type="button"
                                aria-label="Cerrar"
<<<<<<< Updated upstream
                                className="flex h-9 w-9 items-center justify-center rounded-full text-[#737373] transition-colors hover:bg-[#fafafa] hover:text-[#1c1c1c]"
=======
                                className="flex h-8 w-8 items-center justify-center rounded-full text-[#737373] transition-colors hover:bg-[#fafafa] hover:text-[#1c1c1c]"
>>>>>>> Stashed changes
                            >
                                <X className="h-4 w-4" strokeWidth={2} aria-hidden />
                            </button>
                        </DrawerClose>
                    </div>
                </DrawerHeader>

                {/* Body */}
<<<<<<< Updated upstream
                <div className="space-y-7 overflow-y-auto px-5 pb-[88px] pt-5">
                    {/* Categorías como pills */}
                    {totalCategories > 0 && (
                        <section>
                            <div className="mb-3 flex items-baseline justify-between gap-3">
                                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#737373]">
=======
                <div className="space-y-6 overflow-y-auto px-5 pb-[92px] pt-4">
                    {/* Categorías como pills compactos. Filtradas: sin "Sin nombre". */}
                    {totalReal > 0 && (
                        <section>
                            <div className="mb-2.5 flex items-baseline justify-between gap-3">
                                <h3 className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#737373]">
>>>>>>> Stashed changes
                                    Categorías
                                </h3>
                                <button
                                    type="button"
                                    onClick={toggleAllCategories}
<<<<<<< Updated upstream
                                    className="text-[12px] font-semibold text-brand underline-offset-4 hover:underline"
=======
                                    className="text-[12px] font-semibold text-brand transition-colors hover:text-brand-hover"
>>>>>>> Stashed changes
                                >
                                    {allSelected ? 'Quitar todas' : 'Seleccionar todas'}
                                </button>
                            </div>
<<<<<<< Updated upstream
                            <div className="flex flex-wrap gap-2">
                                {(categories ?? []).map((category) => {
=======
                            <div className="flex flex-wrap gap-1.5">
                                {realCategories.map((category) => {
>>>>>>> Stashed changes
                                    const checked = filters.selectedCategories.includes(category.id);
                                    return (
                                        <button
                                            key={category.id}
                                            type="button"
                                            role="checkbox"
                                            aria-checked={checked}
                                            onClick={() => toggleCategory(category.id, !checked)}
                                            className={[
<<<<<<< Updated upstream
                                                'group inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors',
=======
                                                'inline-flex h-8 items-center gap-1 rounded-full border px-3 text-[12.5px] font-medium transition-colors',
>>>>>>> Stashed changes
                                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
                                                checked
                                                    ? 'border-brand bg-brand/[0.08] text-brand'
                                                    : 'border-[#e8e8e8] bg-white text-[#1c1c1c] hover:bg-[#fafafa]',
                                            ].join(' ')}
                                        >
<<<<<<< Updated upstream
                                            <SearchCategoryIcon
                                                categoryName={category.name}
                                                className={`h-4 w-4 object-contain ${checked ? '' : 'opacity-70'}`}
                                            />
                                            <span className="truncate max-w-[160px]">
                                                {category.name || 'Sin nombre'}
                                            </span>
                                            {checked && (
                                                <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
=======
                                            <span className="max-w-[140px] truncate">{category.name}</span>
                                            {checked && (
                                                <Check
                                                    className="h-3 w-3 shrink-0"
                                                    strokeWidth={3}
                                                    aria-hidden
                                                />
>>>>>>> Stashed changes
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Visibilidad como switch real */}
                    <section>
<<<<<<< Updated upstream
                        <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#737373]">
                            Visibilidad
                        </h3>
                        <label
                            className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-[#e8e8e8] bg-white px-4 py-3.5"
                        >
=======
                        <h3 className="mb-2.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#737373]">
                            Visibilidad
                        </h3>
                        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-[#e8e8e8] bg-white px-4 py-3">
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
                                    filters.showInactives ? 'bg-brand' : 'bg-[#e8e8e8]',
=======
                                    filters.showInactives ? 'bg-brand' : 'bg-[#e0e0e0]',
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
                    {/* Estado del servicio como pills mutuamente excluyentes */}
                    <section>
                        <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#737373]">
                            Estado del servicio
                        </h3>
                        <div className="flex flex-wrap gap-2">
=======
                    {/* Estado del servicio como pills compactos mutuamente excluyentes */}
                    <section>
                        <h3 className="mb-2.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#737373]">
                            Estado del servicio
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
                                            'inline-flex items-center rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors',
=======
                                            'inline-flex h-8 items-center rounded-full border px-3 text-[12.5px] font-medium transition-colors',
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
                {/* Footer sticky */}
=======
                {/* Footer sticky con CTAs */}
>>>>>>> Stashed changes
                <div className="sticky bottom-0 border-t border-[#ebebeb] bg-white px-5 py-3">
                    <div className="flex gap-3 pb-[max(0.25rem,env(safe-area-inset-bottom,0px))]">
                        <button
                            type="button"
                            onClick={resetFilters}
<<<<<<< Updated upstream
                            className="flex-1 rounded-full border border-[#e8e8e8] bg-white py-3 text-[14px] font-semibold text-[#1c1c1c] transition-colors hover:bg-[#fafafa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
=======
                            className="flex-1 rounded-full border border-[#e8e8e8] bg-white py-2.5 text-[13.5px] font-semibold text-[#1c1c1c] transition-colors hover:bg-[#fafafa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
>>>>>>> Stashed changes
                        >
                            Restablecer
                        </button>
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
<<<<<<< Updated upstream
                            className="flex-1 rounded-full bg-brand py-3 text-[14px] font-semibold text-white shadow-[0_4px_16px_hsl(var(--brand)/0.2)] transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
=======
                            className="flex-1 rounded-full bg-brand py-2.5 text-[13.5px] font-semibold text-white shadow-[0_4px_16px_hsl(var(--brand)/0.2)] transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
>>>>>>> Stashed changes
                        >
                            Aplicar filtros
                        </button>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
};
