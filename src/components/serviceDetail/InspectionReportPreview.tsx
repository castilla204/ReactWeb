import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { ResponsiveModal } from '../ui/responsive-modal';
import { type Catalog } from '../../lib/inspectionCatalog';
import { resolveTemplate, countActivePoints, type InspectionConfig } from '../../lib/inspectionTemplateConfig';
import InspectionReportSummary from './InspectionReportSummary';
import '../../styles/inspection-marquee.css';

const short = (label: string) => label.split(':')[0].trim();

/**
 * Bloque único de "Qué incluye" para servicios de coche: a la izquierda el
 * entregable (Informe PDF), a la derecha el acceso a los puntos de la
 * inspección. Debajo, una cinta donde van pasando los puntos. Al pulsar abre
 * un modal (escritorio) / drawer (móvil) con el detalle por secciones (solo
 * lectura). Sustituye a la lista de entregables genérica (no se duplica).
 */
export default function InspectionReportPreview({
    catalog,
    config,
    className,
}: {
    catalog: Catalog;
    config: InspectionConfig | null;
    className?: string;
}) {
    const [open, setOpen] = useState(false);
    const t = resolveTemplate(catalog, config);
    const points = countActivePoints(t);
    const allPoints = t.sections.flatMap((s) => s.points);
    // Cinta lenta y tranquila: ~2.6 s por punto.
    const durationS = Math.max(60, Math.round(allPoints.length * 2.6));

    return (
        <div className={className}>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Ver los puntos de la inspección"
                className="group block w-full rounded-2xl border border-[hsl(var(--ep-border))] bg-white p-3.5 text-left transition-colors hover:border-[hsl(var(--ep-border-strong))]"
            >
                <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center">
                        <span className="truncate text-[13px] font-semibold text-[hsl(var(--ep-ink))]">Informe PDF</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end text-right">
                        <span className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-[hsl(var(--brand))]">
                            Puntos de la inspección
                            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                        </span>
                        <span className="text-[11px] text-[hsl(var(--ep-muted))]">{points} puntos · {t.sections.length} secciones</span>
                    </span>
                </div>

                <div className="insp-marquee">
                    <div className="insp-marquee__track" style={{ '--insp-dur': `${durationS}s` } as React.CSSProperties}>
                        {[...allPoints, ...allPoints].map((p, i) => (
                            <span
                                key={i}
                                className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[12px] font-medium leading-none ${p.custom
                                    ? 'border-[hsl(var(--brand)/0.3)] bg-[hsl(var(--brand)/0.08)] text-[hsl(var(--brand))]'
                                    : 'border-[hsl(var(--ep-border))] bg-[hsl(var(--ep-canvas))] text-[hsl(var(--ep-ink))]'}`}
                            >
                                <span className="tabular-nums text-[hsl(var(--ep-muted))]">{p.displayNum}</span>
                                {short(p.label)}
                            </span>
                        ))}
                    </div>
                </div>
            </button>

            <ResponsiveModal
                open={open}
                onOpenChange={setOpen}
                title="Puntos de la inspección"
                desktopSidePanel
            >
                <InspectionReportSummary catalog={catalog} config={config} />
            </ResponsiveModal>
        </div>
    );
}
