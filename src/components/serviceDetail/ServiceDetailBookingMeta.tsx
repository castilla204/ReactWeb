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

const asideSectionDividerClass = 'mt-5 border-t border-[#ebebeb] pt-5';

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

  const defaultAsideMapClass = `${SD_ASIDE_MAP_PREVIEW_HEIGHT_CLASS} w-full rounded-lg border border-[#e8e8e8]`;
  const defaultMinimalMapClass =
    `${SD_MOBILE_MAP_PREVIEW_HEIGHT_CLASS} w-full rounded-lg border border-[#ebebeb]`;

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
              <span className="mx-1.5 text-[#d4d4d4]" aria-hidden>
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
        <p className="mb-2.5 text-sm font-medium text-[#1c1c1c]">
          {locationLabel ? <span>{locationLabel}</span> : null}
          {locationLabel ? (
            <span className="mx-1.5 font-normal text-[#d4d4d4]" aria-hidden>
              ·
            </span>
          ) : null}
          <span className="font-normal text-[#6a6a6a]">{radiusLabel}</span>
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
        <div
          className="flex items-center justify-between gap-2"
          aria-label={[
            'Disponibilidad',
            availabilityTimeRange,
            isOnVacation ? 'vacaciones' : null,
          ]
            .filter(Boolean)
            .join(', ')}
        >
          <ServiceDetailAvailabilityWidget
            availability={availability}
            timezone={timezone}
            isOnVacation={isOnVacation}
            variant="sidebar"
            showHeading={false}
            hideScheduleRow
            dense
            className="min-w-0 flex-1"
          />
          <div className="flex shrink-0 items-center gap-1.5">
            {availabilityTimeRange ? (
              <span className="text-xs font-semibold tabular-nums text-[#1c1c1c]">
                {availabilityTimeRange}
              </span>
            ) : null}
            {isOnVacation ? (
              <span
                className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800"
                title="El experto está de vacaciones"
              >
                Vac.
              </span>
            ) : null}
          </div>
        </div>
      </div>
    ) : (
      <section className="w-full">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <p className="text-[11px] font-medium text-[#6a6a6a]">Disponibilidad</p>
          {isOnVacation ? (
            <span
              className="text-[10px] font-medium text-[#b45309]"
              title="El experto está de vacaciones"
            >
              No disponible
            </span>
          ) : null}
        </div>
        {availabilityTimeRange ? (
          <p className="mb-2 text-xs font-medium tabular-nums text-[#222222]">
            {availabilityTimeRange}
            {tzShort ? (
              <span className="ml-1 font-normal text-[#9ca3af]">· {tzShort}</span>
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
          <p className="mt-2 text-[11px] leading-relaxed text-[#9ca3af]">
            Tras solicitar el encargo eliges día y hora dentro de este horario.
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
