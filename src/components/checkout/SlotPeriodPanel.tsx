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
    showPeriodFilter?: boolean;
    /** Drawer móvil: Mañana/Tarde en lugar de rejilla plana. */
    splitPeriodsOnMobile?: boolean;
    periodFilter: PeriodFilter;
    onPeriodFilterChange: (period: PeriodFilter) => void;
    onSelectSlot: (slot: ChosenSlot | null) => void;
}

/** Rótulo de franja (Mañana/Tarde) — una sola piel en todas las variantes. */
const SLOT_PERIOD_LABEL_CLASS =
    'text-[11px] font-semibold uppercase tracking-wide text-[#475569] lg:text-xs';

const slotButtonClass = (active: boolean, embedded?: boolean) =>
    cn(
        'inline-flex w-full select-none items-center justify-center rounded-md border font-semibold tabular-nums transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1',
        embedded ? 'h-9 text-[12px]' : 'h-9 min-w-[3.75rem] px-2.5 text-[13px] sm:min-w-[4.25rem]',
        active
            ? 'border-brand bg-brand text-white shadow-sm'
            : 'border-[#e5e7eb] bg-white text-[#1c1c1c] hover:border-brand/45 hover:bg-brand/[0.04]',
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
                'flex gap-1 rounded-lg bg-[#f4f5f7] p-1',
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
                            'flex-1 select-none rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors',
                            active
                                ? 'bg-white text-[#1c1c1c] shadow-sm'
                                : 'text-[#6a6a6a] hover:text-[#1c1c1c]',
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
        <div className="rounded-xl bg-[#f8f9fb] px-3 py-2.5">
            <p className={SLOT_PERIOD_LABEL_CLASS}>{SLOT_PERIOD_LABELS[period]}</p>
            <p className="mt-0.5 text-[11px] text-[#6b7280]">{SLOT_PERIOD_HINTS[period]}</p>
            <p className="mt-1 text-xs font-medium text-[#475569]">
                {count === 0
                    ? 'Sin huecos'
                    : count === 1
                      ? '1 hueco libre'
                      : `${count} huecos libres`}
            </p>
        </div>
    );
}

/** Solo consulta (Coordínalo Inspecciono): chips informativos en desktop; texto compacto en móvil. */
function BrowseOnlySlotHours({ slots }: { slots: ChosenSlot[] }) {
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

    // Chip de solo consulta: aspecto atenuado a trazas (el cliente no elige la hora aquí),
    // pero pulsable para explicar el modo «lo coordina Inspecciono».
    const browseChipClass =
        'inline-flex cursor-pointer select-none items-center justify-center gap-1 rounded-lg border-[1.5px] border-dashed border-[#9ca7b4] bg-[#f8f9fb] px-2.5 py-1.5 text-[13px] font-semibold tabular-nums text-[#64748b] transition-colors hover:border-[#7d8896] hover:bg-[#f1f3f6] hover:text-[#475569] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1 active:scale-[0.98]';

    const renderBrowseChip = (s: ChosenSlot) => (
        <button
            key={s.startUtc}
            type="button"
            className={browseChipClass}
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
        'inline-flex min-w-[3.25rem] select-none items-center justify-center rounded-lg px-2 py-1.5',
        'text-[13px] font-semibold tabular-nums transition-all duration-150',
        'max-lg:min-w-[2.75rem] max-lg:px-2 max-lg:py-1 max-lg:text-[12px]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1',
        active
            ? 'bg-brand text-white shadow-[0_2px_8px_hsl(var(--brand)/0.22)]'
            : 'bg-[#f3f5f8] text-[#1c1c1c] hover:bg-brand/[0.08] hover:text-brand active:scale-[0.98]',
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
    const chip = (s: ChosenSlot) => {
        const active = selected?.startUtc === s.startUtc;
        return (
            <button
                key={s.startUtc}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => onSelectSlot(active ? null : s)}
                className={cn(
                    embeddedMiniSlotChipClass(active),
                    wrap && 'h-10 min-w-[3.25rem] shrink-0 px-2 py-0 text-[13px]',
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
}: {
    slots: ChosenSlot[];
    selected: ChosenSlot | null;
    onSelectSlot: (slot: ChosenSlot | null) => void;
    splitPeriodsOnMobile?: boolean;
}) {
    const { morning, afternoon } = splitSlotsByPeriod(slots);

    const renderChip = (s: ChosenSlot) => {
        const active = selected?.startUtc === s.startUtc;
        return (
            <button
                key={s.startUtc}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => onSelectSlot(active ? null : s)}
                className={cn(
                    embeddedMiniSlotChipClass(active),
                    splitPeriodsOnMobile && 'h-10 min-w-[3.25rem] shrink-0 px-2 py-0 text-[13px]',
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
                    <span className="text-[11px] text-[#6b7280]">{SLOT_PERIOD_HINTS[period]}</span>
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
            <div className="rounded-xl bg-[#f8f9fb] px-3 py-2.5">
                <p className={SLOT_PERIOD_LABEL_CLASS}>{SLOT_PERIOD_LABELS[period]}</p>
                <p className="mt-1 text-[11px] text-[#6b7280]">Sin huecos en esta franja</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-1.5 flex items-baseline gap-1.5">
                <p className={SLOT_PERIOD_LABEL_CLASS}>{SLOT_PERIOD_LABELS[period]}</p>
                <span className="text-[11px] text-[#6b7280]">{SLOT_PERIOD_HINTS[period]}</span>
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
    showPeriodFilter = true,
    splitPeriodsOnMobile = false,
    periodFilter,
    onPeriodFilterChange,
    onSelectSlot,
}: SlotPeriodPanelProps) {
    const { morning, afternoon } = splitSlotsByPeriod(slots);
    const effectiveFilter = showPeriodFilter ? periodFilter : 'all';

    if (previewMode && embedded) {
        return <BrowseOnlySlotHours slots={slots} />;
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
                <p className="text-xs font-medium text-[#475569] lg:hidden">
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
