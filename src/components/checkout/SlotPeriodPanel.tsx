import React from 'react';
import { cn } from '../../lib/utils';
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

const slotButtonClass = (active: boolean, embedded?: boolean) =>
    cn(
        'inline-flex w-full items-center justify-center rounded-md border font-semibold tabular-nums transition-colors',
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
                            'flex-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors',
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
            <p className="text-[11px] font-semibold text-[#1c1c1c]">{SLOT_PERIOD_LABELS[period]}</p>
            <p className="text-[10px] text-[#9ca3af]">{SLOT_PERIOD_HINTS[period]}</p>
            <p className="mt-1 text-xs font-medium text-[#4b5563]">
                {count === 0
                    ? 'Sin huecos'
                    : count === 1
                      ? '1 hueco libre'
                      : `${count} huecos libres`}
            </p>
        </div>
    );
}

/** Solo consulta (Coordínalo Inspecciono): horas en texto, sin cajas ni botones. */
function BrowseOnlySlotHours({ slots }: { slots: ChosenSlot[] }) {
    const { morning, afternoon } = splitSlotsByPeriod(slots);
    const sorted = sortSlotsByTime(slots);

    const flatText = (
        <p className="text-[13px] font-medium leading-relaxed tabular-nums text-[#1c1c1c] max-lg:text-[12px] max-lg:leading-snug">
            {sorted.map((s) => s.label).join(' · ')}
        </p>
    );

    const renderRow = (period: SlotDayPeriod, periodSlots: ChosenSlot[]) => {
        if (periodSlots.length === 0) return null;
        return (
            <div key={period}>
                <p className="mb-1 text-[11px] font-medium text-[#64748b]">{SLOT_PERIOD_LABELS[period]}</p>
                <p className="text-[13px] font-medium leading-relaxed tabular-nums text-[#1c1c1c]">
                    {periodSlots.map((s) => s.label).join(' · ')}
                </p>
            </div>
        );
    };

    const hasBoth = morning.length > 0 && afternoon.length > 0;

    return (
        <>
            <div className="lg:hidden">{flatText}</div>
            <div className="hidden lg:block">
                {!hasBoth ? (
                    flatText
                ) : (
                    <div className="space-y-2.5">
                        {renderRow('morning', morning)}
                        {renderRow('afternoon', afternoon)}
                    </div>
                )}
            </div>
        </>
    );
}

/** Yo me encargo: mini chips horarios, claros y fáciles de pulsar. */
const embeddedMiniSlotChipClass = (active: boolean) =>
    cn(
        'inline-flex min-w-[3.25rem] items-center justify-center rounded-lg px-2 py-1.5',
        'text-[13px] font-semibold tabular-nums transition-all duration-150',
        'max-lg:min-w-[2.75rem] max-lg:px-2 max-lg:py-1 max-lg:text-[12px]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1',
        active
            ? 'bg-brand text-white shadow-[0_2px_8px_rgba(0,102,204,0.22)]'
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
                    wrap && 'min-w-[3.25rem] shrink-0 px-2 py-1 text-[12px]',
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
            className="grid grid-cols-4 gap-1.5 max-lg:grid-cols-4 max-lg:gap-1 lg:grid-cols-3"
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
                    splitPeriodsOnMobile && 'min-w-[3.25rem] shrink-0 px-2 py-1 text-[12px]',
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
                <div className={cn('mb-1.5 flex items-center gap-2', splitPeriodsOnMobile && 'mb-1')}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-[#475569]">
                        {SLOT_PERIOD_LABELS[period]}
                    </p>
                    <span className="text-[10px] text-[#94a3b8]">{SLOT_PERIOD_HINTS[period]}</span>
                </div>
                <div
                    className={cn(
                        splitPeriodsOnMobile
                            ? 'flex flex-wrap gap-1.5'
                            : 'grid grid-cols-4 gap-1.5 max-lg:grid-cols-4 max-lg:gap-1 lg:grid-cols-3',
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
                <p className="text-[11px] font-semibold text-[#1c1c1c]">{SLOT_PERIOD_LABELS[period]}</p>
                <p className="mt-0.5 text-[11px] text-[#9ca3af]">Sin huecos en esta franja</p>
            </div>
        );
    }

    return (
        <div>
            <p className="mb-1.5 text-[11px] font-semibold text-[#1c1c1c]">
                {SLOT_PERIOD_LABELS[period]}
                <span className="ml-1.5 font-normal text-[#9ca3af]">{SLOT_PERIOD_HINTS[period]}</span>
            </p>
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
                <p className="text-xs font-medium text-[#4b5563] lg:hidden">
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
