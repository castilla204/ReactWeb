import React from 'react';
import {
  ServiceDetailDeliverablesGuide,
  type ServiceDeliverableType,
} from '../serviceDetail/ServiceDetailDeliverablesGuide';
import { HP_LINK_UNDERLINE_CLASS } from '../../constants/homepageTypography';

export interface CheckoutSummaryCardProps {
  serviceName: string;
  expertName: string;
  durationLabel: string;
  categoryName?: string;
  locationLabel?: string | null;
  imageUrl?: string;
  deliverables: ServiceDeliverableType[];
  onViewService: () => void;
}

/** Resumen compacto del servicio — una sola card, sin secciones repetidas. */
export function CheckoutSummaryCard({
  serviceName,
  expertName,
  durationLabel,
  categoryName,
  locationLabel,
  imageUrl,
  deliverables,
  onViewService,
}: CheckoutSummaryCardProps) {
  const metaParts = [durationLabel, categoryName].filter(Boolean);

  return (
    <article className="rounded-xl border border-line bg-white p-5">
      <div className="flex gap-3">
        {imageUrl ? (
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-1 ring-line">
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold leading-snug text-ink">{serviceName}</h2>
          <p className="mt-0.5 text-xs text-ink-muted">con {expertName}</p>
          {metaParts.length > 0 ? (
            <p className="mt-1.5 text-xs text-ink-muted">{metaParts.join(' · ')}</p>
          ) : null}
          {locationLabel ? (
            <p className="mt-1 text-xs text-ink-muted">{locationLabel}</p>
          ) : null}
        </div>
      </div>

      {deliverables.length > 0 ? (
        <div className="mt-3 [&_.sd-deliverable-chip-surface]:text-xs">
          <ServiceDetailDeliverablesGuide
            items={deliverables}
            variant="inline"
            presentation="chips"
            showHeading={false}
          />
        </div>
      ) : null}

      <button
        type="button"
        onClick={onViewService}
        className={`mt-3 text-xs font-medium text-brand ${HP_LINK_UNDERLINE_CLASS}`}
      >
        Ver ficha del servicio
      </button>
    </article>
  );
}
