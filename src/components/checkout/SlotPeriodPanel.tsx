import React from 'react';
import { cn } from '../../lib/utils';
import { toast } from '../../lib/toast';
import type { ChosenSlot } from '../SlotPicker';
import {
    SLOT_PERIOD_HINTS,
    SLOT_PERIOD_LABELS,
    sortSlotsByTime,
    type SlotDayPeriod,
    splitSlotsByPeriod,
} from '../../utils/slotPeriodUtils';

type PeriodFilter = SlotDayPeriod | 'all';

interface SlotPeriodPanelProps {
    slots: ChosenSlot[];
    selected: ChosenSlot | null;
    previewMode?: boolean;
    compact?: boolean;
    /** Checkout desktop integrado: layout optimizado para columna estrecha. */
    embedded?: boolean;
    /** Checkout desktop 50/50: columna de horas estrecha junto al calendario. */
    splitColumn?: boolean;
    /** Drawer lateral desktop: chips apilados a ancho completo. */
    splitColumnDrawer?: boolean;
    showPeriodFilter?: boolean;
    /** Drawer móvil: Mañana/Tarde en lugar de rejilla plana. */
    splitPeriodsOnMobile?: boolean;
    periodFilter: PeriodFilter;
    onPeriodFilterChange: (period: PeriodFilter) => void;
    onSelectSlot: (slot: ChosenSlot | null) => void;
}

/** Rótulo de franja (Mañana/Tarde) — una sola piel en todas las variantes. */
const SLOT_PERIOD_LABEL_CLASS =
    'text-kicker font-semibold uppercase tracking-wide text-ink-muted lg:text-xs';

const slotButtonClass = (active: boolean, embedded?: boolean) =>
    cn(
        'inline-flex w-full select-none items-center justify-center rounded-full border font-semibold tabular-nums transition-[background-color,border-color,box-shadow,transform] duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1',
        embedded ? 'h-9 text-caption' : 'h-9 min-w-[3.75rem] px-2.5 text-meta sm:min-w-[4.25rem]',
        active
            ? 'border-brand bg-brand text-white shadow-[0_2px_10px_hsl(var(--brand)/0.25)]'
            : 'border-brand/15 bg-brand/[0.05] text-ink-strong hover:border-brand/30 hover:bg-brand/10 motion-safe:active:scale-[0.97]',
    );

function PeriodFilterChips({
    value,
    onChange,
    compact,
}: {
    value: PeriodFilter;
    onChange: (p: PeriodFilter) => void;
    compact?: boolean;
}) {
    const items: { id: PeriodFilter; label: string }[] = [
        { id: 'morning', label: 'Mañana' },
        { id: 'afternoon', label: 'Tarde' },
        { id: 'all', label: 'Todo el día' },
    ];

    return (
        <div
            className={cn(
                'flex gap-1 rounded-lg bg-surface-tinted p-1',
                compact ? 'mb-2' : 'mb-3',
            )}
            role="tablist"
            aria-label="Franja horaria"
        >
            {items.map((item) => {
                const active = value === item.id;
                return (
                    <button
                        key={item.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(item.id)}
                        className={cn(
                            'flex-1 select-none rounded-md px-2 py-1.5 text-kicker font-semibold transition-colors',
                            active
                                ? 'bg-white text-ink-strong shadow-sm'
                                : 'text-ink-muted hover:text-ink-strong',
                        )}
                    >
                        {item.label}
                    </button>
                );
            })}
        </div>
    );
}

function PreviewPeriodBlock({ period, count }: { period: SlotDayPeriod; count: number }) {
    return (
        <div className="rounded-xl bg-surface-tinted px-3 py-2.5">
            <p className={SLOT_PERIOD_LABEL_CLASS}>{SLOT_PERIOD_LABELS[period]}</p>
            <p className="mt-0.5 text-kicker text-ink-muted">{SLOT_PERIOD_HINTS[period]}</p>
            <p className="mt-1 text-xs font-medium text-ink-muted">
                {count === 0
                    ? 'Sin huecos'
                    : count === 1
                      ? '1 hueco libre'
                      : `${count} huecos libres`}
            </p>
        </div>
    );
}

