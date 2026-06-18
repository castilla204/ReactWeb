import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { ResponsiveModal } from '../ui/responsive-modal';
import { INSPECTION_CATALOG } from '../../lib/inspectionCatalog';
import { resolveTemplate, countActivePoints, type InspectionConfig } from '../../lib/inspectionTemplateConfig';
import InspectionReportSummary from './InspectionReportSummary';
import '../../styles/inspection-marquee.css';

const short = (label: string) => label.split(':')[0].trim();

/**
 * Tarjeta del detalle del servicio (va dentro de "Qué incluye"). El propio
 * botón muestra los puntos de la inspección "pasando" en una cinta animada;
 * al pulsar abre un modal (escritorio) / drawer (móvil) con el detalle por
 * secciones, en SOLO LECTURA.
 */
export default function InspectionReportPreview({
    config,
    pdfUrl,
    className,
}: {
    config: InspectionConfig | null;
    pdfUrl?: string;
    className?: string;
}) {
    const [open, setOpen] = useState(false);
    const t = resolveTemplate(INSPECTION_CATALOG, config);
    const points = countActivePoints(t);
    const allPoints = t.sections.flatMap((s) => s.points);
    // Duración proporcional al nº de puntos (más puntos = cinta más larga).
    const durationS = Math.max(24, Math.round(allPoints.length * 0.9));

    return (
        <div className={className}>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Ver los puntos de la inspección"
                className="group block w-full rounded-2xl border border-[hsl(var(--ep-border))] bg-white p-3.5 text-left transition-colors hover:border-[hsl(var(--ep-border-strong))]"
            >
                <div className="mb-3 flex items-end justify-between gap-2">
                    <span className="min-w-0">
                        <span className="block text-[13px] font-semibold text-[hsl(var(--ep-ink))]">Puntos de la inspección</span>
                        <span className="block text-[11px] text-[hsl(var(--ep-muted))]">
                            {points} puntos · {t.sections.length} secciones
                        </span>
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-0.5 text-[12px] font-semibold text-[hsl(var(--brand))]">
                        Ver todos
                        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
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
                description="Lo que revisará el experto, elegido por él."
                dialogClassName="md:max-w-[640px]"
            >
                <InspectionReportSummary config={config} pdfUrl={pdfUrl} />
            </ResponsiveModal>
        </div>
    );
}
