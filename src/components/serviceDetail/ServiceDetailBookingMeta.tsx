import React, { lazy, Suspense } from 'react';
import { ServiceDetailAvailabilityWidget } from './ServiceDetailAvailabilityWidget';
import { LazyMount } from '../Map/LazyMount';
import {
  type ExpertAvailabilityInput,
  formatAvailabilityTimeRange,
} from '../../utils/expertAvailability';
import {
  SD_MOBILE_BOOKING_DIVIDER_CLASS,
  SD_MOBILE_MAP_PREVIEW_HEIGHT_CLASS,
  SD_MOBILE_MAP_PREVIEW_MIN_HEIGHT_PX,
  SD_MOBILE_BOOKING_LABEL_CLASS,
  SD_MOBILE_META_CLASS,
  SD_MOBILE_SECTION_TITLE_CLASS,
} from '../../constants/homepageTypography';

const ServiceDetailCoverageMap = lazy(() =>
  import('./ServiceDetailCoverageMap').then((m) => ({
    default: m.ServiceDetailCoverageMap,
  })),
);

export interface ServiceDetailBookingMetaProps {
  availability?: ExpertAvailabilityInput | null;
  timezone?: string | null;
  isOnVacation?: boolean;
  location?: { latitude: number; longitude: number } | null;
  rangeKm?: number;
  locationLabel?: string | null;
  /** card = aside desktop; minimal = móvil plano sin card anidada */
  layout?: 'card' | 'minimal';
  coverageFirst?: boolean;
  mapVariant?: 'preview' | 'interactive';
  mapClassName?: string;
  showAvailabilityHint?: boolean;
  showCoverage?: boolean;
  showAvailability?: boolean;
  /** Sin padding horizontal extra (el padre ya tiene gutter) */
  embedded?: boolean;
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
  showCoverage = true,
  showAvailability = true,
  embedded = false,
  className = '',
}) => {
  const hasAvailability = Boolean(availability);
  const hasCoverage = Boolean(location);
  const renderCoverage = showCoverage && hasCoverage;
  const renderAvailability = showAvailability && hasAvailability;
  if (!renderCoverage && !renderAvailability) return null;

  const minimalPadX = embedded ? 'px-0' : 'px-4';

  const radius = Math.max(5, rangeKm);
  const isMinimal = layout === 'minimal';

  const availabilityTimeRange =
    hasAvailability && availability
      ? formatAvailabilityTimeRange(availability.startTime, availability.endTime)
      : null;

  const defaultAsideMapClass = 'h-[148px] w-full rounded-lg border border-[#e8e8e8]';
  const defaultMinimalMapClass =
    `${SD_MOBILE_MAP_PREVIEW_HEIGHT_CLASS} w-full rounded-lg border border-[#ebebeb]`;

  const resolvedMapClassName =
    mapClassName ?? (isMinimal ? defaultMinimalMapClass : defaultAsideMapClass);

  const coverageBlock = renderCoverage && location && (
    isMinimal ? (
      <>
        <div
          className={`flex min-w-0 items-center justify-between gap-2 ${minimalPadX}`}
          aria-label={
            locationLabel
              ? `Cobertura de ${radius} kilómetros en ${locationLabel}`
              : `Cobertura de ${radius} kilómetros`
          }
        >
          <span className="shrink-0 whitespace-nowrap">
            <span className={SD_MOBILE_SECTION_TITLE_CLASS}>Cobertura</span>
            <span className={`${SD_MOBILE_META_CLASS} normal-case tracking-normal`}>
              {` · ${radius} km`}
            </span>
          </span>
          {locationLabel ? (
            <span
              className={`min-w-0 flex-1 truncate text-end ${SD_MOBILE_META_CLASS}`}
              title={locationLabel}
            >
              {locationLabel}
            </span>
          ) : null}
        </div>
        <div className={`${minimalPadX} mt-2`}>
          <LazyMount
            className={SD_MOBILE_MAP_PREVIEW_HEIGHT_CLASS}
            minHeight={SD_MOBILE_MAP_PREVIEW_MIN_HEIGHT_PX}
          >
            <Suspense fallback={null}>
              <ServiceDetailCoverageMap
                latitude={location.latitude}
                longitude={location.longitude}
                rangeKm={radius}
                variant={mapVariant}
                expandable={mapVariant === 'preview'}
                className={resolvedMapClassName}
              />
            </Suspense>
          </LazyMount>
        </div>
      </>
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
        <LazyMount aspectRatio="16/9" minHeight={180}>
          <Suspense fallback={null}>
            <ServiceDetailCoverageMap
              latitude={location.latitude}
              longitude={location.longitude}
              rangeKm={radius}
              variant={mapVariant}
              expandable={mapVariant === 'preview'}
              className={resolvedMapClassName}
            />
          </Suspense>
        </LazyMount>
      </section>
    )
  );

  const tzShort = timezone?.split('/').pop()?.replace(/_/g, ' ') ?? null;

  const availabilityBlock = renderAvailability && availability && (
    isMinimal ? (
      <div
        className={`space-y-3 ${minimalPadX} ${
          renderCoverage && coverageFirst ? SD_MOBILE_BOOKING_DIVIDER_CLASS : ''
        }`}
        aria-label={[
          'Disponibilidad',
          availabilityTimeRange,
          tzShort,
          isOnVacation ? 'vacaciones' : null,
        ]
          .filter(Boolean)
          .join(', ')}
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className={SD_MOBILE_BOOKING_LABEL_CLASS}>Disponibilidad</span>
          <div className="flex min-w-0 shrink-0 items-center gap-2">
            {availabilityTimeRange ? (
              <span className="whitespace-nowrap text-xs font-semibold tabular-nums text-brand">
                {availabilityTimeRange}
              </span>
            ) : null}
            {isOnVacation ? (
              <span
                className="rounded-full bg-amber-100 px-1.5 py-px text-[10px] font-semibold text-amber-800"
                title="El experto está de vacaciones"
              >
                Vac.
              </span>
            ) : null}
          </div>
        </div>
        <ServiceDetailAvailabilityWidget
          availability={availability}
          timezone={timezone}
          isOnVacation={isOnVacation}
          variant="sidebar"
          showHeading={false}
          hideScheduleRow
          className="w-full"
        />
      </div>
    ) : (
      <section className="w-full">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-[#1c1c1c]">Disponibilidad</p>
          <div className="flex shrink-0 items-center gap-2">
            {availabilityTimeRange ? (
              <span className="text-xs font-semibold tabular-nums text-brand">
                {availabilityTimeRange}
              </span>
            ) : null}
            {isOnVacation ? (
              <span
                className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800"
                title="El experto está de vacaciones"
              >
                Vac.
              </span>
            ) : null}
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
        {showAvailabilityHint ? (
          <p className="mt-2.5 text-xs leading-snug text-[#6a6a6a]">
            Tras reservar eliges día y hora dentro de este horario.
          </p>
        ) : null}
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
        aria-label={renderAvailability ? 'Información para reservar' : 'Zona de cobertura'}
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