/** Chip horario desktop split: en móvil columna; en desktop fila bajo el calendario. */
const splitColumnSlotChipClass = (active: boolean) =>
    cn(
        'inline-flex h-10 w-full select-none items-center justify-center rounded-full border font-semibold tabular-nums text-body transition-[background-color,border-color,box-shadow,transform] duration-150',
        'lg:w-auto lg:min-w-[4.75rem] lg:px-5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1',
        active
            ? 'border-brand bg-brand text-white shadow-[0_2px_10px_hsl(var(--brand)/0.28)]'
            : 'border-brand/15 bg-brand/[0.06] text-ink-strong hover:border-brand/30 hover:bg-brand/10 motion-safe:active:scale-[0.98]',
    );

function SplitColumnSlotGrid({
    slots,
    selected,
    onSelectSlot,
    previewMode = false,
    stacked = false,
}: {
    slots: ChosenSlot[];
    selected: ChosenSlot | null;
    onSelectSlot: (slot: ChosenSlot | null) => void;
    previewMode?: boolean;
    stacked?: boolean;
}) {
    const notifyCoordinated = () =>
        toast.info('Es solo una previsualización', {
            id: 'coord-seller-slot-info',
            description:
                'No tienes que elegir hora ni lugar. Inspecciono enviará un enlace al vendedor para que coordine la cita con el experto. Tú no te mueves del sofá.',
            duration: 6500,
        });

    return (
        <div
            className={cn('flex gap-2', stacked ? 'flex-col' : 'flex-col lg:flex-row lg:flex-wrap lg:gap-2.5')}
            role="listbox"
            aria-label="Horarios disponibles"
        >
            {sortSlotsByTime(slots).map((s, i) => {
                const active = selected?.startUtc === s.startUtc;
                return (
                    <button
                        key={s.startUtc}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => {
                            if (previewMode) {
                                notifyCoordinated();
                                return;
                            }
                            onSelectSlot(active ? null : s);
                        }}
                        style={{ ['--ci' as string]: Math.min(i, 12) } as React.CSSProperties}
                        className={cn('slot-chip-enter', splitColumnSlotChipClass(active), stacked && 'lg:w-full')}
                    >
                        {s.label}
                    </button>
                );
            })}
        </div>
    );
}

/** Solo consulta (Coordínalo Inspecciono): chips informativos en desktop; texto compacto en móvil. */
function BrowseOnlySlotHours({
    slots,
    splitColumn = false,
    splitColumnDrawer = false,
}: {
    slots: ChosenSlot[];
    splitColumn?: boolean;
    splitColumnDrawer?: boolean;
}) {
    const { morning, afternoon } = splitSlotsByPeriod(slots);
    const sorted = sortSlotsByTime(slots);

    // Al pulsar un hueco en este modo: aviso de que la cita la coordina Inspecciono
    // (id fijo → los clics repetidos refrescan el mismo toast en vez de apilarse).
    const notifyCoordinated = () =>
        toast.info('Es solo una previsualización', {
            id: 'coord-seller-slot-info',
            description:
                'No tienes que elegir hora ni lugar. Inspecciono enviará un enlace al vendedor para que coordine la cita con el experto. Tú no te mueves del sofá.',
            duration: 6500,
        });

    // Chip de solo consulta: pill con tinte de marca (modo vendedor), pulsable para explicar el flujo.
    const browseChipClass =
        'inline-flex cursor-pointer select-none items-center justify-center rounded-full border border-brand/20 bg-brand/[0.07] px-3 py-1.5 text-meta font-semibold tabular-nums text-ink-strong transition-[background-color,border-color,transform,box-shadow] hover:border-brand/35 hover:bg-brand/12 hover:shadow-[0_2px_8px_hsl(var(--brand)/0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1 motion-safe:active:scale-[0.97]';

    const renderBrowseChip = (s: ChosenSlot, i: number) => (
        <button
            key={s.startUtc}
            type="button"
            className={cn('slot-chip-enter', browseChipClass)}
            style={{ ['--ci' as string]: Math.min(i, 12) } as React.CSSProperties}
            title="La cita la coordina Inspecciono"
            onClick={notifyCoordinated}
        >
            {s.label}
        </button>
    );

    const renderChipRow = (period: SlotDayPeriod, periodSlots: ChosenSlot[]) => {
        if (periodSlots.length === 0) return null;
        return (
            <div key={period}>
                <p className={cn('mb-2', SLOT_PERIOD_LABEL_CLASS)}>
                    {SLOT_PERIOD_LABELS[period]}
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {periodSlots.map(renderBrowseChip)}
                </div>
            </div>
        );
    };

    const hasBoth = morning.length > 0 && afternoon.length > 0;

    if (splitColumnDrawer) {
        return (
            <SplitColumnSlotGrid
                slots={slots}
                selected={null}
                onSelectSlot={() => undefined}
                previewMode
                stacked
            />
        );
    }

    if (splitColumn) {
        return (
            <SplitColumnSlotGrid
                slots={slots}
                selected={null}
                onSelectSlot={() => undefined}
                previewMode
            />
        );
    }

    // Mismo aspecto en móvil y desktop: chips a trazas atenuados (no texto plano).
    return !hasBoth ? (
        <div className="flex flex-wrap gap-1.5">
            {sorted.map(renderBrowseChip)}
        </div>
    ) : (
        <div className="space-y-3">
            {renderChipRow('morning', morning)}
            {renderChipRow('afternoon', afternoon)}
        </div>
    );
}

