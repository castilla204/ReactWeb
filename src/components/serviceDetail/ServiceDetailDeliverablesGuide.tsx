import React, { useState } from 'react';
import { File, FileText, Image, Video } from 'lucide-react';
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

function pickIcon(label: string) {
  const n = label.toLowerCase();
  if (n.includes('video')) return Video;
  if (n.includes('imagen') || n.includes('foto') || n.includes('photo')) return Image;
  if (n.includes('archivo')) return File;
  return FileText;
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
  className?: string;
}

/** Chips de entregables sobre la galería; al pulsar se muestra qué incluye. */
export const ServiceDetailDeliverablesGuide: React.FC<ServiceDetailDeliverablesGuideProps> = ({
  items,
  variant = 'overlay',
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

  const chipList = (
    <ul className={`flex flex-wrap gap-2 ${isOverlay ? '' : ''}`}>
      {visible.map((dt, idx) => {
        const label = getDeliverableLabel(dt);
        const Icon = pickIcon(label);
        const chipClass = isOverlay ? 'sd-deliverable-chip' : 'sd-deliverable-chip-inline';
        return (
          <li key={dt.id ?? `${label}-${idx}`}>
            <button
              type="button"
              className={`${chipClass} cursor-pointer transition-transform hover:brightness-[0.98] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066CC]`}
              style={isOverlay ? { animationDelay: `${60 + idx * 70}ms` } : undefined}
              onClick={(e) => openDetail(dt, e)}
              aria-haspopup="dialog"
              aria-expanded={open && active?.id === dt.id}
              aria-label={`Ver qué incluye: ${label}`}
            >
              <Icon className="sd-deliverable-chip-icon" aria-hidden />
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
          <p className="text-xs font-medium text-[#0066CC]">Incluido en el precio del servicio</p>
        ) : null}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#1c1c1c]">
            Este archivo incluye
          </p>
          <ul className="space-y-2">
            {detail.includes.map((line) => (
              <li key={line} className="flex gap-2 text-sm leading-snug text-[#6a6a6a]">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#0066CC]" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs leading-relaxed text-[#6a6a6a]">
          El experto lo sube en el chat de la reserva cuando finalice la revisión. El pago en custodia
          se libera cuando apruebes el trabajo.
        </p>
      </div>
    </ResponsiveModal>
  ) : null;

  if (isOverlay) {
    return (
      <>
        <div
          className={`sd-deliverable-guide ${className}`.trim()}
          role="region"
          aria-labelledby="sd-deliverables-guide-label"
        >
          <p
            id="sd-deliverables-guide-label"
            className="sd-deliverable-guide-label mb-1.5"
            style={{ animationDelay: '0ms' }}
          >
            Incluye · pulsa para ver más
          </p>
          {chipList}
        </div>
        {detailModal}
      </>
    );
  }

  return (
    <>
      <div className={className} aria-label="Entregables incluidos">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6a6a6a]">
          Incluye
        </p>
        {chipList}
      </div>
      {detailModal}
    </>
  );
};

export { mapSelectedDeliverableType, mapSelectedDeliverableTypes };
