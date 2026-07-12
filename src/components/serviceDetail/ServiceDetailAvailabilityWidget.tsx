import React from 'react';
import { cn } from '../../lib/utils';
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
  /** @deprecated Usar variant="mobile" (misma fila compacta) */
  dense?: boolean;
  className?: string;
}

function MobileDaysRow({
  activeDays,
  className,
}: {
  activeDays: Set<string>;
  className?: string;
}) {
  return (
    <div className={cn('sd-availability-mobile-days', className)}>
      {EXPERT_WEEK_DAYS.map((day) => {
        const on = activeDays.has(day.key);
        return (
          <span
            key={day.key}
            title={`${day.label}${on ? '' : ' — no disponible'}`}
            aria-hidden="true"
            className={cn(
              'sd-availability-mobile-day',
              on ? 'sd-availability-mobile-day--active' : 'sd-availability-mobile-day--inactive',
            )}
          >
            {day.short}
          </span>
        );
      })}
    </div>
  );
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
      ? 'h-7 min-w-0 flex-1 text-badge'
      : variant === 'compact'
        ? 'h-8 min-w-0 flex-1 text-kicker'
        : 'h-7 w-7 text-xs';

  const activeDayClass =
    'bg-white font-semibold text-ink-strong ring-1 ring-inset ring-brand';
  const inactiveDayClass = 'bg-surface-tinted font-medium text-ink-muted';
  const sidebarActiveDayClass = 'bg-brand/[0.09] font-semibold text-brand';
  const sidebarInactiveDayClass = 'bg-transparent font-medium text-ink-muted';

  const daysRow = (
    <div
      className={`flex w-full items-stretch overflow-hidden rounded-md ${
        variant === 'sidebar'
          ? 'gap-1 border border-line bg-surface p-1'
          : 'gap-0.5 rounded-lg border border-line-soft bg-surface-tinted p-0.5'
      }`}
    >
      {EXPERT_WEEK_DAYS.map((day) => {
        const on = activeDays.has(day.key);
        const isSidebar = variant === 'sidebar';
        return (
          <span
            key={day.key}
            title={`${day.label}${on ? '' : ' — no disponible'}`}
            aria-hidden="true"
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
        <span className="text-sm font-semibold tabular-nums tracking-tight text-ink-strong">
          {timeRange}
        </span>
      ) : (
        <span />
      )}
      <div className="flex shrink-0 items-center gap-1.5">
        {tzShort && (
          <span
            className="max-w-[7rem] truncate text-xs text-ink-soft"
            title={timezone ?? undefined}
          >
            {tzShort}
          </span>
        )}
        {isOnVacation && (
          <span
            className="rounded-full bg-amber-100 px-2 py-0.5 text-badge font-semibold text-amber-800"
            title="El experto está de vacaciones"
          >
            Vacaciones
          </span>
        )}
      </div>
    </div>
  );

  if (dense || variant === 'mobile') {
    return (
      <div className={cn('shrink-0', className)} role="group" aria-label={ariaLabel}>
        <MobileDaysRow activeDays={activeDays} />
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={`w-full ${hideScheduleRow ? '' : 'space-y-2'} ${className}`} role="group" aria-label={ariaLabel}>
        {showHeading && (
          <p className="mb-2 text-xs font-medium text-ink-muted">Disponibilidad</p>
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
        <span className="text-xs font-semibold text-ink-strong shrink-0">Disponibilidad</span>
      )}

      <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-line-soft bg-surface-tinted p-0.5">
        {EXPERT_WEEK_DAYS.map((day) => {
          const on = activeDays.has(day.key);
          return (
            <span
              key={day.key}
              title={`${day.label}${on ? '' : ' — no disponible'}`}
              aria-hidden="true"
              className={`inline-flex items-center justify-center rounded-md font-semibold leading-none transition-colors ${cellSize} ${
                on ? activeDayClass : 'bg-surface font-medium text-ink-muted'
              }`}
            >
              {day.short}
            </span>
          );
        })}
      </div>

      {timeRange && (
        <>
          <span className="hidden sm:inline text-line" aria-hidden>
            ·
          </span>
          <span className="whitespace-nowrap text-xs font-semibold tabular-nums text-ink-strong">
            {timeRange}
          </span>
        </>
      )}

      {tzShort && (
        <span className="max-w-[6rem] truncate text-xs text-ink-soft" title={timezone ?? undefined}>
          {tzShort}
        </span>
      )}

      {isOnVacation && (
        <span
          className="rounded-md bg-amber-100 px-1.5 py-0.5 text-badge font-semibold text-amber-800"
          title="El experto está de vacaciones"
        >
          Vac.
        </span>
      )}
    </div>
  );
};
