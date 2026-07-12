import React, { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '../ui/drawer';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '../ui/sheet';
import { HP_FONT } from '../../constants/homepageTypography';
import { HIRE_STATUS_OPTIONS } from './searchDashboardConstants';
import { useIsMobile } from '../../hooks/useIsMobile';
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
 * Filtros de "Mis inspecciones" — responsive:
 *
 *   · Mobile (<md): Drawer (Vaul) bottom-sheet con handle.
 *   · Desktop (≥md): Sheet (Radix Dialog) lateral derecho ~420px.
 *
 * Foco al abrir: dejamos que Vaul (autoFocus) y Radix Dialog (por defecto)
 * muevan el focus al primer elemento focusable del contenido — que es el
 * botón "X" (cerrar). Eso saca el focus del botón "Filtros" que disparó el
 * modal y queda bajo `<main aria-hidden>`, resolviendo el warning de a11y
 * sin necesidad de timeouts ni gestión manual.
 *
 * Importante: el cuerpo se inlinea en cada rama; NO se factoriza como un
 * `React.FC` declarado dentro del componente padre, porque eso generaría una
 * nueva identidad de componente en cada render y forzaría a Vaul/Radix a
 * remontar el portal en cada cambio de filtro — bloqueando las interacciones
 * y haciendo rebotar el focus.
 *
 * Overlays bajados a bg-black/25 en drawer.tsx y sheet.tsx para que el
 * fondo no quede asfixiado.
 */
export const SearchDashboardFiltersSheet: React.FC<SearchDashboardFiltersSheetProps> = ({
    open,
    onOpenChange,
    filters,
    setFilters,
    categories,
}) => {
    const isMobile = useIsMobile();

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
    };

    /**
     * Cuerpo del filtro reutilizado por Drawer (mobile) y Sheet (desktop).
     *
     * Devuelve JSX desde una FUNCIÓN normal (no un `React.FC`). Si lo
     * declarásemos como componente dentro del padre, su tipo cambiaría en
     * cada render y React desmontaría/remontaría todo el subárbol — eso es
     * lo que rompía las interacciones en mobile (taps que no respondían) y
     * lo que disparaba el warning de aria-hidden, porque el botón con foco
     * desaparecía mientras Vaul aún tenía el modal en aria-hidden.
     */
    const renderBody = (onClose: () => void): React.ReactNode => (
        <>
            <div className="border-b border-line px-5 pb-3 pt-2">
                <div className="flex items-center justify-between gap-3">
                    <div className="text-title font-semibold tracking-[-0.015em] text-ink-strong">
                        Filtros
                    </div>
                    <button
                        type="button"
                        aria-label="Cerrar"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-tinted hover:text-ink-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                    >
                        <X className="h-4 w-4" strokeWidth={2} aria-hidden />
                    </button>
                </div>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 pb-[92px] pt-4">
                {totalReal > 0 && (
                    <section>
                        <div className="mb-2.5 flex items-baseline justify-between gap-3">
                            <h3 className="text-badge font-bold uppercase tracking-[0.14em] text-ink-muted">
                                Categorías
                            </h3>
                            <button
                                type="button"
                                onClick={toggleAllCategories}
                                className="text-caption font-semibold text-brand transition-colors hover:text-brand-hover"
                            >
                                {allSelected ? 'Quitar todas' : 'Seleccionar todas'}
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {realCategories.map((category) => {
                                const checked = filters.selectedCategories.includes(category.id);
                                return (
                                    <button
                                        key={category.id}
                                        type="button"
                                        role="checkbox"
                                        aria-checked={checked}
                                        onClick={() => toggleCategory(category.id, !checked)}
                                        className={[
                                            'inline-flex h-8 items-center gap-1 rounded-full border px-3 text-caption font-medium transition-colors',
                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
                                            checked
                                                ? 'border-brand bg-brand/[0.08] text-brand'
                                                : 'border-line bg-white text-ink-strong hover:bg-surface-tinted',
                                        ].join(' ')}
                                    >
                                        <span className="max-w-[140px] truncate">{category.name}</span>
                                        {checked && (
                                            <Check className="h-3 w-3 shrink-0" strokeWidth={3} aria-hidden />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                )}

                <section>
                    <h3 className="mb-2.5 text-badge font-bold uppercase tracking-[0.14em] text-ink-muted">
                        Visibilidad
                    </h3>
                    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-line bg-white px-4 py-3">
                        <div className="min-w-0">
                            <div className="text-body font-semibold leading-tight text-ink-strong">
                                Inspecciones inactivas
                            </div>
                            <div className="mt-0.5 text-caption leading-snug text-ink-muted">
                                Incluye las que cancelaste o están sin movimiento.
                            </div>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={filters.showInactives}
                            onClick={() =>
                                setFilters((prev) => ({ ...prev, showInactives: !prev.showInactives }))
                            }
                            className={[
                                'relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
                                filters.showInactives ? 'bg-brand' : 'bg-line',
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

                <section>
                    <h3 className="mb-2.5 text-badge font-bold uppercase tracking-[0.14em] text-ink-muted">
                        Estado del servicio
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
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
                                        setFilters((prev) => ({ ...prev, searchHireStatus: value }))
                                    }
                                    className={[
                                        'inline-flex h-8 items-center rounded-full border px-3 text-caption font-medium transition-colors',
                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
                                        checked
                                            ? 'border-brand bg-brand text-white'
                                            : 'border-line bg-white text-ink-strong hover:bg-surface-tinted',
                                    ].join(' ')}
                                >
                                    {status.label}
                                </button>
                            );
                        })}
                    </div>
                </section>
            </div>

            <div className="sticky bottom-0 border-t border-line bg-white px-5 py-3">
                <div className="flex gap-3 pb-[max(0.25rem,env(safe-area-inset-bottom,0px))]">
                    <button
                        type="button"
                        onClick={resetFilters}
                        className="flex-1 rounded-full border border-line bg-white py-2.5 text-meta font-semibold text-ink-strong transition-colors hover:bg-surface-tinted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                    >
                        Restablecer
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-full bg-brand py-2.5 text-meta font-semibold text-white shadow-[0_4px_16px_hsl(var(--brand)/0.2)] transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                    >
                        Aplicar
                    </button>
                </div>
            </div>
        </>
    );

    const handleClose = () => onOpenChange(false);

    if (isMobile) {
        return (
            // shouldScaleBackground={false}: desactivamos el efecto Vaul que
            // aplica `transform: scale(0.97)` al body cuando el drawer abre.
            // Ese transform es lo que el usuario percibía como "todo se ve
            // opaco / se mete hacia atrás" en mobile, no el overlay (que ya
            // está en bg-black/25).
            //
            // autoFocus={true}: Vaul desactiva por defecto el onOpenAutoFocus
            // de Radix. Lo reactivamos para que Radix mueva el focus al primer
            // elemento focusable del contenido (la X de cerrar). Eso saca el
            // focus del botón "Filtros" externo que está bajo aria-hidden y
            // elimina el warning, sin necesidad de useEffect ni timeouts.
            <Drawer
                open={open}
                onOpenChange={onOpenChange}
                shouldScaleBackground={false}
                autoFocus
            >
                <DrawerContent
                    className="flex max-h-[86dvh] flex-col rounded-t-[20px] border-t border-line bg-white"
                    style={{ fontFamily: HP_FONT }}
                >
                    {/* Vaul exige Title/Description para a11y; ocultos visualmente */}
                    <DrawerHeader className="sr-only">
                        <DrawerTitle>Filtros de inspecciones</DrawerTitle>
                    </DrawerHeader>
                    {/* No añadimos un DrawerClose sr-only aquí: con autoFocus={true}
                        sería el primer focusable y se llevaría el focus invisible.
                        Dejamos que el foco caiga directamente en el botón X visible
                        del body (también es un DrawerClose semánticamente, vía onClose). */}
                    {renderBody(handleClose)}
                </DrawerContent>
            </Drawer>
        );
    }

    // Radix Dialog (Sheet) gestiona onOpenAutoFocus por defecto y enfoca el
    // primer focusable del contenido, así que no necesitamos hacer nada.
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="flex h-full w-full max-w-[420px] flex-col gap-0 border-l border-line bg-white p-0 sm:max-w-[420px]"
                style={{ fontFamily: HP_FONT }}
            >
                {/* Radix Dialog exige Title/Description para a11y; ocultos visualmente */}
                <SheetTitle className="sr-only">Filtros de inspecciones</SheetTitle>
                <SheetDescription className="sr-only">
                    Selecciona visibilidad, estado y categorías para filtrar tus inspecciones.
                </SheetDescription>
                {renderBody(handleClose)}
            </SheetContent>
        </Sheet>
    );
};
