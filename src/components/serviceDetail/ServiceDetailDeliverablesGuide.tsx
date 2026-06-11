import React, { useState } from 'react';
import { ChevronRight, FileText, Video, X, type LucideIcon } from 'lucide-react';
import { ResponsiveModal } from '../ui/responsive-modal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../ui/dialog';
import { SD_MOBILE_GUTTER_CLASS } from '../../constants/homepageTypography';
import { useWindowSize } from '../../hooks/useWindowSize';
import { getDeliverableDetail, type DeliverableDetail } from '../../utils/deliverableDetailContent';
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
  /** chips = pills (móvil/checkout); list = filas editoriales (ficha desktop) */
  presentation?: 'chips' | 'list';
  showHeading?: boolean;
  className?: string;
}

const DESKTOP_SIDE_PANEL_CLASS =
  'fixed right-0 top-0 z-50 flex h-full max-h-[100dvh] w-full max-w-[min(480px,100vw)] flex-col gap-0 overflow-hidden border-0 border-l border-[#ebebeb] bg-white p-0 shadow-[-16px_0_48px_rgba(15,23,42,0.12)] duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-[480px] !left-auto !right-0 !top-0 !h-full !max-h-[100dvh] !w-full !translate-x-0 !translate-y-0 !rounded-none';

function DeliverableDetailContent({
  detail,
  onClose,
  layout,
}: {
  detail: DeliverableDetail;
  onClose: () => void;
  layout: 'mobile' | 'desktop';
}) {
  const isDesktop = layout === 'desktop';

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white font-display text-[#1c1c1c]">
      <header
        className={`sticky top-0 z-10 flex shrink-0 justify-between border-b border-[#ebebeb] bg-white ${
          isDesktop
            ? 'items-center px-6 py-4'
            : 'items-start px-5 pb-3 pt-1'
        }`}
      >
        <div className="min-w-0 pr-3">
          <p className="text-lg font-semibold leading-tight text-[#1c1c1c]">{detail.title}</p>
          <p className="mt-0.5 text-sm text-[#6a6a6a]">Qué recibirás con este servicio</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#717171] transition-colors hover:bg-[#f5f5f5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1c1c1c]"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </header>

      <div
        className={
          isDesktop
            ? 'min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-y-contain px-6 pb-8 pt-5'
            : `space-y-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-4 ${SD_MOBILE_GUTTER_CLASS}`
        }
      >
        <p className="text-sm leading-relaxed text-[#1c1c1c]">{detail.description}</p>
        {detail.isRequired ? (
          <p className="text-xs font-medium text-brand">Incluido en el precio del servicio</p>
        ) : null}
        <section aria-labelledby="deliverable-includes-heading">
          <p id="deliverable-includes-heading" className="sd-section-label mb-3">
            Este archivo incluye
          </p>
          <ul className="m-0 list-none space-y-2.5 p-0">
            {detail.includes.map((line) => (
              <li key={line} className="flex gap-2.5 text-sm leading-snug text-[#6a6a6a]">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>
        <p className="border-t border-[#ebebeb] pt-4 text-xs leading-relaxed text-[#6a6a6a]">
          El experto lo sube en el chat de la reserva cuando finalice la revisión. El pago retenido se
          libera cuando apruebes el informe.
        </p>
      </div>
    </div>
  );
}

/** Entregables del servicio; al pulsar un chip se muestra qué incluye. */
export const ServiceDetailDeliverablesGuide: React.FC<ServiceDetailDeliverablesGuideProps> = ({
  items,
  variant = 'overlay',
  presentation = 'chips',
  showHeading = true,
  className = '',
}) => {
  const visible = normalizeDeliverableTypes(items);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<ServiceDeliverableType | null>(null);
  const { width } = useWindowSize();
  const isMobile = width > 0 ? width < 1024 : false;

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

  const surfaceList = (
    <ul className="sd-deliverable-list">
      {visible.map((dt, index) => {
        const label = getDeliverableLabel(dt);
        const Icon = getDeliverableIcon(dt);
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
              <Icon className="sd-deliverable-list-icon" aria-hidden />
              <span className="sd-deliverable-list-label">{label}</span>
              <ChevronRight className="sd-deliverable-list-chevron" aria-hidden />
            </button>
          </li>
        );
      })}
    </ul>
  );

  const closeDetail = () => setOpen(false);

  const detailModal = detail ? (
    isMobile ? (
      <ResponsiveModal
        open={open}
        onOpenChange={setOpen}
        title={detail.title}
        description="Qué recibirás con este servicio"
        hideDialogHeader
        drawerMaxHeight="min(85dvh, calc(100dvh - env(safe-area-inset-bottom, 0px)))"
        drawerClassName="rounded-t-[1.25rem] shadow-[0_-12px_40px_rgba(15,23,42,0.12)]"
      >
        <DeliverableDetailContent detail={detail} onClose={closeDetail} layout="mobile" />
      </ResponsiveModal>
    ) : (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          hideCloseButton
          overlayClassName="bg-black/40"
          className={DESKTOP_SIDE_PANEL_CLASS}
        >
          <DialogTitle className="sr-only">{detail.title}</DialogTitle>
          <DialogDescription className="sr-only">
            Qué recibirás con este servicio
          </DialogDescription>
          <DeliverableDetailContent detail={detail} onClose={closeDetail} layout="desktop" />
        </DialogContent>
      </Dialog>
    )
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
        {presentation === 'list' ? surfaceList : surfaceChipList}
      </section>
      {detailModal}
    </>
  );
};

export { mapSelectedDeliverableType, mapSelectedDeliverableTypes };
