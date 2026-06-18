// ReactWeb/src/lib/__tests__/inspectionTemplateConfig.test.ts
import { describe, it, expect } from 'vitest';
import { INSPECTION_CATALOG } from '../inspectionCatalog';
import {
  emptyConfig, sanitizeConfig, resolveTemplate, countActivePoints, type InspectionConfig,
} from '../inspectionTemplateConfig';

describe('inspectionTemplateConfig', () => {
  it('config vacía resuelve al informe completo: 56 puntos y 11 secciones', () => {
    const t = resolveTemplate(INSPECTION_CATALOG, emptyConfig());
    expect(t.sections).toHaveLength(11);
    expect(countActivePoints(t)).toBe(56);
  });

  it('quita una sección opcional y sus puntos desaparecen', () => {
    const cfg: InspectionConfig = { ...emptyConfig(), disabledSections: ['G'] };
    const t = resolveTemplate(INSPECTION_CATALOG, cfg);
    expect(t.sections.map((s) => s.id)).not.toContain('G');
    expect(countActivePoints(t)).toBe(52); // G tiene 4 puntos
  });

  it('nunca permite desactivar un punto obligatorio (saneado)', () => {
    const cfg = sanitizeConfig(INSPECTION_CATALOG, { ...emptyConfig(), disabledPoints: [1, 2, 4, 6] });
    expect(cfg.disabledPoints).toEqual([6]);
  });

  it('nunca permite desactivar la sección A (contiene obligatorios)', () => {
    const cfg = sanitizeConfig(INSPECTION_CATALOG, { ...emptyConfig(), disabledSections: ['A', 'G'] });
    expect(cfg.disabledSections).toEqual(['G']);
  });

  it('renumera los puntos del informe efectivo de forma contigua', () => {
    const cfg: InspectionConfig = { ...emptyConfig(), disabledPoints: [3] };
    const t = resolveTemplate(INSPECTION_CATALOG, cfg);
    const a = t.sections.find((s) => s.id === 'A')!;
    expect(a.points.map((p) => p.displayNum)).toEqual([1, 2, 3, 4, 5, 6, 7]); // 8 puntos -1 = 7, contiguos
  });

  it('añade preguntas propias a una sección con clave de campo estable', () => {
    const cfg: InspectionConfig = {
      ...emptyConfig(),
      customPoints: [{ section: 'B', label: 'Revisión turbo variable' }],
    };
    const t = resolveTemplate(INSPECTION_CATALOG, cfg);
    const b = t.sections.find((s) => s.id === 'B')!;
    const custom = b.points.find((p) => p.custom);
    expect(custom?.label).toBe('Revisión turbo variable');
    expect(custom?.fieldName).toBe('estado_custom_B_0');
  });
});
