// ReactWeb/src/lib/__tests__/inspectionCatalog.test.ts
import { describe, it, expect } from 'vitest';
import { INSPECTION_CATALOG, allPoints, requiredPointNums } from '../inspectionCatalog';

describe('inspectionCatalog', () => {
  it('tiene 11 secciones A..K', () => {
    expect(INSPECTION_CATALOG.sections).toHaveLength(11);
    expect(INSPECTION_CATALOG.sections.map((s) => s.id)).toEqual(
      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'],
    );
  });

  it('tiene 56 puntos numerados 1..56 sin huecos', () => {
    const nums = allPoints(INSPECTION_CATALOG).map((p) => p.num).sort((a, b) => a - b);
    expect(nums).toHaveLength(56);
    expect(nums[0]).toBe(1);
    expect(nums[55]).toBe(56);
  });

  it('marca como obligatorios exactamente los puntos 1, 2 y 4', () => {
    expect(requiredPointNums(INSPECTION_CATALOG).sort((a, b) => a - b)).toEqual([1, 2, 4]);
  });

  it('cada punto tiene etiqueta no vacía', () => {
    for (const p of allPoints(INSPECTION_CATALOG)) {
      expect(p.label.trim().length).toBeGreaterThan(0);
    }
  });
});
