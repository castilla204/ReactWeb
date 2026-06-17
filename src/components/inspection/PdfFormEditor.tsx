import { useCallback, useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PDFDocument } from 'pdf-lib';
import { CloudCheck, Loader2, Download } from 'lucide-react';
import { loadInspection, saveInspection } from '../../lib/pdfFormStore';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

type FieldKind = 'text' | 'textarea' | 'select';
interface FieldBox {
    name: string;
    kind: FieldKind;
    options?: string[];
    left: number;
    top: number;
    width: number;
    height: number;
}
interface PageInfo {
    num: number;
    cssW: number;
    cssH: number;
    scale: number;
    fields: FieldBox[];
}

export interface PdfFormEditorProps {
    hireId: string;
    /** Ruta del PDF rellenable. Por defecto la plantilla de coche en /public. */
    templateUrl?: string;
    /** Se llama tras cada autoguardado con el PDF rellenado (para subirlo al backend). */
    onSaved?: (pdf: Blob, values: Record<string, string>) => void;
}

const MAX_WIDTH = 900;

export default function PdfFormEditor({ hireId, templateUrl, onSaved }: PdfFormEditorProps) {
    const url = templateUrl ?? '/plantillas/inspeccion-coche.pdf';
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRefs = useRef<Map<number, HTMLCanvasElement | null>>(new Map());
    const pageProxies = useRef<Map<number, any>>(new Map());
    const originalBytes = useRef<Uint8Array | null>(null);
    const saveTimer = useRef<number | null>(null);
    const firstRender = useRef(true);

    const [pages, setPages] = useState<PageInfo[]>([]);
    const [values, setValues] = useState<Record<string, string>>({});
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

    // Carga el PDF, calcula posiciones de los campos y restaura el borrador guardado.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(url);
                const buf = new Uint8Array(await res.arrayBuffer());
                originalBytes.current = buf;
                const pdf = await pdfjsLib.getDocument({ data: buf.slice() }).promise;
                const containerW = Math.min(containerRef.current?.clientWidth || 800, MAX_WIDTH);
                const infos: PageInfo[] = [];
                const initial: Record<string, string> = {};
                for (let n = 1; n <= pdf.numPages; n++) {
                    const page = await pdf.getPage(n);
                    pageProxies.current.set(n, page);
                    const base = page.getViewport({ scale: 1 });
                    const scale = containerW / base.width;
                    const vp = page.getViewport({ scale });
                    const annots: any[] = await page.getAnnotations({ intent: 'display' });
                    const fields: FieldBox[] = [];
                    for (const a of annots) {
                        if (!a.fieldName || (a.fieldType !== 'Tx' && a.fieldType !== 'Ch')) continue;
                        const r = vp.convertToViewportRectangle(a.rect);
                        const left = Math.min(r[0], r[2]);
                        const top = Math.min(r[1], r[3]);
                        const width = Math.abs(r[0] - r[2]);
                        const height = Math.abs(r[1] - r[3]);
                        let kind: FieldKind = 'text';
                        let options: string[] | undefined;
                        if (a.fieldType === 'Ch') {
                            kind = 'select';
                            options = (a.options || []).map((o: any) => o.displayValue ?? o.exportValue ?? String(o));
                        } else if (a.multiLine) {
                            kind = 'textarea';
                        }
                        if (initial[a.fieldName] === undefined) {
                            initial[a.fieldName] = typeof a.fieldValue === 'string' ? a.fieldValue : '';
                        }
                        fields.push({ name: a.fieldName, kind, options, left, top, width, height });
                    }
                    infos.push({ num: n, cssW: vp.width, cssH: vp.height, scale, fields });
                }
                if (cancelled) return;
                const saved = await loadInspection(hireId);
                if (saved?.values) Object.assign(initial, saved.values);
                setPages(infos);
                setValues(initial);
                setStatus('ready');
            } catch (e) {
                console.error('No se pudo cargar el PDF', e);
                if (!cancelled) setStatus('error');
            }
        })();
        return () => { cancelled = true; };
    }, [url, hireId]);

    // Pinta cada página en su canvas cuando ya están en el DOM.
    useEffect(() => {
        if (status !== 'ready') return;
        const dpr = window.devicePixelRatio || 1;
        pages.forEach(async (p) => {
            const page = pageProxies.current.get(p.num);
            const canvas = canvasRefs.current.get(p.num);
            if (!page || !canvas) return;
            const vp = page.getViewport({ scale: p.scale });
            canvas.width = Math.floor(vp.width * dpr);
            canvas.height = Math.floor(vp.height * dpr);
            canvas.style.width = `${vp.width}px`;
            canvas.style.height = `${vp.height}px`;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            await page.render({ canvasContext: ctx, viewport: vp }).promise;
        });
    }, [status, pages]);

    // Construye el PDF rellenado con pdf-lib a partir de los valores actuales.
    const buildPdf = useCallback(async (vals: Record<string, string>): Promise<Blob> => {
        const doc = await PDFDocument.load(originalBytes.current!);
        const form = doc.getForm();
        for (const p of pages) {
            for (const f of p.fields) {
                const v = vals[f.name];
                if (v === undefined) continue;
                try {
                    if (f.kind === 'select') {
                        if (v) form.getDropdown(f.name).select(v);
                    } else {
                        form.getTextField(f.name).setText(v || '');
                    }
                } catch { /* campo no coincidente: ignorar */ }
            }
        }
        const bytes = await doc.save();
        return new Blob([bytes], { type: 'application/pdf' });
    }, [pages]);

    // Autoguardado: cada vez que cambian los valores, guarda el PDF en local.
    useEffect(() => {
        if (status !== 'ready') return;
        if (firstRender.current) { firstRender.current = false; return; }
        setSaveState('saving');
        if (saveTimer.current) window.clearTimeout(saveTimer.current);
        saveTimer.current = window.setTimeout(async () => {
            try {
                const pdf = await buildPdf(values);
                await saveInspection({ hireId, values, pdf, updatedAt: new Date().toISOString() });
                onSaved?.(pdf, values);
                setSaveState('saved');
            } catch (e) {
                console.error('Error al guardar', e);
                setSaveState('idle');
            }
        }, 800);
        return () => { if (saveTimer.current) window.clearTimeout(saveTimer.current); };
    }, [values, status, hireId, buildPdf, onSaved]);

    const setField = (name: string, v: string) => setValues((prev) => ({ ...prev, [name]: v }));

    const download = async () => {
        const pdf = await buildPdf(values);
        const href = URL.createObjectURL(pdf);
        const a = document.createElement('a');
        a.href = href;
        a.download = `inspeccion-${hireId}.pdf`;
        a.click();
        URL.revokeObjectURL(href);
    };

    if (status === 'error') {
        return <div className="px-4 py-10 text-center text-sm text-red-600">No se pudo cargar la plantilla del informe.</div>;
    }

    return (
        <div ref={containerRef} className="mx-auto w-full" style={{ maxWidth: MAX_WIDTH }}>
            <div className="sticky top-0 z-20 -mx-2 mb-3 flex items-center justify-between border-b border-gray-200 bg-white/95 px-2 py-2 backdrop-blur">
                <span className="text-sm font-semibold text-gray-900">Inspección · contratación #{hireId}</span>
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        {saveState === 'saving'
                            ? (<><Loader2 size={14} className="animate-spin" /> Guardando…</>)
                            : (<><CloudCheck size={14} className="text-green-600" /> Guardado</>)}
                    </span>
                    <button type="button" onClick={download} className="flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700">
                        <Download size={14} /> PDF
                    </button>
                </div>
            </div>

            {status === 'loading' && (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
                    <Loader2 size={18} className="animate-spin" /> Cargando informe…
                </div>
            )}

            <div className="flex flex-col items-center gap-4">
                {pages.map((p) => (
                    <div key={p.num} className="relative shadow-sm" style={{ width: p.cssW, height: p.cssH }}>
                        <canvas ref={(el) => { canvasRefs.current.set(p.num, el); }} className="block" />
                        {p.fields.map((f) => {
                            const common = {
                                style: {
                                    position: 'absolute' as const,
                                    left: f.left,
                                    top: f.top,
                                    width: f.width,
                                    height: f.height,
                                    fontSize: Math.min(13, Math.max(9, f.height * 0.55)),
                                },
                                className:
                                    'box-border border border-blue-400/60 bg-blue-50/40 px-1 text-gray-900 outline-none focus:border-blue-600 focus:bg-white',
                            };
                            if (f.kind === 'select') {
                                return (
                                    <select key={f.name} {...common} value={values[f.name] ?? ''} onChange={(e) => setField(f.name, e.target.value)}>
                                        {(f.options ?? []).map((o) => (<option key={o} value={o}>{o}</option>))}
                                    </select>
                                );
                            }
                            if (f.kind === 'textarea') {
                                return (
                                    <textarea
                                        key={f.name}
                                        {...common}
                                        value={values[f.name] ?? ''}
                                        onChange={(e) => setField(f.name, e.target.value)}
                                        style={{ ...common.style, resize: 'none', lineHeight: 1.2, paddingTop: 2 }}
                                    />
                                );
                            }
                            return (
                                <input
                                    key={f.name}
                                    {...common}
                                    value={values[f.name] ?? ''}
                                    onChange={(e) => setField(f.name, e.target.value)}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>

            <div className="h-10" />
        </div>
    );
}
