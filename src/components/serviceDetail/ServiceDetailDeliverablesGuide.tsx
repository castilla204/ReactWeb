import React, { useState } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { DeliverableTypeIcon } from './DeliverableTypeIcon';
import { ServiceDetailDeliverableCover } from './ServiceDetailDeliverableCover';
import { ResponsiveModal } from '../ui/responsive-modal';
import { getDeliverableDetail, type DeliverableDetail } from '../../utils/deliverableDetailContent';
import { getDeliverableKind } from '../../utils/deliverableIcons';
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

function getOverlayDeliverableLabel(dt: ServiceDeliverableType): string {
  const key = getDeliverableKey(dt);
  if (key.includes('pdf') || key.includes('informe')) return 'Informe';
  if (key.includes('video') || key.includes('vídeo')) return 'Vídeo';
  const full = getDeliverableLabel(dt);
  return full.length > 14 ? `${full.slice(0, 12)}…` : full;
}

const DELIVERABLE_DESC_FALLBACK: Record<string, string> = {
  pdf: 'Informe detallado en PDF con hallazgos y fotos.',
  video: 'Vídeo grabado durante la revisión presencial.',
  photo: 'Fotos de los puntos revisados.',
  call: 'Llamada para explicarte el informe y resolver tus dudas.',
  default: 'Entregable incluido en este servicio.',
};

/** Copy de la portada (presentation="cover") por tipo de entregable. */
const COVER_COPY: Record<string, { title: string; meta: string; footer: string }> = {
  pdf: { title: 'Informe de inspección', meta: 'Formato PDF', footer: 'Documento con hallazgos y fotos' },
  video: { title: 'Vídeo de la revisión', meta: 'Grabación presencial', footer: 'Recorrido en vídeo de las zonas revisadas' },
  photo: { title: 'Fotografías', meta: 'Alta resolución', footer: 'Fotos nítidas de cada punto revisado' },
  call: { title: 'Llamada explicativa', meta: 'Con el experto', footer: 'Te explica el informe y resuelve dudas' },
  default: { title: 'Entregable', meta: 'Incluido en el servicio', footer: '' },
};

export function normalizeDeliverableTypes(
  items: ServiceDeliverableType[] | unknown[] | undefined | null
): ServiceDeliverableType[] {
  if (!items?.length) return [];
  return mapSelectedDeliverableTypes(items);
}

interface ServiceDetailDeliverablesGuideProps {
  items: ServiceDeliverableType[] | unknown[];
  variant?: 'overlay' | 'inline';
  /** chips = pills (móvil/checkout); list = filas editoriales; card = tarjeta con descripción; cover = portada tipo documento (boceto D) */
  presentation?: 'chips' | 'list' | 'card' | 'cover';
  showHeading?: boolean;
  /** Oculta el icono/badge de tipo en las filas (lista limpia solo con texto). */
  hideIcon?: boolean;
  /**
   * Muestra TODOS los tipos de entregable recibidos (incluidos los no
   * seleccionados, con `isSelected === false`), marcando cuáles entran en el
   * servicio. Cuando es true los items llegan ya normalizados desde el llamante
   * (no se filtran los no seleccionados).
   */
  showUnselected?: boolean;
  className?: string;
}

