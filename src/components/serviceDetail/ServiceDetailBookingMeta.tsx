import React from 'react';
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
  /** card = aside desktop (plano, ancho completo); minimal = móvil */
  layout?: 'card' | 'minimal';
  coverageFirst?: boolean;
  mapVariant?: 'preview' | 'interactive';
  mapClassName?: string;
  showAvailabilityHint?: boolean;
  className?: string;
}

const asideSectionDividerClass = 'mt-4 border-t border-[#e8e8e8] pt-4';

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
  mapClassName,
  showAvailabilityHint = true,
  className = '',
}) => {
  const hasAvailability = Boolean(availability);
  const hasCoverage = Boolean(location);
  if (!hasAvailability && !hasCoverage) return null;

  const radius = Math.max(5, rangeKm);
  const isMinimal = layout === 'minimal';

  const availabilityTimeRange =
    hasAvailability && availability
      ? formatAvailabilityTimeRange(availability.startTime, availability.endTime)
      : null;

  const defaultAsideMapClass =
    'h-[128px] w-full rounded-lg border border-[#e8e8e8]';
  const defaultMinimalMapClass =
    'h-[100px] w-full rounded-none border-x-0 border-y border-[#ebebeb]';

  const resolvedMapClassName =
    mapClassName ?? (isMinimal ? defaultMinimalMapClass : defaultAsideMapClass);

  const coverageBlock = hasCoverage && location && (
    isMinimal ? (
      <div className="w-full">
        <div
          className={`mb-2 ${SD_MOBILE_GUTTER_CLASS} flex min-w-0 items-center gap-3 text-xs text-[#6a6a6a]`}
          aria-label={
            locationLabel
              ? `Cobertura de ${radius} kilómetros en ${locationLabel}`
              : `Cobertura de ${radius} kilómetros`
          }
        >
          <p className="shrink-0 whitespace-nowrap">
            <span className="font-medium text-[#1c1c1c]">Cobertura</span>
            <span>{` · ${radius} km`}</span>
          </p>
          {locationLabel ? (
            <span
              className="min-w-0 flex-1 truncate text-end text-[#6a6a6a]"
              title={locationLabel}
            >
              {locationLabel}
            </span>
          ) : null}
        </div>
        <ServiceDetailCoverageMap
          latitude={location.latitude}
          longitude={location.longitude}
          rangeKm={radius}
          variant={mapVariant}
          expandable={mapVariant === 'preview'}
          className={resolvedMapClassName}
        />
      </div>
    ) : (
      <section className="w-full">
        <p className="mb-2.5 text-xs text-[#6a6a6a]">
          <span className="font-medium text-[#1c1c1c]">Cobertura</span>
          {locationLabel ? (
            <>
              <span className="mx-1 text-[#d4d4d4]">·</span>
              <span>{locationLabel}</span>
            </>
          ) : null}
          <span className="mx-1 text-[#d4d4d4]">·</span>
          <span>{radius} km</span>
        </p>
        <ServiceDetailCoverageMap
          latitude={location.latitude}
          longitude={location.longitude}
          rangeKm={radius}
          variant={mapVariant}
          expandable={mapVariant === 'preview'}
          className={resolvedMapClassName}
        />
      </section>
    )
  );

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
      <section className="w-full">
        <div className="mb-2.5 flex items-center justify-between gap-3">
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
        {showAvailabilityHint && (
          <p className="mt-2.5 text-[11px] leading-snug text-[#9ca3af]">
            Tras reservar eliges día y hora dentro de este horario.
          </p>
        )}
      </section>
    )
  );

  const wrapAsideSecond = (node: React.ReactNode) => (
    <div className={asideSectionDividerClass}>{node}</div>
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

  /* Desktop aside: sin caja gris ni divide-y; secciones al 100% como en móvil */
  return (
    <div
      role="group"
      aria-label="Información para reservar"
      className={`w-full ${className}`.trim()}
    >
      {coverageFirst ? (
        <>
          {coverageBlock}
          {availabilityBlock ? wrapAsideSecond(availabilityBlock) : null}
        </>
      ) : (
        <>
          {availabilityBlock}
          {coverageBlock ? wrapAsideSecond(coverageBlock) : null}
        </>
      )}
    </div>
  );
};
