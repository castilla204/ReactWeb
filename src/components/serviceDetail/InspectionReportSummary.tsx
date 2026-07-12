import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { type Catalog } from '../../lib/inspectionCatalog';
import { resolveTemplate, countActivePoints, type InspectionConfig } from '../../lib/inspectionTemplateConfig';
import { buildTemplatePdf } from '../../lib/inspectionPdf';

const short = (label: string) => label.split(':')[0].trim();

/**
 * Vista SOLO LECTURA de la inspección que recibirá el cliente: los apartados
 * (secciones) y puntos elegidos por el experto, con el mismo lenguaje de chips
 * del panel, pero sin controles para modificar. El botón genera el PDF al vuelo
 * a partir del catálogo + config (siempre el de la categoría correcta).
 */
export default function InspectionReportSummary({
    catalog,
    config,
}: {
    catalog: Catalog;
    config: InspectionConfig | null;
}) {
    const [generating, setGenerating] = useState(false);
    const t = resolveTemplate(catalog, config);
    const total = catalog.sections.reduce((a, s) => a + s.points.length, 0);
    const chip = 'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-caption font-medium leading-none';

    const openPdf = async () => {
        if (generating) return;
        setGenerating(true);
        try {
            const blob = await buildTemplatePdf(resolveTemplate(catalog, config));
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            setTimeout(() => URL.revokeObjectURL(url), 8000);
        } catch (err) {
            console.error('No se pudo generar el informe PDF', err);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="px-4 py-3 sm:px-5 sm:py-4">
            {/* El PDF es el entregable real: la acción va ARRIBA, no enterrada tras el scroll de secciones */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                <p className="text-caption leading-snug text-[hsl(var(--ep-muted))]">
                    Puntos que revisará el experto · {countActivePoints(t)} de {total} · {t.sections.length} secciones.
                </p>
                <button
                    type="button"
                    onClick={openPdf}
                    disabled={generating}
                    className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--ep-border))] bg-white px-4 py-2 text-meta font-semibold text-[hsl(var(--ep-ink))] transition-colors hover:border-[hsl(var(--ep-border-strong))] hover:bg-[hsl(var(--ep-canvas))] disabled:opacity-60"
                >
                    {generating
                        ? <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--brand))]" aria-hidden />
                        : <FileText className="h-4 w-4 text-[hsl(var(--brand))]" aria-hidden />}
                    {generating ? 'Generando informe…' : 'Ver el informe en PDF'}
                </button>
            </div>

            <div className="divide-y divide-[hsl(var(--ep-border))]">
                {t.sections.map((sec) => (
                    <section key={sec.id} className="py-3.5 first:pt-0">
                        <h4 className="mb-2.5 text-meta font-semibold text-[hsl(var(--ep-ink))]">
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
        </div>
    );
}
