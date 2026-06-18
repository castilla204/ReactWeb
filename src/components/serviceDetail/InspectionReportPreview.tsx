import { useState } from 'react';
import { ClipboardList, ChevronRight } from 'lucide-react';
import { ResponsiveModal } from '../ui/responsive-modal';
import { INSPECTION_CATALOG } from '../../lib/inspectionCatalog';
import { resolveTemplate, countActivePoints, type InspectionConfig } from '../../lib/inspectionTemplateConfig';
import InspectionReportSummary from './InspectionReportSummary';

/**
 * Tarjeta del detalle del servicio. El propio botón muestra TODOS los puntos
 * elegidos por el experto como círculos numerados (preview compacto); al pulsar
 * abre un modal (escritorio) / drawer (móvil) con el detalle por secciones y
 * etiquetas, en SOLO LECTURA.
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

    return (
        <div className={className}>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Ver los puntos de la inspección"
                className="group block w-full rounded-2xl border border-[hsl(var(--ep-border))] bg-white p-3.5 text-left transition-colors hover:border-[hsl(var(--ep-border-strong))]"
            >
                <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--brand)/0.08)] text-[hsl(var(--brand))]">
                            <ClipboardList className="h-[18px] w-[18px]" aria-hidden />
                        </span>
                        <span className="min-w-0">
                            <span className="block text-[13px] font-semibold text-[hsl(var(--ep-ink))]">Puntos de la inspección</span>
                            <span className="block text-[11px] text-[hsl(var(--ep-muted))]">
                                {points} puntos · {t.sections.length} secciones
                            </span>
                        </span>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-0.5 text-[12px] font-semibold text-[hsl(var(--brand))]">
                        Ver
                        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                    {allPoints.map((p) => (
                        <span
                            key={p.fieldName}
                            className={`inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full border px-1 text-[11px] font-semibold tabular-nums ${p.custom
                                ? 'border-[hsl(var(--brand)/0.3)] bg-[hsl(var(--brand)/0.08)] text-[hsl(var(--brand))]'
                                : 'border-[hsl(var(--ep-border))] bg-[hsl(var(--ep-canvas))] text-[hsl(var(--ep-muted))]'}`}
                        >
                            {p.displayNum}
                        </span>
                    ))}
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
