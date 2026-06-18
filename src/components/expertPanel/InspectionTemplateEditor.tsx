import { useMemo, useState } from 'react';
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

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
        Si no quitas nada se entrega el informe completo. Los puntos en verde con 🔒 son obligatorios.
      </div>

      {INSPECTION_CATALOG.sections.map((sec) => {
        const off = disabledSections.has(sec.id);
        const hasRequired = sec.points.some((p) => p.required);
        const customs = cfg.customPoints.filter((c) => c.section === sec.id);
        const active = off ? 0 : sec.points.filter((p) => !disabledPoints.has(p.num)).length + customs.length;
        return (
          <div key={sec.id} className={`mb-3 rounded-xl border border-gray-200 bg-white p-3 ${off ? 'opacity-60' : ''}`}>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-gray-900">{sec.id} · {sec.title}</div>
                <div className="text-xs text-gray-500">{off ? 'Desactivada' : `${sec.points.length} puntos · ${active} activos`}</div>
              </div>
              <button
                type="button"
                disabled={hasRequired}
                onClick={() => toggleSection(sec.id)}
                title={hasRequired ? 'Contiene obligatorios' : (off ? 'Activar sección' : 'Desactivar sección')}
                className={`h-6 w-11 rounded-full transition ${off ? 'bg-gray-300' : 'bg-blue-600'} ${hasRequired ? 'opacity-40' : ''} relative`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${off ? 'left-0.5' : 'left-[22px]'}`} />
              </button>
            </div>

            {!off && (
              <div className="flex flex-wrap gap-2">
                {sec.points.map((p) => {
                  const removed = disabledPoints.has(p.num);
                  if (p.required) {
                    return (
                      <span key={p.num} className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-green-600 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                        <span className="tabular-nums opacity-75">{p.num}</span> {p.label.split(':')[0]} 🔒
                      </span>
                    );
                  }
                  return (
                    <button
                      type="button" key={p.num} onClick={() => togglePoint(p.num)}
                      className={`inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1.5 text-xs font-semibold ${removed ? 'border-gray-200 bg-gray-100 text-gray-400 line-through' : 'border-blue-600 bg-blue-50 text-blue-700'}`}
                    >
                      <span className="tabular-nums opacity-75">{p.num}</span> {p.label.split(':')[0]} <span className="opacity-60">{removed ? '＋' : '✕'}</span>
                    </button>
                  );
                })}
                {customs.map((c, i) => (
                  <button
                    type="button" key={`${sec.id}-custom-${i}`} onClick={() => removeCustom(sec.id, i)}
                    className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-indigo-500 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700"
                  >
                    {c.label} <span className="opacity-60">✕</span>
                  </button>
                ))}
                {adding === sec.id ? (
                  <span className="inline-flex items-center gap-1">
                    <input
                      autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(sec.id); } }}
                      placeholder="Nueva pregunta…" className="rounded-full border border-gray-300 px-3 py-1.5 text-xs"
                    />
                    <button type="button" onClick={() => addCustom(sec.id)} className="rounded-full bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white">Añadir</button>
                  </span>
                ) : (
                  <button type="button" onClick={() => { setAdding(sec.id); setDraft(''); }} className="inline-flex items-center rounded-full border-[1.5px] border-dashed border-gray-400 px-3 py-1.5 text-xs font-semibold text-gray-600">
                    ＋ Añadir pregunta
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div className="mt-2 flex items-center justify-between text-sm font-semibold text-gray-700">
        <span>📄 Tu informe: {countActivePoints(resolved)} de {totalPoints} puntos · {resolved.sections.length} de {INSPECTION_CATALOG.sections.length} secciones</span>
        <button type="button" onClick={preview} className="text-blue-600">Vista previa del PDF →</button>
      </div>
    </div>
  );
}
