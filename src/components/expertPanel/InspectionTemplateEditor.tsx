import { useMemo, useState } from 'react';
import { Lock, Plus, X } from 'lucide-react';
import { INSPECTION_CATALOG } from '../../lib/inspectionCatalog';
import {
  emptyConfig, sanitizeConfig, resolveTemplate, countActivePoints,
  type InspectionConfig,
} from '../../lib/inspectionTemplateConfig';
import { buildTemplatePdf } from '../../lib/inspectionPdf';

interface Props {
  config: InspectionConfig | null;
  onChange: (cfg: InspectionConfig) => void;
}

// Etiqueta corta para el chip: nos quedamos con lo previo a ":" (el detalle
// largo va completo en el PDF). Evita chips kilométricos.
const short = (label: string) => label.split(':')[0].trim();

export default function InspectionTemplateEditor({ config, onChange }: Props) {
  const cfg = useMemo(() => sanitizeConfig(INSPECTION_CATALOG, config ?? emptyConfig()), [config]);
  const disabledSections = new Set(cfg.disabledSections);
  const disabledPoints = new Set(cfg.disabledPoints);
  const [adding, setAdding] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const resolved = useMemo(() => resolveTemplate(INSPECTION_CATALOG, cfg), [cfg]);
  const totalPoints = INSPECTION_CATALOG.sections.reduce((a, s) => a + s.points.length, 0);

  const update = (next: InspectionConfig) => onChange(sanitizeConfig(INSPECTION_CATALOG, next));

  const toggleSection = (id: string) => {
    const has = disabledSections.has(id);
    update({ ...cfg, disabledSections: has ? cfg.disabledSections.filter((s) => s !== id) : [...cfg.disabledSections, id] });
  };
  const togglePoint = (num: number) => {
    const has = disabledPoints.has(num);
    update({ ...cfg, disabledPoints: has ? cfg.disabledPoints.filter((n) => n !== num) : [...cfg.disabledPoints, num] });
  };
  const addCustom = (section: string) => {
    const label = draft.trim();
    if (!label) return;
    update({ ...cfg, customPoints: [...cfg.customPoints, { section, label }] });
    setDraft(''); setAdding(null);
  };
  const removeCustom = (section: string, idx: number) => {
    let seen = -1;
    update({
      ...cfg,
      customPoints: cfg.customPoints.filter((c) => {
        if (c.section !== section) return true;
        seen += 1; return seen !== idx;
      }),
    });
  };
  const preview = async () => {
    const blob = await buildTemplatePdf(resolveTemplate(INSPECTION_CATALOG, cfg));
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  // Chip base: una sola "forma" de chip en todo el editor (consistencia).
  const chipBase = 'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium leading-none transition-colors';

  return (
    <div className="px-4 py-3 sm:px-5 sm:py-4">
      <p className="mb-4 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12px] leading-snug text-[hsl(var(--ep-muted))]">
        Si no quitas nada se entrega el informe completo. Los puntos con
        <Lock className="h-3 w-3 text-[hsl(var(--ep-muted))]" aria-hidden />
        son obligatorios.
      </p>

      <div className="divide-y divide-[hsl(var(--ep-border))]">
        {INSPECTION_CATALOG.sections.map((sec) => {
          const off = disabledSections.has(sec.id);
          const hasRequired = sec.points.some((p) => p.required);
          const customs = cfg.customPoints.filter((c) => c.section === sec.id);
          const active = off ? 0 : sec.points.filter((p) => !disabledPoints.has(p.num)).length + customs.length;
          return (
            <section key={sec.id} className="py-3.5 first:pt-0">
              <header className="mb-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h4 className={`truncate text-[13px] font-semibold text-[hsl(var(--ep-ink))] ${off ? 'opacity-50' : ''}`}>
                    {sec.id} · {sec.title}
                  </h4>
                  <p className="mt-0.5 text-[11px] text-[hsl(var(--ep-muted))]">
                    {off ? 'Sección desactivada' : `${sec.points.length} puntos · ${active} activos`}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!off}
                  disabled={hasRequired}
                  onClick={() => toggleSection(sec.id)}
                  title={hasRequired ? 'Contiene puntos obligatorios' : (off ? 'Activar sección' : 'Desactivar sección')}
                  className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${off ? 'bg-[hsl(var(--ep-border-strong))]' : 'bg-[hsl(var(--brand))]'} ${hasRequired ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${off ? 'left-0.5' : 'left-[18px]'}`} />
                </button>
              </header>

              {!off && (
                <div className="flex flex-wrap gap-2">
                  {sec.points.map((p) => {
                    const num = <span className="tabular-nums text-[hsl(var(--ep-muted))]">{p.num}</span>;
                    if (p.required) {
                      return (
                        <span
                          key={p.num}
                          title="Punto obligatorio (no se puede quitar)"
                          className={`${chipBase} cursor-default border-[hsl(var(--brand)/0.25)] bg-[hsl(var(--brand)/0.06)] text-[hsl(var(--ep-ink))]`}
                        >
                          {num} {short(p.label)} <Lock className="h-3 w-3 text-[hsl(var(--brand))]" aria-hidden />
                        </span>
                      );
                    }
                    const removed = disabledPoints.has(p.num);
                    return (
                      <button
                        type="button"
                        key={p.num}
                        onClick={() => togglePoint(p.num)}
                        aria-pressed={!removed}
                        className={`${chipBase} ${removed
                          ? 'border-dashed border-[hsl(var(--ep-border))] bg-[hsl(var(--ep-canvas))] text-[hsl(var(--ep-muted))]'
                          : 'border-[hsl(var(--ep-border))] bg-white text-[hsl(var(--ep-ink))] hover:border-[hsl(var(--ep-border-strong))] hover:bg-[hsl(var(--ep-canvas))]'}`}
                      >
                        {num}
                        <span className={removed ? 'line-through' : ''}>{short(p.label)}</span>
                        {removed
                          ? <Plus className="h-3 w-3 text-[hsl(var(--ep-muted))]" aria-hidden />
                          : <X className="h-3 w-3 text-[hsl(var(--ep-muted))]" aria-hidden />}
                      </button>
                    );
                  })}

                  {customs.map((c, i) => (
                    <button
                      type="button"
                      key={`${sec.id}-custom-${i}`}
                      onClick={() => removeCustom(sec.id, i)}
                      title="Pregunta propia · pulsa para quitar"
                      className={`${chipBase} border-[hsl(var(--brand)/0.25)] bg-[hsl(var(--brand)/0.06)] text-[hsl(var(--ep-ink))] hover:bg-[hsl(var(--brand)/0.1)]`}
                    >
                      {short(c.label)} <X className="h-3 w-3 text-[hsl(var(--ep-muted))]" aria-hidden />
                    </button>
                  ))}

                  {adding === sec.id ? (
                    <span className="inline-flex items-center gap-1.5">
                      <input
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); addCustom(sec.id); }
                          if (e.key === 'Escape') { setAdding(null); setDraft(''); }
                        }}
                        onBlur={() => { if (!draft.trim()) setAdding(null); }}
                        placeholder="Nueva pregunta…"
                        className="h-[30px] rounded-full border border-[hsl(var(--ep-border))] bg-white px-3 text-[12px] text-[hsl(var(--ep-ink))] outline-none focus:border-[hsl(var(--brand))]"
                      />
                      <button
                        type="button"
                        onClick={() => addCustom(sec.id)}
                        className="h-[30px] rounded-full bg-[hsl(var(--brand))] px-3 text-[12px] font-semibold text-white hover:bg-[hsl(var(--brand-hover))]"
                      >
                        Añadir
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setAdding(sec.id); setDraft(''); }}
                      className={`${chipBase} border-dashed border-[hsl(var(--ep-border-strong))] bg-transparent text-[hsl(var(--ep-muted))] hover:border-[hsl(var(--brand)/0.4)] hover:text-[hsl(var(--ep-ink))]`}
                    >
                      <Plus className="h-3 w-3" aria-hidden /> Añadir pregunta
                    </button>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[hsl(var(--ep-border))] pt-3 text-[13px]">
        <span className="font-medium text-[hsl(var(--ep-ink))]">
          {countActivePoints(resolved)} de {totalPoints} puntos · {resolved.sections.length} de {INSPECTION_CATALOG.sections.length} secciones
        </span>
        <button type="button" onClick={preview} className="font-semibold text-[hsl(var(--brand))] hover:underline">
          Vista previa del PDF
        </button>
      </div>
    </div>
  );
}
