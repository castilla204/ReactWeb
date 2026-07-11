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
  variant?: 'compact' | 'full' | 'sidebar' | 'mobile';
  showHeading?: boolean;
  /** No muestra fila inferior (horario/zona); útil si el horario va en la cabecera */
  hideScheduleRow?: boolean;
  /** Celdas de día más bajas (ficha móvil compacta) */
  dense?: boolean;
  className?: string;
}

export const ServiceDetailAvailabilityWidget: React.FC<ServiceDetailAvailabilityWidgetProps> = ({
  availability,
  timezone,
  isOnVacation = false,
  variant = 'full',
  showHeading = true,
  hideScheduleRow = false,
  dense = false,
  className = '',
}) => {
  const activeDays = normalizeAvailabilityDays(availability.daysOfWeek);
  const timeRange = formatAvailabilityTimeRange(availability.startTime, availability.endTime);
  const tzShort = timezone?.split('/').pop()?.replace(/_/g, ' ') ?? null;
  const cellSize =
    variant === 'sidebar'
      ? 'h-7 min-w-0 flex-1 text-[10px]'
      : variant === 'mobile'
        ? 'h-9 min-w-0 flex-1 text-xs'
        : variant === 'compact'
        ? 'h-8 min-w-0 flex-1 text-[11px]'
        : 'h-7 w-7 text-xs';

  const activeDayClass =
    'bg-white font-semibold text-[#1c1c1c] ring-1 ring-inset ring-brand';
  const inactiveDayClass = 'bg-[#fafafa] font-medium text-[#6a6a6a]';
  const sidebarActiveDayClass =
    'bg-brand/[0.09] font-semibold text-brand';
  const sidebarInactiveDayClass =
    'bg-transparent font-medium text-[#9ca3af]';
  // Tinte, no acento sólido: los días son información pasiva y no deben gritar
  // más que los CTAs de la página.
  const mobileActiveDayClass = 'bg-brand/10 font-semibold text-brand';
  const mobileInactiveDayClass = 'bg-[#f0f0f0] font-medium text-[#b0b0b0]';

  const denseDaysRow = (
    <div className="flex shrink-0 items-center gap-1">
      {EXPERT_WEEK_DAYS.map((day) => {
        const on = activeDays.has(day.key);
        return (
          <span
            key={day.key}
            title={`${day.label}${on ? '' : ' — no disponible'}`}
            aria-pressed={on}
            className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] leading-none ${
              on ? mobileActiveDayClass : mobileInactiveDayClass
            }`}
          >
            {day.short}
          </span>
        );
      })}
    </div>
  );

  const daysRow = (
    <div
      className={`flex w-full items-stretch overflow-hidden rounded-md ${
        variant === 'sidebar'
          ? 'gap-1 border border-[#e5e7eb] bg-white p-1'
          : 'gap-0.5 rounded-lg border border-[#ebebeb] bg-[#fafafa] p-0.5'
      }`}
    >
      {EXPERT_WEEK_DAYS.map((day) => {
        const on = activeDays.has(day.key);
        const isSidebar = variant === 'sidebar';
        return (
          <span
            key={day.key}
            title={`${day.label}${on ? '' : ' — no disponible'}`}
            aria-pressed={on}
            className={`inline-flex items-center justify-center rounded leading-none transition-colors ${cellSize} ${
              isSidebar
                ? on
                  ? sidebarActiveDayClass
                  : sidebarInactiveDayClass
                : on
                  ? activeDayClass
                  : inactiveDayClass
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
        <span className="text-sm font-semibold tabular-nums tracking-tight text-[#1c1c1c]">
          {timeRange}
        </span>
      ) : (
        <span />
      )}
      <div className="flex shrink-0 items-center gap-1.5">
        {tzShort && (
          <span
            className="max-w-[7rem] truncate text-xs text-[#737373]"
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

  if (dense) {
    return (
      <div className={`shrink-0 ${className}`} role="group" aria-label={ariaLabel}>
        {denseDaysRow}
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={`w-full ${hideScheduleRow ? '' : 'space-y-2'} ${className}`} role="group" aria-label={ariaLabel}>
        {showHeading && (
          <p className="mb-2 text-xs font-medium text-[#6a6a6a]">Disponibilidad</p>
        )}
        {daysRow}
        {!hideScheduleRow && scheduleRow}
      </div>
    );
  }

  if (variant === 'mobile') {
    return (
      <div
        className={`flex w-full items-center justify-between gap-1.5 ${className}`}
        role="group"
        aria-label={ariaLabel}
      >
        {EXPERT_WEEK_DAYS.map((day) => {
          const on = activeDays.has(day.key);
          return (
            <span
              key={day.key}
              title={`${day.label}${on ? '' : ' — no disponible'}`}
              aria-pressed={on}
              className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] leading-none transition-colors ${
                on ? mobileActiveDayClass : mobileInactiveDayClass
              }`}
            >
              {day.short}
            </span>
          );
        })}
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
              className={`inline-flex items-center justify-center rounded-md font-semibold leading-none transition-colors ${cellSize} ${
                on ? activeDayClass : 'bg-white font-medium text-[#c4c4c4]'
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
          <span className="whitespace-nowrap text-xs font-semibold tabular-nums text-[#1c1c1c]">
            {timeRange}
          </span>
        </>
      )}

      {tzShort && (
        <span className="max-w-[6rem] truncate text-xs text-[#737373]" title={timezone ?? undefined}>
          {tzShort}
        </span>
      )}

      {isOnVacation && (
        <span
          className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800"
          title="El experto está de vacaciones"
        >
          Vac.
        </span>
      )}
    </div>
  );
};
