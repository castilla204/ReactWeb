import { useState } from 'react';
import { ResponsiveModal } from '../ui/responsive-modal';
import { type Catalog } from '../../lib/inspectionCatalog';
import { resolveTemplate, countActivePoints, type InspectionConfig } from '../../lib/inspectionTemplateConfig';
import InspectionReportSummary from './InspectionReportSummary';
import { ServiceDetailDeliverableCover } from './ServiceDetailDeliverableCover';

/**
 * Portada del entregable principal en servicios de coche: el Informe PDF como
 * "documento" (boceto D) — franja de portada con miniatura de papel + tipo, y
 * pie con el nº de puntos y el enlace. Al pulsar abre el detalle por secciones
 * (solo lectura) con el botón para generar el PDF real.
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
    const sections = t.sections.length;
    const hasCustom = t.sections.some((s) => s.points.some((p) => p.custom));

    return (
        <div className={className}>
            <ServiceDetailDeliverableCover
                kind="pdf"
                coverTitle="Informe de inspección"
                coverMeta={`Formato PDF · ${sections} ${sections === 1 ? 'sección' : 'secciones'}`}
                footerText={`${points} puntos comprobados`}
                linkText="Ver informe"
                custom={hasCustom}
                onClick={() => setOpen(true)}
                ariaLabel={`Ver los ${points} puntos que incluye el informe`}
                expanded={open}
            />

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
