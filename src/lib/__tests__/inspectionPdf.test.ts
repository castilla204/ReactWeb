// ReactWeb/src/lib/__tests__/inspectionPdf.test.ts
import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { INSPECTION_CATALOG } from '../inspectionCatalog';
import { emptyConfig, resolveTemplate, type InspectionConfig } from '../inspectionTemplateConfig';
import { buildTemplatePdf } from '../inspectionPdf';

async function fieldNames(bytes: Uint8Array): Promise<string[]> {
  const doc = await PDFDocument.load(bytes);
  return doc.getForm().getFields().map((f) => f.getName());
}

describe('buildTemplatePdf', () => {
  it('genera un PDF con un campo de estado por cada punto activo', async () => {
    const t = resolveTemplate(INSPECTION_CATALOG, emptyConfig());
    const blob = await buildTemplatePdf(t);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const names = await fieldNames(bytes);
    expect(names.filter((n) => n.startsWith('estado_'))).toHaveLength(56);
    expect(names).toContain('hdr_vin');
    expect(names).toContain('obs_A');
  });

  it('al quitar la sección G no genera sus campos', async () => {
    const cfg: InspectionConfig = { ...emptyConfig(), disabledSections: ['G'] };
    const t = resolveTemplate(INSPECTION_CATALOG, cfg);
    const blob = await buildTemplatePdf(t);
    const names = await fieldNames(new Uint8Array(await blob.arrayBuffer()));
    expect(names.filter((n) => n.startsWith('estado_'))).toHaveLength(52);
    expect(names).not.toContain('obs_G');
  });

  it('genera campo para una pregunta propia', async () => {
    const cfg: InspectionConfig = { ...emptyConfig(), customPoints: [{ section: 'B', label: 'X' }] };
    const t = resolveTemplate(INSPECTION_CATALOG, cfg);
    const names = await fieldNames(new Uint8Array(await (await buildTemplatePdf(t)).arrayBuffer()));
    expect(names).toContain('estado_custom_B_0');
  });
});
