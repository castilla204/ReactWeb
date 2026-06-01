import React from 'react';
import {
  EXPERT_WEEK_DAYS,
  ExpertAvailabilityInput,
  formatAvailabilityTimeRange,
  normalizeAvailabilityDays,
} from '../../utils/expertAvailability';

export interface ServiceDetailAvailabilityWidgetProps {
  availability: ExpertAvailabilityInput;
  timezone?: string | null;
  isOnVacation?: boolean;
  variant?: 'compact' | 'full' | 'sidebar';
  showHeading?: boolean;
  /** No muestra fila inferior (horario/zona); útil si el horario va en la cabecera */
  hideScheduleRow?: boolean;
  className?: string;
}

export const ServiceDetailAvailabilityWidget: React.FC<ServiceDetailAvailabilityWidgetProps> = ({
  availability,
  timezone,
  isOnVacation = false,
  variant = 'full',
  showHeading = true,
  hideScheduleRow = false,
  className = '',
}) => {
  const activeDays = normalizeAvailabilityDays(availability.daysOfWeek);
  const timeRange = formatAvailabilityTimeRange(availability.startTime, availability.endTime);
  const tzShort = timezone?.split('/').pop()?.replace(/_/g, ' ') ?? null;
  const cellSize =
    variant === 'compact' || variant === 'sidebar'
      ? 'h-7 min-w-0 flex-1 text-[10px]'
      : 'h-7 w-7 text-[11px]';

  const daysRow = (
    <div
      className={`flex w-full items-stretch gap-px overflow-hidden rounded-lg bg-[#e8e8e8] p-px ${
        variant === 'sidebar' ? '' : 'border border-[#ebebeb] bg-[#fafafa] p-0.5 gap-0.5'
      }`}
    >
      {EXPERT_WEEK_DAYS.map((day) => {
        const on = activeDays.has(day.key);
        return (
          <span
            key={day.key}
            title={`${day.label}${on ? '' : ' — no disponible'}`}
            aria-pressed={on}
            className={`inline-flex items-center justify-center font-bold leading-none transition-colors ${cellSize} ${
              variant === 'sidebar'
                ? on
                  ? 'bg-[#0066CC] text-white'
                  : 'bg-white text-[#b8b8b8]'
                : on
                  ? 'rounded-md bg-[#0066CC] text-white'
                  : 'rounded-md bg-white text-[#c4c4c4]'
            }`}
          >
            {day.short}
          </span>
        );
      })}
    </div>
  );

  const ariaLabel = ['Disponibilidad', timeRange, isOnVacation ? 'vacaciones' : null, tzShort]
    .filter(Boolean)
    .join(', ');

  const scheduleRow = (
    <div className="flex items-center justify-between gap-2">
      {timeRange ? (
        <span className="text-sm font-semibold tabular-nums tracking-tight text-[#0066CC]">
          {timeRange}
        </span>
      ) : (
        <span />
      )}
      <div className="flex shrink-0 items-center gap-1.5">
        {tzShort && (
          <span
            className="max-w-[7rem] truncate text-[11px] text-[#9ca3af]"
            title={timezone ?? undefined}
          >
            {tzShort}
          </span>
        )}
        {isOnVacation && (
          <span
            className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800"
            title="El experto está de vacaciones"
          >
            Vacaciones
          </span>
        )}
      </div>
    </div>
  );

  if (variant === 'sidebar') {
    return (
      <div className={`w-full ${hideScheduleRow ? '' : 'space-y-2.5'} ${className}`} role="group" aria-label={ariaLabel}>
        {showHeading && (
          <p className="mb-2 text-xs font-semibold text-[#1c1c1c]">Disponibilidad</p>
        )}
        {daysRow}
        {!hideScheduleRow && scheduleRow}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-x-2.5 gap-y-2 ${className}`}
      role="group"
      aria-label={ariaLabel}
    >
      {showHeading && (
        <span className="text-xs font-semibold text-[#1c1c1c] shrink-0">Disponibilidad</span>
      )}

      <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-[#ebebeb] bg-[#fafafa] p-0.5">
        {EXPERT_WEEK_DAYS.map((day) => {
          const on = activeDays.has(day.key);
          return (
            <span
              key={day.key}
              title={`${day.label}${on ? '' : ' — no disponible'}`}
              aria-pressed={on}
              className={`inline-flex items-center justify-center rounded-md font-bold leading-none transition-colors ${cellSize} ${
                on ? 'bg-[#0066CC] text-white' : 'bg-white text-[#c4c4c4]'
              }`}
            >
              {day.short}
            </span>
          );
        })}
      </div>

      {timeRange && (
        <>
          <span className="hidden sm:inline text-[#d4d4d4]" aria-hidden>
            ·
          </span>
          <span className="whitespace-nowrap text-xs font-semibold tabular-nums text-[#0066CC]">
            {timeRange}
          </span>
        </>
      )}

      {tzShort && (
        <span className="max-w-[6rem] truncate text-[10px] text-[#9ca3af]" title={timezone ?? undefined}>
          {tzShort}
        </span>
      )}

      {isOnVacation && (
        <span
          className="rounded bg-amber-100 px-1.5 py-px text-[10px] font-semibold text-amber-800"
          title="El experto está de vacaciones"
        >
          Vac.
        </span>
      )}
    </div>
  );
};
