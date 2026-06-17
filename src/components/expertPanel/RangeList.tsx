import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

export interface Range { start: string; end: string; }

interface Props {
    ranges: Range[];
    onChange: (ranges: Range[]) => void;
    defaultStart?: string;
    defaultEnd?: string;
    variant?: 'default' | 'panel';
}

/** Lista editable de franjas horarias (turnos partidos). Reutilizada por el editor semanal y el de fechas. */
const RangeList: React.FC<Props> = ({
    ranges,
    onChange,
    defaultStart = '09:00',
    defaultEnd = '18:00',
    variant = 'default',
}) => {
    const isPanel = variant === 'panel';
    const update = (i: number, key: 'start' | 'end', value: string) =>
        onChange(ranges.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
    const remove = (i: number) => onChange(ranges.filter((_, idx) => idx !== i));
    const add = () => onChange([...ranges, { start: defaultStart, end: defaultEnd }]);

    return (
        <div className={isPanel ? 'av-day-editor__ranges' : 'space-y-2'}>
            {ranges.map((r, i) => (
                <div key={i} className={isPanel ? 'av-day-editor__range' : 'flex items-center gap-2'}>
                    <input
                        type="time"
                        value={r.start}
                        onChange={(e) => update(i, 'start', e.target.value)}
                        className={isPanel ? 'av-day-editor__time' : 'rounded-lg border border-[#e3e3e3] px-2 py-1 text-sm'}
                    />
                    <span className={isPanel ? 'av-day-editor__range-sep' : 'text-[#999]'} aria-hidden>—</span>
                    <input
                        type="time"
                        value={r.end}
                        onChange={(e) => update(i, 'end', e.target.value)}
                        className={isPanel ? 'av-day-editor__time' : 'rounded-lg border border-[#e3e3e3] px-2 py-1 text-sm'}
                    />
                    <button
                        type="button"
                        onClick={() => remove(i)}
                        className={isPanel ? 'av-day-editor__range-remove' : 'rounded-lg p-1 text-red-500 hover:bg-red-50'}
                        aria-label="Quitar franja"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            ))}
            <button
                type="button"
                onClick={add}
                className={isPanel ? 'av-day-editor__range-add' : 'inline-flex items-center gap-1 rounded-lg border border-brand/40 px-2 py-1 text-xs font-medium text-brand hover:bg-brand/5'}
            >
                <Plus className="h-3.5 w-3.5" /> Añadir franja
            </button>
        </div>
    );
};

export default RangeList;
