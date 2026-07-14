import React, { useId, useState } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { DeliverableTypeIcon } from './DeliverableTypeIcon';
import { ServiceDetailDeliverableCover } from './ServiceDetailDeliverableCover';
import { ResponsiveModal } from '../ui/responsive-modal';
import { getDeliverableDetail, type DeliverableDetail } from '../../utils/deliverableDetailContent';
import { getDeliverableKind, getDeliverableLinkText } from '../../utils/deliverableIcons';import {
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
  photo: { title: 'Fotografías', meta: 'Incluidas en el servicio', footer: 'Fotos de cada punto revisado' },
  call: { title: 'Llamada explicativa', meta: 'Con el experto', footer: 'Explicación del informe y resolución de dudas' },
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
  /** chips = pills (móvil/checkout); list = filas editoriales; card = tarjeta con descripción; cover = portada tipo documento (boceto D); checkout = filas compactas paso pago móvil */
  presentation?: 'chips' | 'list' | 'card' | 'cover' | 'checkout';
  showHeading?: boolean;
  /** Título de sección cuando showHeading=true (por defecto "Qué incluye"). */
  sectionTitle?: string;  /** Oculta el icono/badge de tipo en las filas (lista limpia solo con texto). */
  hideIcon?: boolean;
  /**
   * Muestra TODOS los tipos de entregable recibidos (incluidos los no
   * seleccionados, con `isSelected === false`), marcando cuáles entran en el
   * servicio. Cuando es true los items llegan ya normalizados desde el llamante
   * (no se filtran los no seleccionados).
   */
  showUnselected?: boolean;
  className?: string;
  /** presentation="cover": nº de columnas en pantallas anchas (checkout desktop apila solo 1 por defecto). */
  coverColumns?: 1 | 2;
  /** presentation="checkout": lista plana sin caja tinted (dentro de tarjeta de pago). */
  embedded?: boolean;
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
      <p className="text-meta leading-relaxed text-ink-strong">{detail.description}</p>
      {detail.isRequired ? (
        <p className="mt-2 text-caption font-medium text-ink-muted">Incluido en el precio del servicio.</p>
      ) : null}

      <section className="mt-4" aria-labelledby="sd-deliverable-detail-includes">
        <h3 id="sd-deliverable-detail-includes" className="mb-2.5 text-caption font-semibold text-ink-strong">
          {includesHeading}
        </h3>
        <ul className="m-0 list-none space-y-2 p-0">
          {detail.includes.map((line) => (
            <li key={line} className="flex gap-2.5 text-caption leading-relaxed text-ink-muted">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" strokeWidth={2.5} aria-hidden />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-4 border-t border-line-soft pt-3 text-caption leading-relaxed text-ink-muted">
        El experto lo sube en el chat de la reserva cuando finalice la revisión. El pago retenido se
        libera cuando apruebes el informe.
      </p>
    </div>
  );}

/** Entregables del servicio; al pulsar un chip se muestra qué incluye. */
export const ServiceDetailDeliverablesGuide: React.FC<ServiceDetailDeliverablesGuideProps> = ({
  items,
  variant = 'overlay',
  presentation = 'chips',
  showHeading = true,
  sectionTitle = 'Qué incluye',
  hideIcon = false,  showUnselected = false,
  className = '',
  coverColumns = 1,
  embedded = false,
}) => {
  const headingId = useId();
  const guideLabelId = useId();
  const visible = showUnselected    ? (items as ServiceDeliverableType[]).filter(Boolean)
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
              aria-expanded={open && active === dt}
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
              aria-expanded={open && active === dt}
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

  const surfaceCheckoutList = (
    <ul
      className={cn(
        'm-0 flex list-none flex-col p-0',
        embedded
          ? 'divide-y divide-line-soft'
          : 'overflow-hidden rounded-xl border border-line-soft bg-surface-tinted',
      )}
    >
      {visible.map((dt, index) => {
        const label = getDeliverableLabel(dt);
        const selected = dt.isSelected !== false;
        const rowPad = embedded ? 'px-0 py-4 min-h-11' : 'px-4 py-3.5';
        if (!selected) {
          return (
            <li
              key={dt.id ?? `${label}-${index}`}
              className={embedded ? undefined : index > 0 ? 'border-t border-line-soft' : undefined}
            >
              <div
                className={cn('flex w-full items-center gap-3', rowPad)}
                aria-disabled="true"
              >                <DeliverableTypeIcon deliverable={dt} variant="chip" />
                <span className="min-w-0 flex-1 text-body font-medium leading-snug text-ink-muted">
                  {label}
                </span>
                <span className="shrink-0 text-caption font-medium text-ink-muted">No incluido</span>
              </div>
            </li>
          );
        }
        return (
          <li
            key={dt.id ?? `${label}-${index}`}
            className={cn(
              embedded ? 'checkout-payment-deliverable-enter' : index > 0 ? 'border-t border-line-soft' : undefined,
            )}
            style={embedded ? ({ ['--di' as string]: Math.min(index, 4) } as React.CSSProperties) : undefined}
          >
            <button
              type="button"
              className={cn(
                'flex w-full items-center gap-3 text-left transition-[background-color,color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-inset',
                rowPad,
                embedded
                  ? 'hover:bg-surface-tinted/80 active:bg-surface-tinted motion-safe:active:scale-[0.995]'
                  : 'hover:bg-white/70 active:bg-white/80',
              )}
              onClick={(e) => openDetail(dt, e)}
              aria-haspopup="dialog"
              aria-expanded={open && active === dt}
              aria-label={`Ver qué incluye: ${label}`}
            >
              <DeliverableTypeIcon deliverable={dt} variant="chip" />
              <span className="min-w-0 flex-1 text-body font-medium leading-snug text-ink-strong">
                {label}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-soft" aria-hidden />
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
              <div className="sd-deliverable-list-item-btn cursor-default" aria-disabled="true">
                {!hideIcon ? <DeliverableTypeIcon deliverable={dt} variant="list" /> : null}
                <span className="sd-deliverable-list-label text-ink-muted">{label}</span>
                <span className="ml-auto shrink-0 text-kicker font-semibold text-ink-soft">                  No incluido
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
              aria-expanded={open && active === dt}
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
              <div className="block w-full rounded-xl border border-dashed border-line bg-surface-tinted p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-meta font-semibold text-ink-muted">{label}</span>
                  <span className="inline-flex shrink-0 items-center rounded-full border border-line bg-white px-2.5 py-1 text-kicker font-semibold text-ink-muted">                    No incluido
                  </span>
                </div>
                {desc ? <p className="mt-1 text-caption leading-snug text-ink-soft">{desc}</p> : null}              </div>
            </li>
          );
        }
        return (
          <li key={dt.id ?? `${label}-${index}`}>
            <button
              type="button"
              className={cn(
                'group block w-full rounded-xl border border-line bg-white p-3.5 text-left transition-colors',
                'hover:border-line hover:bg-surface-tinted/40 active:bg-surface-tinted/60',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
              )}              onClick={(e) => openDetail(dt, e)}
              aria-haspopup="dialog"
              aria-expanded={open && active === dt}
              aria-label={`Ver qué incluye: ${label}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-meta font-semibold text-ink-strong">
                  <Check className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
                  {label}
                </span>
                <span className="inline-flex shrink-0 items-center gap-0.5 text-caption font-semibold text-brand">
                  {getDeliverableLinkText(kind)}
                  <ChevronRight className="h-3.5 w-3.5 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5" aria-hidden />                </span>
              </div>
              {desc ? <p className="mt-1 text-caption leading-snug text-[hsl(var(--ep-muted))]">{desc}</p> : null}
            </button>
          </li>
        );
      })}
    </ul>
  );

  const surfaceCovers = (
    <ul className={cn(
      coverColumns === 2
        ? 'm-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 sm:gap-4'
        : 'sd-deliverable-cover-list',
    )}>
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
              linkText={getDeliverableLinkText(kind)}
              selected={selected}
              onClick={(e) => openDetail(dt, e)}
              ariaLabel={`Ver qué incluye: ${label}`}
              expanded={open && active === dt}
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
          aria-labelledby={guideLabelId}
        >
          {isOnImage ? (
            <div className="sd-deliverable-guide-strip">
              <p
                id={guideLabelId}
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
                id={guideLabelId}
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
        aria-labelledby={showHeading ? headingId : undefined}
        aria-label={showHeading ? undefined : 'Qué incluye este servicio'}
      >
        {showHeading ? (
          <p id={headingId} className="sd-section-label mb-3">
            {sectionTitle}
          </p>
        ) : null}        {presentation === 'cover'
          ? surfaceCovers
          : presentation === 'card'
            ? surfaceCards
            : presentation === 'checkout'
              ? surfaceCheckoutList
              : presentation === 'list'
                ? surfaceList
                : surfaceChipList}
      </section>
      {detailModal}
    </>
  );
};

export { mapSelectedDeliverableType, mapSelectedDeliverableTypes };
