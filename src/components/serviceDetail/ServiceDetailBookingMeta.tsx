import React, { lazy, Suspense } from 'react';
import { ServiceDetailAvailabilityWidget } from './ServiceDetailAvailabilityWidget';
import { LazyMount } from '../Map/LazyMount';
import {
  type ExpertAvailabilityInput,
  formatAvailabilityTimeRange,
} from '../../utils/expertAvailability';
import {
  SD_ASIDE_MAP_PREVIEW_HEIGHT_CLASS,
  SD_ASIDE_MAP_PREVIEW_MIN_HEIGHT_PX,
  SD_ASIDE_SECTION_LABEL_CLASS,
  SD_MOBILE_BOOKING_DIVIDER_CLASS,
  SD_MOBILE_BOOKING_LABEL_CLASS,
  SD_MOBILE_AVAILABILITY_TIME_CLASS,
  SD_MOBILE_MAP_PREVIEW_HEIGHT_CLASS,
  SD_MOBILE_MAP_PREVIEW_MIN_HEIGHT_PX,
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
  /** El título de sección lo pone el padre (scroll Airbnb) */
  hideSectionTitle?: boolean;
  className?: string;
}

const asideSectionDividerClass = 'mt-5 border-t border-line pt-5';

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
  hideSectionTitle = false,
  className = '',
}) => {
  const hasAvailability = Boolean(availability);
  const hasCoverage = Boolean(location);
  const renderCoverage = showCoverage && hasCoverage;
  const renderAvailability = showAvailability && hasAvailability;
  if (!renderCoverage && !renderAvailability) return null;

  const minimalPadX = embedded ? 'px-0' : 'px-4';

  // rangeKm === 0: el experto atiende solo en su taller (punto fijo) — etiqueta
  // distinta y el mapa dibuja solo el pin, sin círculo.
  const isWorkshopOnly = rangeKm === 0;
  const radius = isWorkshopOnly ? 0 : Math.max(5, rangeKm);
  const radiusLabel = isWorkshopOnly ? 'Solo en su taller' : `${radius} km de radio`;
  const isMinimal = layout === 'minimal';

  const availabilityTimeRange =
    hasAvailability && availability
      ? formatAvailabilityTimeRange(availability.startTime, availability.endTime)
      : null;

  const defaultAsideMapClass = `${SD_ASIDE_MAP_PREVIEW_HEIGHT_CLASS} w-full rounded-lg border border-line`;
  const defaultMinimalMapClass =
    `${SD_MOBILE_MAP_PREVIEW_HEIGHT_CLASS} w-full rounded-lg border border-line`;

  const resolvedMapClassName =
    mapClassName ?? (isMinimal ? defaultMinimalMapClass : defaultAsideMapClass);

  const coverageBlock = renderCoverage && location && (
    isMinimal ? (
      <>
        {!hideSectionTitle ? (
          <div
            className={`flex min-w-0 items-center justify-between gap-2 ${minimalPadX}`}
            aria-label={
              isWorkshopOnly
                ? (locationLabel ? `Atiende solo en su taller en ${locationLabel}` : 'Atiende solo en su taller')
                : locationLabel
                  ? `Cobertura de ${radius} kilómetros en ${locationLabel}`
                  : `Cobertura de ${radius} kilómetros`
            }
          >
            <span className="shrink-0 whitespace-nowrap">
              <span className={SD_MOBILE_SECTION_TITLE_CLASS}>Cobertura</span>
              <span className={`${SD_MOBILE_META_CLASS} normal-case tracking-normal`}>
                {isWorkshopOnly ? ' · Solo en su taller' : ` · ${radius} km`}
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
        ) : (
          <p className={`${minimalPadX} ${SD_MOBILE_META_CLASS}`}>
            {locationLabel ? <span>{locationLabel}</span> : null}
            {locationLabel ? (
              <span className="mx-1.5 text-line" aria-hidden>
                ·
              </span>
            ) : null}
            <span>{radiusLabel}</span>
          </p>
        )}
        <div className={`${minimalPadX} ${hideSectionTitle ? 'mt-3' : 'mt-2'}`}>
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
        <p className={`${SD_ASIDE_SECTION_LABEL_CLASS} mb-2`}>Cobertura</p>
        <p className="mb-2.5 text-sm font-medium text-ink-strong">
          {locationLabel ? <span>{locationLabel}</span> : null}
          {locationLabel ? (
            <span className="mx-1.5 font-normal text-line" aria-hidden>
              ·
            </span>
          ) : null}
          <span className="font-normal text-ink-muted">{radiusLabel}</span>
        </p>
        <LazyMount aspectRatio="16/9" minHeight={SD_ASIDE_MAP_PREVIEW_MIN_HEIGHT_PX}>
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
        className={`${minimalPadX} ${
          renderCoverage && coverageFirst ? SD_MOBILE_BOOKING_DIVIDER_CLASS : ''
        }`}
      >
        <div className="flex items-baseline justify-between gap-2">
          <span className={SD_MOBILE_BOOKING_LABEL_CLASS}>Horario habitual</span>
          <div className="flex shrink-0 items-center gap-1.5">
            {availabilityTimeRange ? (
              <span className={SD_MOBILE_AVAILABILITY_TIME_CLASS}>
                {availabilityTimeRange}
              </span>
            ) : null}
            {isOnVacation ? (
              <span
                className="rounded-full bg-warning-tint px-1.5 py-0.5 text-badge font-semibold text-warning"
                title="El experto está de vacaciones"
              >
                Vacaciones
              </span>
            ) : null}
          </div>
        </div>
        <ServiceDetailAvailabilityWidget
          availability={availability}
          timezone={timezone}
          isOnVacation={isOnVacation}
          variant="mobile"
          showHeading={false}
          hideScheduleRow
          className="mt-1.5 w-fit"
        />
      </div>
    ) : (
      <section className="w-full">
        <p className="mb-2.5 text-xs font-medium text-ink-muted">
          Horario habitual
          {isOnVacation ? (
            <span
              className="ml-2 font-normal text-warning"
              title="El experto está de vacaciones"
            >
              · De vacaciones
            </span>
          ) : null}
        </p>
        {availabilityTimeRange ? (
          <p className="mb-2.5 text-sm font-medium tabular-nums text-ink">
            {availabilityTimeRange}
            {tzShort ? (
              <span className="ml-1 font-normal text-ink-soft">· {tzShort}</span>
            ) : null}
          </p>
        ) : null}
        <ServiceDetailAvailabilityWidget
          availability={availability}
          timezone={timezone}
          isOnVacation={isOnVacation}
          variant="sidebar"
          showHeading={false}
          hideScheduleRow
        />
        {showAvailabilityHint ? (
          <p className="mt-2 text-kicker leading-relaxed text-ink-muted">
            Al reservar eliges día y hora dentro de este horario.
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
