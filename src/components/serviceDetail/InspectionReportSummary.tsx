import { FileText } from 'lucide-react';
import { INSPECTION_CATALOG } from '../../lib/inspectionCatalog';
import { resolveTemplate, countActivePoints, type InspectionConfig } from '../../lib/inspectionTemplateConfig';

const short = (label: string) => label.split(':')[0].trim();

/**
 * Vista SOLO LECTURA de la inspección que recibirá el cliente: los apartados
 * (secciones) y puntos elegidos por el experto, con el mismo lenguaje de chips
 * del panel, pero sin controles para modificar. Incluye enlace al PDF.
 */
export default function InspectionReportSummary({
    config,
    pdfUrl,
}: {
    config: InspectionConfig | null;
    pdfUrl?: string;
}) {
    const t = resolveTemplate(INSPECTION_CATALOG, config);
    const total = INSPECTION_CATALOG.sections.reduce((a, s) => a + s.points.length, 0);
    const chip = 'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium leading-none';

    return (
        <div className="px-4 py-3 sm:px-5 sm:py-4">
            <p className="mb-4 text-[12px] leading-snug text-[hsl(var(--ep-muted))]">
                Puntos que el experto revisará en tu vehículo · {countActivePoints(t)} de {total} · {t.sections.length} secciones.
            </p>

            <div className="divide-y divide-[hsl(var(--ep-border))]">
                {t.sections.map((sec) => (
                    <section key={sec.id} className="py-3.5 first:pt-0">
                        <h4 className="mb-2.5 text-[13px] font-semibold text-[hsl(var(--ep-ink))]">
                            {sec.id} · {sec.title}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {sec.points.map((p) => (
                                <span
                                    key={p.fieldName}
                                    className={`${chip} ${p.custom
                                        ? 'border-[hsl(var(--brand)/0.25)] bg-[hsl(var(--brand)/0.06)] text-[hsl(var(--ep-ink))]'
                                        : 'border-[hsl(var(--ep-border))] bg-white text-[hsl(var(--ep-ink))]'}`}
                                >
                                    <span className="tabular-nums text-[hsl(var(--ep-muted))]">{p.displayNum}</span>
                                    {short(p.label)}
                                </span>
                            ))}
                        </div>
                    </section>
                ))}
            </div>

            {pdfUrl && (
                <div className="mt-4 border-t border-[hsl(var(--ep-border))] pt-3">
                    <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[hsl(var(--brand))] hover:underline"
                    >
                        <FileText className="h-4 w-4" aria-hidden /> Ver el informe en PDF
                    </a>
                </div>
            )}
        </div>
    );
}
