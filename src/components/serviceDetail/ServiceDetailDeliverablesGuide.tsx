import React, { useState } from 'react';
import { ChevronRight, FileText, Video, type LucideIcon } from 'lucide-react';
import { ResponsiveModal } from '../ui/responsive-modal';
import { getDeliverableDetail } from '../../utils/deliverableDetailContent';
import {
  mapSelectedDeliverableType,
  mapSelectedDeliverableTypes,
  type ServiceDeliverableType,
} from '../../utils/mapSelectedDeliverableTypes';

export type { ServiceDeliverableType };

function getDeliverableLabel(dt: ServiceDeliverableType): string {
  return (
    dt.displayName ||
    dt.deliverableType?.displayName ||
    dt.name ||
    dt.deliverableType?.name ||
    ''
  ).trim();
}

function getDeliverableKey(dt: ServiceDeliverableType): string {
  return (dt.name || dt.displayName || dt.deliverableType?.name || '').toLowerCase();
}

function getDeliverableIcon(dt: ServiceDeliverableType): LucideIcon {
  const key = getDeliverableKey(dt);
  if (key.includes('video') || key.includes('vídeo')) return Video;
  return FileText;
}

function getOverlayDeliverableLabel(dt: ServiceDeliverableType): string {
  const key = getDeliverableKey(dt);
  if (key.includes('pdf') || key.includes('informe')) return 'Informe';
  if (key.includes('video') || key.includes('vídeo')) return 'Vídeo';
  const full = getDeliverableLabel(dt);
  return full.length > 14 ? `${full.slice(0, 12)}…` : full;
}

export function normalizeDeliverableTypes(
  items: ServiceDeliverableType[] | unknown[] | undefined | null
): ServiceDeliverableType[] {
  if (!items?.length) return [];
  return mapSelectedDeliverableTypes(items);
}

interface ServiceDetailDeliverablesGuideProps {
  items: ServiceDeliverableType[] | unknown[];
  variant?: 'overlay' | 'inline';
  showHeading?: boolean;
  className?: string;
}

/** Entregables del servicio; al pulsar un chip se muestra qué incluye. */
export const ServiceDetailDeliverablesGuide: React.FC<ServiceDetailDeliverablesGuideProps> = ({
  items,
  variant = 'overlay',
  showHeading = true,
  className = '',
}) => {
  const visible = normalizeDeliverableTypes(items);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<ServiceDeliverableType | null>(null);

  if (visible.length === 0) return null;

  const isOverlay = variant === 'overlay';
  const hasPdf = visible.some((dt) => {
    const key = (dt.name || dt.displayName || '').toLowerCase();
    return key.includes('pdf') || key.includes('informe');
  });
  const detail = active ? getDeliverableDetail(active, { hasPdf }) : null;

  const openDetail = (dt: ServiceDeliverableType, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActive(dt);
    setOpen(true);
  };

  const overlayChipList = (
    <ul className="sd-deliverable-guide-items">
      {visible.map((dt, idx) => {
        const label = getOverlayDeliverableLabel(dt);
        const fullLabel = getDeliverableLabel(dt);
        const Icon = getDeliverableIcon(dt);
        return (
          <li key={dt.id ?? `${fullLabel}-${idx}`} className="sd-deliverable-guide-item">
            <button
              type="button"
              className="sd-deliverable-chip"
              style={{ animationDelay: `${40 + idx * 50}ms` }}
              onClick={(e) => openDetail(dt, e)}
              aria-haspopup="dialog"
              aria-expanded={open && active?.id === dt.id}
              aria-label={`Ver qué incluye: ${fullLabel}`}
            >
              <Icon className="sd-deliverable-chip-icon" aria-hidden />
              <span>{label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  const surfaceChipList = (
    <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
      {visible.map((dt, index) => {
        const label = getDeliverableLabel(dt);
        const Icon = getDeliverableIcon(dt);
        return (
          <li key={dt.id ?? `${label}-${index}`}>
            <button
              type="button"
              className="sd-deliverable-chip-surface"
              onClick={(e) => openDetail(dt, e)}
              aria-haspopup="dialog"
              aria-expanded={open && active?.id === dt.id}
              aria-label={`Ver qué incluye: ${label}`}
            >
              <Icon className="sd-deliverable-chip-surface-icon" aria-hidden />
              <span>{label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  const detailModal = detail ? (
    <ResponsiveModal
      open={open}
      onOpenChange={setOpen}
      title={detail.title}
      description="Qué recibirás con este servicio"
      drawerMaxHeight="70dvh"
      dialogClassName="max-w-md"
    >
      <div className="space-y-4 pt-1">
        <p className="text-sm leading-relaxed text-[#6a6a6a]">{detail.description}</p>
        {detail.isRequired ? (
          <p className="text-xs font-medium text-brand">Incluido en el precio del servicio</p>
        ) : null}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#1c1c1c]">
            Este archivo incluye
          </p>
          <ul className="space-y-2">
            {detail.includes.map((line) => (
              <li key={line} className="flex gap-2 text-sm leading-snug text-[#6a6a6a]">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs leading-relaxed text-[#6a6a6a]">
          El experto lo sube en el chat de la reserva cuando finalice la revisión. El pago retenido se
          libera cuando apruebes el informe.
        </p>
      </div>
    </ResponsiveModal>
  ) : null;

  if (isOverlay) {
    const isOnImage = className.includes('sd-deliverable-guide-on-image');
    return (
      <>
        <div
          className={`sd-deliverable-guide ${className}`.trim()}
          role="region"
          aria-labelledby="sd-deliverables-guide-label"
        >
          {isOnImage ? (
            <div className="sd-deliverable-guide-strip">
              <p
                id="sd-deliverables-guide-label"
                className="sd-deliverable-guide-label"
                style={{ animationDelay: '0ms' }}
              >
                Incluye
              </p>
              {overlayChipList}
            </div>
          ) : (
            <div className="sd-deliverable-guide-row">
              <p
                id="sd-deliverables-guide-label"
                className="sd-deliverable-guide-label"
                style={{ animationDelay: '0ms' }}
              >
                <span>Incluye</span>
                <ChevronRight className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
              </p>
              {overlayChipList}
            </div>
          )}
        </div>
        {detailModal}
      </>
    );
  }

  return (
    <>
      <section
        className={className}
        aria-labelledby={showHeading ? 'sd-deliverables-heading' : undefined}
        aria-label={showHeading ? undefined : 'Qué incluye este servicio'}
      >
        {showHeading ? (
          <p id="sd-deliverables-heading" className="sd-section-label">
            Qué incluye
          </p>
        ) : null}
        {surfaceChipList}
      </section>
      {detailModal}
    </>
  );
};

export { mapSelectedDeliverableType, mapSelectedDeliverableTypes };
