import React from 'react';
import { CalendarClock, MapPin } from 'lucide-react';
import { ServiceDetailAvailabilityWidget } from './ServiceDetailAvailabilityWidget';
import { ServiceDetailCoverageMap } from './ServiceDetailCoverageMap';
import {
  type ExpertAvailabilityInput,
  formatAvailabilityTimeRange,
} from '../../utils/expertAvailability';
import { SD_MOBILE_GUTTER_CLASS } from '../../constants/homepageTypography';

export interface ServiceDetailBookingMetaProps {
  availability?: ExpertAvailabilityInput | null;
  timezone?: string | null;
  isOnVacation?: boolean;
  location?: { latitude: number; longitude: number } | null;
  rangeKm?: number;
  locationLabel?: string | null;
  /** card = aside desktop; minimal = móvil sin caja */
  layout?: 'card' | 'minimal';
  coverageFirst?: boolean;
  mapVariant?: 'preview' | 'interactive';
  mapClassName?: string;
  showAvailabilityHint?: boolean;
  className?: string;
}

export const ServiceDetailBookingMeta: React.FC<ServiceDetailBookingMetaProps> = ({
  availability,
  timezone,
  isOnVacation = false,
  location,
  rangeKm = 25,
  locationLabel,
  layout = 'card',
  coverageFirst = false,
  mapVariant = 'preview',
  mapClassName = 'h-[120px] w-full',
  showAvailabilityHint = true,
  className = '',
}) => {
  const hasAvailability = Boolean(availability);
  const hasCoverage = Boolean(location);
  if (!hasAvailability && !hasCoverage) return null;

  const radius = Math.max(5, rangeKm);
  const isMinimal = layout === 'minimal';

  const coverageBlock = hasCoverage && location && (
    isMinimal ? (
      <div className="w-full">
        <p className={`mb-2 ${SD_MOBILE_GUTTER_CLASS} text-xs text-[#6a6a6a]`}>
          <span className="font-medium text-[#1c1c1c]">Cobertura</span>
          <span>{` · ${radius} km`}</span>
        </p>
        <ServiceDetailCoverageMap
          latitude={location.latitude}
          longitude={location.longitude}
          rangeKm={radius}
          variant={mapVariant}
          expandable={mapVariant === 'preview'}
          className={mapClassName ?? 'h-[100px] w-full rounded-none border-x-0 border-y border-[#ebebeb]'}
        />
      </div>
    ) : (
      <section className="p-3.5">
        <h3 className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6a6a6a]">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#0066CC]" aria-hidden />
          Zona de cobertura
        </h3>
        <p className="mb-2.5 text-xs text-[#6a6a6a]">
          {locationLabel ? (
            <>
              <span className="font-medium text-[#1c1c1c]">{locationLabel}</span>
              <span className="mx-1 text-[#d4d4d4]">·</span>
            </>
          ) : null}
          Radio de {radius} km
        </p>
        <ServiceDetailCoverageMap
          latitude={location.latitude}
          longitude={location.longitude}
          rangeKm={radius}
          variant={mapVariant}
          expandable={mapVariant === 'preview'}
          className={mapClassName}
        />
      </section>
    )
  );

  const availabilityTimeRange =
    hasAvailability && availability
      ? formatAvailabilityTimeRange(availability.startTime, availability.endTime)
      : null;

  const availabilityBlock = hasAvailability && availability && (
    isMinimal ? (
      <div className={`${SD_MOBILE_GUTTER_CLASS} pt-3`}>
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-[#1c1c1c]">Disponibilidad</p>
          <div className="flex shrink-0 items-center gap-2">
            {availabilityTimeRange && (
              <span className="text-xs font-semibold tabular-nums text-[#0066CC]">
                {availabilityTimeRange}
              </span>
            )}
            {isOnVacation && (
              <span
                className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800"
                title="El experto está de vacaciones"
              >
                Vac.
              </span>
            )}
          </div>
        </div>
        <ServiceDetailAvailabilityWidget
          availability={availability}
          timezone={timezone}
          isOnVacation={isOnVacation}
          variant="sidebar"
          showHeading={false}
          hideScheduleRow
        />
      </div>
    ) : (
      <section className="p-3.5">
        <h3 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6a6a6a]">
          <CalendarClock className="h-3.5 w-3.5 shrink-0 text-[#0066CC]" aria-hidden />
          Disponibilidad
        </h3>
        <ServiceDetailAvailabilityWidget
          availability={availability}
          timezone={timezone}
          isOnVacation={isOnVacation}
          variant="sidebar"
          showHeading={false}
        />
        {showAvailabilityHint && (
          <p className="mt-2 text-[10px] leading-snug text-[#9ca3af]">
            Tras reservar eliges día y hora dentro de este horario.
          </p>
        )}
      </section>
    )
  );

  if (isMinimal) {
    return (
      <div
        role="group"
        aria-label="Información para reservar"
        className={`w-full ${className}`.trim()}
      >
        {coverageFirst ? (
          <>
            {coverageBlock}
            {availabilityBlock}
          </>
        ) : (
          <>
            {availabilityBlock}
            {coverageBlock}
          </>
        )}
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label="Información para reservar"
      className={`overflow-hidden rounded-xl border border-[#e8e8e8] bg-[#fafafa] divide-y divide-[#e8e8e8] ${className}`.trim()}
    >
      {coverageFirst ? (
        <>
          {coverageBlock}
          {availabilityBlock}
        </>
      ) : (
        <>
          {availabilityBlock}
          {coverageBlock}
        </>
      )}
    </div>
  );
};
