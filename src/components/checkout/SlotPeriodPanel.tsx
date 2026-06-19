import React from 'react';
import { cn } from '../../lib/utils';
import type { ChosenSlot } from '../SlotPicker';
import {
    SLOT_PERIOD_HINTS,
    SLOT_PERIOD_LABELS,
    type SlotDayPeriod,
    splitSlotsByPeriod,
} from '../../utils/slotPeriodUtils';

type PeriodFilter = SlotDayPeriod | 'all';

interface SlotPeriodPanelProps {
    slots: ChosenSlot[];
    selected: ChosenSlot | null;
    previewMode?: boolean;
    compact?: boolean;
    periodFilter: PeriodFilter;
    onPeriodFilterChange: (period: PeriodFilter) => void;
    onSelectSlot: (slot: ChosenSlot | null) => void;
}

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
                                'inline-flex items-center justify-center rounded-lg border font-medium tabular-nums transition-colors',
                                compact
                                    ? 'h-8 w-full px-2 text-xs'
                                    : 'h-9 min-w-[3.75rem] px-2.5 text-[13px] sm:min-w-[4.25rem]',
                                active
                                    ? 'border-brand bg-brand text-white shadow-sm'
                                    : 'border-[#e5e7eb] bg-white text-[#1c1c1c] hover:border-brand/45 hover:bg-brand/[0.04]',
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
    periodFilter,
    onPeriodFilterChange,
    onSelectSlot,
}: SlotPeriodPanelProps) {
    const { morning, afternoon } = splitSlotsByPeriod(slots);

    if (previewMode) {
        const showMorning = periodFilter === 'all' || periodFilter === 'morning';
        const showAfternoon = periodFilter === 'all' || periodFilter === 'afternoon';

        return (
            <div className="space-y-2">
                <PeriodFilterChips value={periodFilter} onChange={onPeriodFilterChange} compact={compact} />
                <div className={cn(showMorning && showAfternoon ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-1')}>
                    {showMorning ? (
                        <PreviewPeriodBlock period="morning" count={morning.length} />
                    ) : null}
                    {showAfternoon ? (
                        <PreviewPeriodBlock period="afternoon" count={afternoon.length} />
                    ) : null}
                </div>
            </div>
        );
    }

    const showMorning = periodFilter === 'all' || periodFilter === 'morning';
    const showAfternoon = periodFilter === 'all' || periodFilter === 'afternoon';

    return (
        <div>
            <PeriodFilterChips value={periodFilter} onChange={onPeriodFilterChange} compact={compact} />
            <div className={cn('space-y-3', compact && 'space-y-2.5')}>
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
