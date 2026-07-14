import React from 'react';
import { Camera, ChevronRight, FileText, Phone, Play, Star } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { DeliverableKind } from '../../utils/deliverableIcons';

/**
 * Tarjeta "portada" de un entregable (boceto D). Franja superficie con miniatura
 * a la izquierda + micro-etiqueta de tipo, y un pie con la línea de contenido y
 * el enlace de detalle. La comparten el informe PDF (InspectionReportPreview) y
 * los entregables extra (ServiceDetailDeliverablesGuide, presentation="cover")
 * para que hablen el mismo idioma visual.
 */

/** Miniatura por tipo: papel para el PDF, marco de vídeo, foto, teléfono. */
function CoverThumb({ kind, custom }: { kind: DeliverableKind; custom?: boolean }) {
  if (kind === 'pdf') {
    return (
      <div className="relative flex h-14 w-11 shrink-0 flex-col gap-1 rounded-md border border-line bg-white p-2">
        <span className="h-1 w-[55%] rounded-sm bg-brand" />
        <span className="h-0.5 w-full rounded-sm bg-line-soft" />
        <span className="h-0.5 w-full rounded-sm bg-line-soft" />
        <span className="h-0.5 w-[70%] rounded-sm bg-line-soft" />
        {custom ? (
          <span
            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-brand text-white"
            title="Informe personalizado por el experto"
          >
            <Star className="h-2.5 w-2.5" fill="currentColor" strokeWidth={0} />
          </span>
        ) : null}
      </div>
    );
  }

  const icon =
    kind === 'video' ? (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white">
        <Play className="ml-0.5 h-4 w-4" fill="currentColor" strokeWidth={0} />
      </span>
    ) : kind === 'photo' ? (
      <Camera className="h-6 w-6 text-brand" strokeWidth={1.75} />
    ) : kind === 'call' ? (
      <Phone className="h-6 w-6 text-brand" strokeWidth={1.75} />
    ) : (
      <FileText className="h-6 w-6 text-brand" strokeWidth={1.75} />
    );

  return (
    <div className="flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-[10px] bg-surface-tinted">
      {icon}
    </div>
  );
}

export interface ServiceDetailDeliverableCoverProps {
  kind: DeliverableKind;
  /** Micro-etiqueta de tipo, en la franja de portada (p. ej. "Informe de inspección"). */
  coverTitle: string;
  /** Segunda línea de la portada (p. ej. "Formato PDF · 8 secciones"). */
  coverMeta: string;
  /** Línea de contenido en el pie (p. ej. "32 puntos comprobados"). */
  footerText: string;
  /** Texto del enlace de detalle (p. ej. "Ver informe"). */
  linkText: string;
  custom?: boolean;
  /** false → tarjeta apagada con "No incluido", sin acción. */
  selected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  ariaLabel: string;
  expanded?: boolean;
}

export const ServiceDetailDeliverableCover: React.FC<ServiceDetailDeliverableCoverProps> = ({
  kind,
  coverTitle,
  coverMeta,
  footerText,
  linkText,
  custom = false,
  selected = true,
  onClick,
  ariaLabel,
  expanded,
}) => {
  if (!selected) {
    return (
      <div className="sd-deliverable-cover-placeholder overflow-hidden rounded-xl border border-dashed border-ink/15 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <CoverThumb kind={kind} />
          <div className="min-w-0 flex-1">
            <p className="text-meta font-semibold text-ink-muted">{coverTitle}</p>
            <p className="text-caption text-ink-soft">{coverMeta}</p>
          </div>
          <span className="inline-flex shrink-0 items-center rounded-full border border-line bg-white px-2.5 py-1 text-kicker font-semibold text-ink-muted">
            No incluido
          </span>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-haspopup="dialog"
      aria-expanded={expanded}
      className={cn(
        'sd-deliverable-cover group block w-full overflow-hidden rounded-xl bg-white text-left',
        'border border-[hsl(var(--brand)/0.22)]',
        'shadow-[0_1px_3px_rgba(15,23,42,0.06)]',
        'transition-[background-color,border-color,box-shadow] duration-200 ease-out',
        'hover:border-[hsl(var(--brand)/0.34)] hover:shadow-[0_2px_8px_rgba(15,23,42,0.08)]',
        'active:bg-surface-tinted/30',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
      )}
    >
      <div className="sd-deliverable-cover__header flex items-center gap-3 border-b border-[hsl(var(--brand)/0.12)] bg-[hsl(var(--brand)/0.04)] px-4 py-3.5">
        <CoverThumb kind={kind} custom={custom} />
        <div className="min-w-0 flex-1">
          <p className="mb-0.5 text-meta font-semibold text-ink-strong">{coverTitle}</p>
          <p className="text-caption text-ink-muted">{coverMeta}</p>
        </div>
      </div>
      <div className="sd-deliverable-cover__footer flex min-h-11 items-center justify-between gap-3 bg-white px-4 py-3.5">
        <span className="min-w-0 text-meta leading-snug text-ink-strong" title={footerText}>
          {footerText}
        </span>
        <span className="inline-flex shrink-0 items-center gap-0.5 text-meta font-semibold text-brand">
          {linkText}
          <ChevronRight
            className="h-3.5 w-3.5 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </div>
    </button>
  );
};
