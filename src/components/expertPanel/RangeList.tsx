import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

export interface Range { start: string; end: string; }

interface Props {
    ranges: Range[];
    onChange: (ranges: Range[]) => void;
    defaultStart?: string;
    defaultEnd?: string;
}

/** Lista editable de franjas horarias (turnos partidos). Reutilizada por el editor semanal y el de fechas. */
const RangeList: React.FC<Props> = ({ ranges, onChange, defaultStart = '09:00', defaultEnd = '18:00' }) => {
    const update = (i: number, key: 'start' | 'end', value: string) =>
        onChange(ranges.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
    const remove = (i: number) => onChange(ranges.filter((_, idx) => idx !== i));
    const add = () => onChange([...ranges, { start: defaultStart, end: defaultEnd }]);

    return (
        <div className="space-y-2">
            {ranges.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                    <input type="time" value={r.start} onChange={(e) => update(i, 'start', e.target.value)}
                        className="rounded-lg border border-[#e3e3e3] px-2 py-1 text-sm" />
                    <span className="text-[#999]">—</span>
                    <input type="time" value={r.end} onChange={(e) => update(i, 'end', e.target.value)}
                        className="rounded-lg border border-[#e3e3e3] px-2 py-1 text-sm" />
                    <button type="button" onClick={() => remove(i)}
                        className="rounded-lg p-1 text-red-500 hover:bg-red-50" aria-label="Quitar franja">
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ))}
            <button type="button" onClick={add}
                className="inline-flex items-center gap-1 rounded-lg border border-brand/40 px-2 py-1 text-xs font-medium text-brand hover:bg-brand/5">
                <Plus className="h-3.5 w-3.5" /> Añadir franja
            </button>
        </div>
    );
};

export default RangeList;