function DeliverableDetailContent({
  detail,
  deliverable,
}: {
  detail: DeliverableDetail;
  deliverable: ServiceDeliverableType;
}) {
  const kind = getDeliverableKind(deliverable);
  const includesHeading =
    kind === 'pdf'
      ? 'El informe incluye'
      : kind === 'video'
        ? 'El vídeo incluye'
        : kind === 'photo'
          ? 'Las fotos incluyen'
          : kind === 'call'
            ? 'La llamada incluye'
            : 'Este entregable incluye';

  return (
    <div className="px-4 py-3 sm:px-5 sm:py-4">
      <p className="text-[13px] leading-relaxed text-[hsl(var(--ep-ink))]">{detail.description}</p>
      {detail.isRequired ? (
        <p className="mt-2 text-[12px] font-medium text-[hsl(var(--ep-muted))]">Incluido en el precio del servicio.</p>
      ) : null}

      <section className="mt-4">
        <p className="mb-2.5 text-[12px] font-semibold text-[hsl(var(--ep-ink))]">{includesHeading}</p>
        <ul className="m-0 list-none space-y-2 p-0">
          {detail.includes.map((line) => (
            <li key={line} className="flex gap-2 text-[12px] leading-relaxed text-[hsl(var(--ep-muted))]">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[hsl(var(--brand))]" aria-hidden />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-4 border-t border-[hsl(var(--ep-border))] pt-3 text-[12px] leading-relaxed text-[hsl(var(--ep-muted))]">
        El experto lo sube en el chat de la reserva cuando finalice la revisión. El pago retenido se
        libera cuando apruebes el informe.
      </p>
    </div>
  );
}

/** Entregables del servicio; al pulsar un chip se muestra qué incluye. */
export const ServiceDetailDeliverablesGuide: React.FC<ServiceDetailDeliverablesGuideProps> = ({
  items,
  variant = 'overlay',
  presentation = 'chips',
  showHeading = true,
  hideIcon = false,
  showUnselected = false,
  className = '',
}) => {
  const visible = showUnselected
    ? (items as ServiceDeliverableType[]).filter(Boolean)
    : normalizeDeliverableTypes(items);
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
              <DeliverableTypeIcon deliverable={dt} variant="chip" />
              <span>{label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  const surfaceList = (
    <ul className="sd-deliverable-list">
      {visible.map((dt, index) => {
        const label = getDeliverableLabel(dt);
        const selected = dt.isSelected !== false;
        if (!selected) {
          return (
            <li key={dt.id ?? `${label}-${index}`}>
              <div className="sd-deliverable-list-item-btn cursor-default opacity-70" aria-disabled="true">
                {!hideIcon ? <DeliverableTypeIcon deliverable={dt} variant="list" /> : null}
                <span className="sd-deliverable-list-label text-[hsl(var(--ep-muted))]">{label}</span>
                <span className="ml-auto shrink-0 text-[11px] font-semibold text-[hsl(var(--ep-muted))]">
                  No incluido
                </span>
              </div>
            </li>
          );
        }
        return (
          <li key={dt.id ?? `${label}-${index}`}>
            <button
              type="button"
              className="sd-deliverable-list-item-btn"
              onClick={(e) => openDetail(dt, e)}
              aria-haspopup="dialog"
              aria-expanded={open && active?.id === dt.id}
              aria-label={`Ver qué incluye: ${label}`}
            >
              {!hideIcon ? <DeliverableTypeIcon deliverable={dt} variant="list" /> : null}
              <span className="sd-deliverable-list-label">{label}</span>
              <ChevronRight className="sd-deliverable-list-chevron" aria-hidden />
            </button>
          </li>
        );
      })}
    </ul>
  );

  const surfaceCards = (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {visible.map((dt, index) => {
        const label = getDeliverableLabel(dt);
        const kind = getDeliverableKind(dt);
        const desc = (dt.description && dt.description.trim()) || DELIVERABLE_DESC_FALLBACK[kind] || '';
        const selected = dt.isSelected !== false;
        if (!selected) {
          return (
            <li key={dt.id ?? `${label}-${index}`}>
              <div className="block w-full rounded-2xl border border-dashed border-[#e4e4e4] bg-[hsl(var(--ep-canvas))] p-3.5 opacity-80">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13px] font-semibold text-[hsl(var(--ep-muted))]">{label}</span>
                  <span className="inline-flex shrink-0 items-center rounded-full border border-[hsl(var(--ep-border))] bg-white px-2 py-0.5 text-[11px] font-semibold text-[hsl(var(--ep-muted))]">
                    No incluido
                  </span>
                </div>
                {desc ? <p className="mt-1 text-[12px] leading-snug text-[hsl(var(--ep-muted))]">{desc}</p> : null}
              </div>
            </li>
          );
        }
        return (
          <li key={dt.id ?? `${label}-${index}`}>
            <button
              type="button"
              className="group block w-full rounded-2xl border border-[#ececec] bg-white p-3.5 text-left transition-colors hover:border-[hsl(var(--ep-border-strong))]"
              onClick={(e) => openDetail(dt, e)}
              aria-haspopup="dialog"
              aria-expanded={open && active?.id === dt.id}
              aria-label={`Ver qué incluye: ${label}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[hsl(var(--ep-ink))]">
                  <Check className="h-3.5 w-3.5 shrink-0 text-[#1c1c1c]" aria-hidden />
                  {label}
                </span>
                <span className="inline-flex shrink-0 items-center gap-0.5 text-[12px] font-semibold text-[hsl(var(--brand))]">
                  Ver qué incluye
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </div>
              {desc ? <p className="mt-1 text-[12px] leading-snug text-[hsl(var(--ep-muted))]">{desc}</p> : null}
            </button>
          </li>
        );
      })}
    </ul>
  );

  const surfaceCovers = (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {visible.map((dt, index) => {
        const label = getDeliverableLabel(dt);
        const kind = getDeliverableKind(dt);
        const copy = COVER_COPY[kind] ?? COVER_COPY.default;
        const desc =
          (dt.description && dt.description.trim()) || copy.footer || DELIVERABLE_DESC_FALLBACK[kind] || '';
        const selected = dt.isSelected !== false;
        return (
          <li key={dt.id ?? `${label}-${index}`}>
            <ServiceDetailDeliverableCover
              kind={kind}
              coverTitle={copy.title}
              coverMeta={copy.meta}
              footerText={desc}
              linkText="Ver qué incluye"
              selected={selected}
              onClick={(e) => openDetail(dt, e)}
              ariaLabel={`Ver qué incluye: ${label}`}
              expanded={open && active?.id === dt.id}
            />
          </li>
        );
      })}
    </ul>
  );

  const detailModal = detail && active ? (
    <ResponsiveModal
      open={open}
      onOpenChange={setOpen}
      title={detail.title}
      desktopSidePanel
    >
      <DeliverableDetailContent detail={detail} deliverable={active} />
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
          <p id="sd-deliverables-heading" className="sd-section-label mb-3">
            Qué incluye
          </p>
        ) : null}
        {presentation === 'cover'
          ? surfaceCovers
          : presentation === 'card'
            ? surfaceCards
            : presentation === 'list'
              ? surfaceList
              : surfaceChipList}
      </section>
      {detailModal}
    </>
  );
};

export { mapSelectedDeliverableType, mapSelectedDeliverableTypes };
