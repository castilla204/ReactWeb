import { type Catalog, allPoints, requiredPointNums } from './inspectionCatalog';

export const INSPECTION_CONFIG_VERSION = 1;

export interface CustomPoint {
  section: string;  // id de sección existente ('A'..'K')
  label: string;
}

export interface InspectionConfig {
  version: number;
  disabledSections: string[];
  disabledPoints: number[];
  customPoints: CustomPoint[];
}

// Punto ya resuelto para pintar/generar: nombre de campo estable + nº visible.
export interface ResolvedPoint {
  fieldName: string;   // nombre del campo AcroForm (estable)
  displayNum: number;  // número visible (contiguo) en el informe efectivo
  label: string;
  custom?: boolean;
}

export interface ResolvedSection {
  id: string;
  title: string;
  subtitle: string;
  obsFieldName: string;
  points: ResolvedPoint[];
}

export interface ResolvedTemplate {
  headerFields: { key: string; label: string; fieldName: string }[];
  sections: ResolvedSection[];
}

export function emptyConfig(): InspectionConfig {
  return { version: INSPECTION_CONFIG_VERSION, disabledSections: [], disabledPoints: [], customPoints: [] };
}

/** Quita del config cualquier intento de desactivar obligatorios o la sección A,
 *  normaliza tipos y descarta basura. Idempotente. */
export function sanitizeConfig(catalog: Catalog, raw: Partial<InspectionConfig> | null | undefined): InspectionConfig {
  const cfg = { ...emptyConfig(), ...(raw ?? {}) };
  const required = new Set(requiredPointNums(catalog));
  const validSectionIds = new Set(catalog.sections.map((s) => s.id));
  const sectionsWithRequired = new Set(
    catalog.sections.filter((s) => s.points.some((p) => p.required)).map((s) => s.id),
  );
  const validPointNums = new Set(allPoints(catalog).map((p) => p.num));

  return {
    version: INSPECTION_CONFIG_VERSION,
    disabledSections: [...new Set(cfg.disabledSections ?? [])]
      .filter((id) => validSectionIds.has(id) && !sectionsWithRequired.has(id)),
    disabledPoints: [...new Set(cfg.disabledPoints ?? [])]
      .filter((n) => validPointNums.has(n) && !required.has(n)),
    customPoints: (cfg.customPoints ?? [])
      .filter((c) => c && validSectionIds.has(c.section) && typeof c.label === 'string' && c.label.trim().length > 0)
      .map((c) => ({ section: c.section, label: c.label.trim() })),
  };
}

/** Aplica el config al catálogo y devuelve el informe efectivo, con números
 *  visibles contiguos y nombres de campo estables. */
export function resolveTemplate(catalog: Catalog, rawConfig: Partial<InspectionConfig> | null | undefined): ResolvedTemplate {
  const cfg = sanitizeConfig(catalog, rawConfig);
  const disabledSections = new Set(cfg.disabledSections);
  const disabledPoints = new Set(cfg.disabledPoints);

  let counter = 0;
  const sections: ResolvedSection[] = [];
  for (const sec of catalog.sections) {
    if (disabledSections.has(sec.id)) continue;
    const points: ResolvedPoint[] = [];
    for (const p of sec.points) {
      if (disabledPoints.has(p.num)) continue;
      points.push({ fieldName: `estado_${p.num}`, displayNum: ++counter, label: p.label });
    }
    const customForSection = cfg.customPoints.filter((c) => c.section === sec.id);
    customForSection.forEach((c, i) => {
      points.push({ fieldName: `estado_custom_${sec.id}_${i}`, displayNum: ++counter, label: c.label, custom: true });
    });
    if (points.length === 0) continue; // sección sin puntos activos: no se pinta
    sections.push({
      id: sec.id, title: sec.title, subtitle: sec.subtitle,
      obsFieldName: `obs_${sec.id}`, points,
    });
  }

  return {
    headerFields: catalog.headerFields.map((h) => ({ ...h, fieldName: `hdr_${h.key}` })),
    sections,
  };
}

export function countActivePoints(t: ResolvedTemplate): number {
  return t.sections.reduce((acc, s) => acc + s.points.length, 0);
}
