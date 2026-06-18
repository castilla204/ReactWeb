import { useState } from 'react';
import { ClipboardList, ChevronRight } from 'lucide-react';
import { ResponsiveModal } from '../ui/responsive-modal';
import { INSPECTION_CATALOG } from '../../lib/inspectionCatalog';
import { resolveTemplate, countActivePoints, type InspectionConfig } from '../../lib/inspectionTemplateConfig';
import InspectionReportSummary from './InspectionReportSummary';

/**
 * Tarjeta compacta en el detalle del servicio. Abre un modal (escritorio) /
 * drawer (móvil) con los apartados y puntos elegidos por el experto en SOLO
 * LECTURA (no el PDF embebido, que muchos navegadores no renderizan inline).
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

    return (
        <div className={className}>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="group flex w-full items-center gap-3 rounded-xl border border-[hsl(var(--ep-border))] bg-white p-3 text-left transition-colors hover:border-[hsl(var(--ep-border-strong))] hover:bg-[hsl(var(--ep-canvas))]"
            >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--brand)/0.08)] text-[hsl(var(--brand))]">
                    <ClipboardList className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold text-[hsl(var(--ep-ink))]">Puntos de la inspección</span>
                    <span className="block text-[12px] text-[hsl(var(--ep-muted))]">
                        {points} puntos · {t.sections.length} secciones
                    </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-[hsl(var(--ep-muted))] transition-transform group-hover:translate-x-0.5" aria-hidden />
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