/** Yo me encargo: mini chips horarios, claros y fáciles de pulsar. */
const embeddedMiniSlotChipClass = (active: boolean) =>
    cn(
        'inline-flex min-w-[3.25rem] select-none items-center justify-center rounded-full px-2.5 py-1.5',
        'text-meta font-semibold tabular-nums transition-all duration-150',
        'max-lg:min-w-[2.75rem] max-lg:px-2 max-lg:py-1 max-lg:text-caption',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1',
        active
            ? 'bg-brand text-white shadow-[0_2px_10px_hsl(var(--brand)/0.28)] ring-2 ring-brand/20 ring-offset-1 ring-offset-white'
            : 'border border-brand/15 bg-brand/[0.06] text-ink-strong hover:border-brand/30 hover:bg-brand/10 motion-safe:active:scale-[0.97]',
    );

function FlatEmbeddedSlotGrid({
    slots,
    selected,
    onSelectSlot,
    wrap = false,
}: {
    slots: ChosenSlot[];
    selected: ChosenSlot | null;
    onSelectSlot: (slot: ChosenSlot | null) => void;
    wrap?: boolean;
}) {
    const chip = (s: ChosenSlot, i: number) => {
        const active = selected?.startUtc === s.startUtc;
        return (
            <button
                key={s.startUtc}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => onSelectSlot(active ? null : s)}
                style={{ ['--ci' as string]: Math.min(i, 12) } as React.CSSProperties}
                className={cn(
                    'slot-chip-enter',
                    embeddedMiniSlotChipClass(active),
                    wrap && 'h-10 min-w-[3.25rem] shrink-0 px-2 py-0 text-meta',
                )}
            >
                {s.label}
            </button>
        );
    };

    if (wrap) {
        return (
            <div className="flex flex-wrap gap-1.5" role="listbox" aria-label="Horarios disponibles">
                {sortSlotsByTime(slots).map(chip)}
            </div>
        );
    }

    return (
        <div
            className={cn(
                'grid gap-1.5 max-lg:gap-1 lg:gap-2',
                // auto-fill en vez de un nº de columnas fijo por breakpoint: en columnas
                // estrechas (p.ej. calendario+horas partido en desktop, ~184px) un
                // grid-cols-3 fijo dejaba huecos/desbordaba; auto-fill calcula cuántas
                // columnas caben de verdad al ancho mínimo del chip y llena el espacio
                // real de borde a borde (feedback 2026-07-12).
                'grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(3.25rem,1fr))]',
            )}
            role="listbox"
            aria-label="Horarios disponibles"
        >
            {sortSlotsByTime(slots).map(chip)}
        </div>
    );
}

