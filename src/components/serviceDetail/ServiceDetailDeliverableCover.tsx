import React from 'react';
import { Camera, ChevronRight, FileText, Phone, Play, Star } from 'lucide-react';
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
      <div className="relative flex h-[56px] w-[44px] shrink-0 flex-col gap-1 rounded-md border border-line bg-white p-2">
        <span className="h-[4px] w-[55%] rounded-sm bg-[hsl(var(--brand))]" />
        <span className="h-[3px] w-full rounded-sm bg-line-soft" />
        <span className="h-[3px] w-full rounded-sm bg-line-soft" />
        <span className="h-[3px] w-[70%] rounded-sm bg-line-soft" />
        {custom ? (
          <span
            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[hsl(var(--brand))] text-white"
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
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--brand))] text-white">
        <Play className="ml-0.5 h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
      </span>
    ) : kind === 'photo' ? (
      <Camera className="h-6 w-6 text-[hsl(var(--brand))]" strokeWidth={1.75} />
    ) : kind === 'call' ? (
      <Phone className="h-6 w-6 text-[hsl(var(--brand))]" strokeWidth={1.75} />
    ) : (
      <FileText className="h-6 w-6 text-[hsl(var(--brand))]" strokeWidth={1.75} />
    );

  return (
    <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[10px] bg-surface-tinted">
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
      <div className="sd-deliverable-cover-placeholder overflow-hidden rounded-2xl border border-dashed border-line bg-[hsl(var(--ep-canvas))] opacity-80">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[10px] bg-white">
            <CoverThumb kind={kind} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-meta font-semibold text-[hsl(var(--ep-muted))]">{coverTitle}</p>
            <p className="text-caption text-[hsl(var(--ep-muted))]">{coverMeta}</p>
          </div>
          <span className="inline-flex shrink-0 items-center rounded-full border border-[hsl(var(--ep-border))] bg-white px-2 py-0.5 text-kicker font-semibold text-[hsl(var(--ep-muted))]">
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
      className="sd-deliverable-cover group block w-full overflow-hidden rounded-2xl border border-ink-strong bg-white text-left transition-colors"
    >
      <div className="flex items-center gap-3 border-b border-line-soft bg-surface-tinted px-4 py-3.5">
        <CoverThumb kind={kind} custom={custom} />
        <div className="min-w-0 flex-1">
          <p className="mb-0.5 text-kicker font-semibold uppercase tracking-[0.04em] text-[hsl(var(--brand))]">
            {coverTitle}
          </p>
          <p className="text-caption text-ink-muted">{coverMeta}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="min-w-0 truncate text-meta text-ink-strong">{footerText}</span>
        <span className="inline-flex shrink-0 items-center gap-0.5 text-meta font-semibold text-[hsl(var(--brand))]">
          {linkText}
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </button>
  );
};
