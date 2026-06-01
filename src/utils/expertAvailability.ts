/** Días en orden ISO (lunes primero) — coincide con backend en inglés */
export const EXPERT_WEEK_DAYS = [
  { key: 'Monday', label: 'Lun', short: 'L' },
  { key: 'Tuesday', label: 'Mar', short: 'M' },
  { key: 'Wednesday', label: 'Mié', short: 'X' },
  { key: 'Thursday', label: 'Jue', short: 'J' },
  { key: 'Friday', label: 'Vie', short: 'V' },
  { key: 'Saturday', label: 'Sáb', short: 'S' },
  { key: 'Sunday', label: 'Dom', short: 'D' },
] as const;

export interface ExpertAvailabilityInput {
  daysOfWeek?: string[];
  startTime?: string;
  endTime?: string;
}

export function normalizeAvailabilityDays(days: string[] | undefined): Set<string> {
  const set = new Set<string>();
  if (!days?.length) return set;
  for (const d of days) {
    const trimmed = d.trim();
    const match = EXPERT_WEEK_DAYS.find(
      (w) => w.key.toLowerCase() === trimmed.toLowerCase() || w.label.toLowerCase() === trimmed.toLowerCase(),
    );
    if (match) set.add(match.key);
    else set.add(trimmed);
  }
  return set;
}

export function formatAvailabilityTime(value: string | undefined): string {
  if (!value) return '';
  const part = value.substring(0, 5);
  return part;
}

export function formatAvailabilityTimeRange(start?: string, end?: string): string | null {
  const s = formatAvailabilityTime(start);
  const e = formatAvailabilityTime(end);
  if (s && e) return `${s} – ${e}`;
  if (s) return `Desde ${s}`;
  if (e) return `Hasta ${e}`;
  return null;
}

/** Lista legible: "Lunes a viernes" o días sueltos */
export function formatAvailabilityDaysSummary(days: string[] | undefined): string {
  const active = EXPERT_WEEK_DAYS.filter((d) => normalizeAvailabilityDays(days).has(d.key));
  if (active.length === 0) return 'Sin días definidos';
  if (active.length === 7) return 'Todos los días';
  const indices = active.map((d) => EXPERT_WEEK_DAYS.findIndex((w) => w.key === d.key));
  const sorted = [...indices].sort((a, b) => a - b);
  const isContiguous = sorted.length > 1 && sorted.every((v, i) => i === 0 || v === sorted[i - 1] + 1);
  if (isContiguous && sorted.length >= 2) {
    return `${EXPERT_WEEK_DAYS[sorted[0]].label} a ${EXPERT_WEEK_DAYS[sorted[sorted.length - 1]].label}`;
  }
  return active.map((d) => d.label).join(', ');
}