function SelectableEmbeddedSlotHours({
    slots,
    selected,
    onSelectSlot,
    splitPeriodsOnMobile = false,
    splitColumn = false,
    splitColumnDrawer = false,
}: {
    slots: ChosenSlot[];
    selected: ChosenSlot | null;
    onSelectSlot: (slot: ChosenSlot | null) => void;
    splitPeriodsOnMobile?: boolean;
    splitColumn?: boolean;
    splitColumnDrawer?: boolean;
}) {
    const { morning, afternoon } = splitSlotsByPeriod(slots);

    const renderChip = (s: ChosenSlot, i: number) => {
        const active = selected?.startUtc === s.startUtc;
        return (
            <button
                key={s.startUtc}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => onSelectSlot(active ? null : s)}
                style={{ ['--ci' as string]: Math.min(i, 12) } as React.CSSProperties}
                className={cn(
                    'slot-chip-enter',
                    embeddedMiniSlotChipClass(active),
                    splitPeriodsOnMobile && 'h-10 min-w-[3.25rem] shrink-0 px-2 py-0 text-meta',
                )}
            >
                {s.label}
            </button>
        );
    };

    const renderPeriod = (period: SlotDayPeriod, periodSlots: ChosenSlot[]) => {
        if (periodSlots.length === 0) return null;
        return (
            <div key={period} className={splitPeriodsOnMobile ? 'rounded-lg bg-white px-2.5 py-2' : undefined}>
                <div className={cn('mb-2 flex items-center gap-2', splitPeriodsOnMobile && 'mb-1.5')}>
                    <p className={SLOT_PERIOD_LABEL_CLASS}>
                        {SLOT_PERIOD_LABELS[period]}
                    </p>
                    <span className="text-kicker text-ink-muted">{SLOT_PERIOD_HINTS[period]}</span>
                </div>
                <div
                    className={cn(
                        splitPeriodsOnMobile
                            ? 'flex flex-wrap gap-1.5'
                            // auto-fill: la columna partida calendario+horas en desktop es
                            // estrecha (~184px) y un grid-cols-3 fijo dejaba huecos sin llenar
                            // (feedback 2026-07-12); con auto-fill caben las columnas que el
                            // ancho real permite, de borde a borde.
                            : 'grid gap-1.5 max-lg:gap-1 lg:gap-2 grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(3.25rem,1fr))]',
                    )}
                    role="listbox"
                    aria-label={`Horarios de ${SLOT_PERIOD_LABELS[period].toLowerCase()}`}
                >
                    {periodSlots.map(renderChip)}
                </div>
            </div>
        );
    };

    const hasBoth = morning.length > 0 && afternoon.length > 0;

    const periodSplitLayout =
        !hasBoth ? (
            <FlatEmbeddedSlotGrid
                slots={slots}
                selected={selected}
                onSelectSlot={onSelectSlot}
                wrap={splitPeriodsOnMobile}
            />
        ) : (
            <div className={cn(splitPeriodsOnMobile ? 'space-y-2' : 'space-y-3')}>
                {renderPeriod('morning', morning)}
                {renderPeriod('afternoon', afternoon)}
            </div>
        );

    if (splitColumnDrawer) {
        return (
            <SplitColumnSlotGrid
                slots={slots}
                selected={selected}
                onSelectSlot={onSelectSlot}
                stacked
            />
        );
    }

    if (splitColumn) {
        return (
            <SplitColumnSlotGrid slots={slots} selected={selected} onSelectSlot={onSelectSlot} />
        );
    }

    if (splitPeriodsOnMobile) {
        return periodSplitLayout;
    }

    return (
        <>
            <div className="lg:hidden">
                <FlatEmbeddedSlotGrid slots={slots} selected={selected} onSelectSlot={onSelectSlot} />
            </div>
            <div className="hidden lg:block">{periodSplitLayout}</div>
        </>
    );
}

function SelectablePeriodBlock({
    period,
    slots,
    selected,
    compact,
    onSelectSlot,
}: {
    period: SlotDayPeriod;
    slots: ChosenSlot[];
    selected: ChosenSlot | null;
    compact?: boolean;
    onSelectSlot: (slot: ChosenSlot | null) => void;
}) {
    if (slots.length === 0) {
        return (
            <div className="rounded-xl bg-surface-tinted px-3 py-2.5">
                <p className={SLOT_PERIOD_LABEL_CLASS}>{SLOT_PERIOD_LABELS[period]}</p>
                <p className="mt-1 text-kicker text-ink-muted">Sin huecos en esta franja</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-1.5 flex items-baseline gap-1.5">
                <p className={SLOT_PERIOD_LABEL_CLASS}>{SLOT_PERIOD_LABELS[period]}</p>
                <span className="text-kicker text-ink-muted">{SLOT_PERIOD_HINTS[period]}</span>
            </div>
            <div
                className={cn(
                    compact
                        ? 'flex max-h-[7.5rem] flex-col gap-1.5 overflow-y-auto'
                        : 'flex flex-wrap gap-2',
                )}
                role="listbox"
                aria-label={`Horarios de ${SLOT_PERIOD_LABELS[period].toLowerCase()}`}
            >
                {slots.map((s) => {
                    const active = selected?.startUtc === s.startUtc;
                    return (
                        <button
                            key={s.startUtc}
                            type="button"
                            role="option"
                            aria-selected={active}
                            onClick={() => onSelectSlot(active ? null : s)}
                            className={cn(
                                slotButtonClass(active),
                                compact && 'h-8 w-full px-2 text-xs',
                            )}
                        >
                            {s.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export function SlotPeriodPanel({
    slots,
    selected,
    previewMode = false,
    compact = false,
    embedded = false,
    splitColumn = false,
    splitColumnDrawer = false,
    showPeriodFilter = true,
    splitPeriodsOnMobile = false,
    periodFilter,
    onPeriodFilterChange,
    onSelectSlot,
}: SlotPeriodPanelProps) {
    const { morning, afternoon } = splitSlotsByPeriod(slots);
    const effectiveFilter = showPeriodFilter ? periodFilter : 'all';

    if (previewMode && embedded) {
        return <BrowseOnlySlotHours slots={slots} splitColumn={splitColumn} splitColumnDrawer={splitColumnDrawer} />;
    }

    if (previewMode) {
        const showMorning = effectiveFilter === 'all' || effectiveFilter === 'morning';
        const showAfternoon = effectiveFilter === 'all' || effectiveFilter === 'afternoon';

        return (
            <div className="space-y-2">
                {showPeriodFilter ? (
                    <div className="hidden lg:block">
                        <PeriodFilterChips value={periodFilter} onChange={onPeriodFilterChange} compact={compact} />
                    </div>
                ) : null}
                <div
                    className={cn(
                        'hidden lg:grid',
                        showMorning && showAfternoon ? 'grid-cols-2 gap-2' : 'grid-cols-1',
                    )}
                >
                    {showMorning ? (
                        <PreviewPeriodBlock period="morning" count={morning.length} />
                    ) : null}
                    {showAfternoon ? (
                        <PreviewPeriodBlock period="afternoon" count={afternoon.length} />
                    ) : null}
                </div>
                <p className="text-xs font-medium text-ink-muted lg:hidden">
                    {morning.length + afternoon.length === 1
                        ? '1 hueco libre'
                        : `${morning.length + afternoon.length} huecos libres`}
                </p>
            </div>
        );
    }

    if (embedded) {
        return (
            <SelectableEmbeddedSlotHours
                slots={slots}
                selected={selected}
                onSelectSlot={onSelectSlot}
                splitPeriodsOnMobile={splitPeriodsOnMobile}
                splitColumn={splitColumn}
                splitColumnDrawer={splitColumnDrawer}
            />
        );
    }

    const showMorning = effectiveFilter === 'all' || effectiveFilter === 'morning';
    const showAfternoon = effectiveFilter === 'all' || effectiveFilter === 'afternoon';

    const flatMobileSelectable = (
        <div
            className="flex flex-wrap gap-1.5 max-lg:gap-1 lg:hidden"
            role="listbox"
            aria-label="Horarios disponibles"
        >
            {sortSlotsByTime(slots).map((s) => {
                const active = selected?.startUtc === s.startUtc;
                return (
                    <button
                        key={s.startUtc}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => onSelectSlot(active ? null : s)}
                        className={cn(slotButtonClass(active, compact), 'max-lg:h-8 max-lg:min-w-[3.25rem] max-lg:px-2 max-lg:text-xs')}
                    >
                        {s.label}
                    </button>
                );
            })}
        </div>
    );

    return (
        <div>
            {showPeriodFilter ? (
                <div className="mb-3 hidden lg:block">
                    <PeriodFilterChips value={periodFilter} onChange={onPeriodFilterChange} compact={compact} />
                </div>
            ) : null}
            {flatMobileSelectable}
            <div
                className={cn(
                    'hidden lg:block',
                    effectiveFilter === 'all' && !compact
                        ? 'grid grid-cols-1 gap-3 sm:grid-cols-2'
                        : cn('space-y-3', compact && 'space-y-2.5'),
                )}
            >
                {showMorning ? (
                    <SelectablePeriodBlock
                        period="morning"
                        slots={morning}
                        selected={selected}
                        compact={compact}
                        onSelectSlot={onSelectSlot}
                    />
                ) : null}
                {showAfternoon ? (
                    <SelectablePeriodBlock
                        period="afternoon"
                        slots={afternoon}
                        selected={selected}
                        compact={compact}
                        onSelectSlot={onSelectSlot}
                    />
                ) : null}
            </div>
        </div>
    );
}

export type { PeriodFilter };
