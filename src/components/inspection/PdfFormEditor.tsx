import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PDFDocument } from 'pdf-lib';
import { CloudCheck, Loader2, Download, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { loadInspection, saveInspection } from '../../lib/pdfFormStore';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

type FieldKind = 'text' | 'textarea' | 'select';
// Geometría NORMALIZADA (fracción 0..1 del tamaño de página) para que los
// campos se reposicionen solos a cualquier escala/zoom sin recalcular el PDF.
interface FieldBox {
    name: string;
    kind: FieldKind;
    options?: string[];
    nx: number;
    ny: number;
    nw: number;
    nh: number;
}
interface PageInfo {
    num: number;
    baseW: number; // ancho de página en puntos (escala 1)
    baseH: number;
    fields: FieldBox[];
}

export interface PdfFormEditorProps {
    hireId: string;
    /** Ruta del PDF rellenable. Por defecto la plantilla de coche en /public. */
    templateUrl?: string;
    /** Se llama tras cada autoguardado con el PDF rellenado (para subirlo al backend). */
    onSaved?: (pdf: Blob, values: Record<string, string>) => void;
}

const FIT_MAX_W = 920;   // en escritorio no agrandar la página más allá de esto
const PAGE_PAD = 16;     // margen lateral dentro del área de scroll
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.25;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export default function PdfFormEditor({ hireId, templateUrl, onSaved }: PdfFormEditorProps) {
    const url = templateUrl ?? '/plantillas/inspeccion-coche.pdf';
    const scrollRef = useRef<HTMLDivElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const canvasRefs = useRef<Map<number, HTMLCanvasElement | null>>(new Map());
    const pageProxies = useRef<Map<number, any>>(new Map());
    const renderTasks = useRef<Map<number, any>>(new Map());
    const originalBytes = useRef<Uint8Array | null>(null);
    const saveTimer = useRef<number | null>(null);
    const firstRender = useRef(true);
    const pendingScroll = useRef<{ left: number; top: number } | null>(null);

    const [pages, setPages] = useState<PageInfo[]>([]);
    const [values, setValues] = useState<Record<string, string>>({});
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [containerW, setContainerW] = useState(0);
    const [zoom, setZoom] = useState(1);
    const zoomRef = useRef(1);
    useEffect(() => { zoomRef.current = zoom; }, [zoom]);

    // Escala: "ajustar al ancho" × zoom del usuario.
    const baseW = pages[0]?.baseW || 595;
    const fitScale = containerW ? (Math.min(containerW, FIT_MAX_W) - PAGE_PAD) / baseW : 0.5;
    const renderScale = fitScale * zoom;

    // Mide el ancho disponible (y reacciona a rotación / cambios de tamaño).
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const update = () => setContainerW(el.clientWidth);
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Carga el PDF, calcula posiciones (normalizadas) y restaura el borrador guardado.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(url);
                const buf = new Uint8Array(await res.arrayBuffer());
                originalBytes.current = buf;
                const pdf = await pdfjsLib.getDocument({ data: buf.slice() }).promise;
                const infos: PageInfo[] = [];
                const initial: Record<string, string> = {};
                for (let n = 1; n <= pdf.numPages; n++) {
                    const page = await pdf.getPage(n);
                    pageProxies.current.set(n, page);
                    const base = page.getViewport({ scale: 1 });
                    const annots: any[] = await page.getAnnotations({ intent: 'display' });
                    const fields: FieldBox[] = [];
                    for (const a of annots) {
                        if (!a.fieldName || (a.fieldType !== 'Tx' && a.fieldType !== 'Ch')) continue;
                        const r = base.convertToViewportRectangle(a.rect);
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
                        fields.push({
                            name: a.fieldName, kind, options,
                            nx: left / base.width, ny: top / base.height,
                            nw: width / base.width, nh: height / base.height,
                        });
                    }
                    infos.push({ num: n, baseW: base.width, baseH: base.height, fields });
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

    // Pinta cada página a la escala actual (re-render nítido tras cada zoom).
    useEffect(() => {
        if (status !== 'ready' || !containerW) return;
        const dpr = window.devicePixelRatio || 1;
        pages.forEach(async (p) => {
            const page = pageProxies.current.get(p.num);
            const canvas = canvasRefs.current.get(p.num);
            if (!page || !canvas) return;
            const prev = renderTasks.current.get(p.num);
            if (prev) { try { prev.cancel(); } catch { /* noop */ } }
            const vp = page.getViewport({ scale: renderScale });
            canvas.width = Math.floor(vp.width * dpr);
            canvas.height = Math.floor(vp.height * dpr);
            canvas.style.width = `${vp.width}px`;
            canvas.style.height = `${vp.height}px`;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            // No pintar las anotaciones de formulario: ponemos los controles
            // nativos encima y, si no, el texto del campo se vería duplicado.
            const task = page.render({
                canvasContext: ctx,
                viewport: vp,
                annotationMode: pdfjsLib.AnnotationMode.DISABLE,
            });
            renderTasks.current.set(p.num, task);
            try { await task.promise; } catch { /* render cancelado al cambiar de escala */ }
        });
    }, [status, pages, renderScale, containerW]);

    // Tras re-renderizar a una nueva escala, restaura el scroll en el punto focal del zoom.
    useLayoutEffect(() => {
        if (pendingScroll.current && scrollRef.current) {
            scrollRef.current.scrollLeft = pendingScroll.current.left;
            scrollRef.current.scrollTop = pendingScroll.current.top;
            pendingScroll.current = null;
        }
    }, [renderScale]);

    // Aplica un nuevo zoom manteniendo fijo el punto (clientX, clientY) bajo el dedo/cursor.
    const zoomTo = useCallback((nextZoom: number, clientX?: number, clientY?: number) => {
        const el = scrollRef.current;
        const z = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
        if (el) {
            const rect = el.getBoundingClientRect();
            const offX = (clientX ?? rect.left + rect.width / 2) - rect.left;
            const offY = (clientY ?? rect.top + rect.height / 2) - rect.top;
            const ratio = z / zoomRef.current;
            pendingScroll.current = {
                left: (el.scrollLeft + offX) * ratio - offX,
                top: (el.scrollTop + offY) * ratio - offY,
            };
        }
        setZoom(z);
    }, []);

    // ----- Gestos táctiles: pinch (transform en vivo + re-render al soltar) y doble-toque -----
    // Listeners NATIVOS con { passive: false }: en React onTouchMove es passive por
    // defecto y e.preventDefault() no surtiría efecto (el navegador haría su zoom).
    const pinch = useRef<{ active: boolean; startDist: number; startZoom: number; cx: number; cy: number; ratio: number }>(
        { active: false, startDist: 0, startZoom: 1, cx: 0, cy: 0, ratio: 1 });
    const lastTap = useRef(0);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const distOf = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
        const onStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                const t = e.touches;
                pinch.current = {
                    active: true, startDist: distOf(t), startZoom: zoomRef.current,
                    cx: (t[0].clientX + t[1].clientX) / 2, cy: (t[0].clientY + t[1].clientY) / 2, ratio: 1,
                };
            }
        };
        const onMove = (e: TouchEvent) => {
            if (!pinch.current.active || e.touches.length !== 2) return;
            e.preventDefault(); // evita el zoom nativo del navegador durante el gesto
            const p = pinch.current;
            const r = clamp(distOf(e.touches) / p.startDist, MIN_ZOOM / p.startZoom, MAX_ZOOM / p.startZoom);
            p.ratio = r;
            const wrap = wrapRef.current;
            if (wrap) {
                const rect = el.getBoundingClientRect();
                const ox = el.scrollLeft + (p.cx - rect.left);
                const oy = el.scrollTop + (p.cy - rect.top);
                wrap.style.transformOrigin = `${ox}px ${oy}px`;
                wrap.style.transform = `scale(${r})`;
            }
        };
        const onEnd = (e: TouchEvent) => {
            if (pinch.current.active && e.touches.length < 2) {
                const p = pinch.current;
                pinch.current.active = false;
                const wrap = wrapRef.current;
                if (wrap) { wrap.style.transform = ''; wrap.style.transformOrigin = ''; }
                zoomTo(p.startZoom * p.ratio, p.cx, p.cy);
                return;
            }
            // Doble-toque para alternar zoom (patrón móvil habitual).
            if (e.touches.length === 0 && e.changedTouches.length === 1) {
                const now = e.timeStamp;
                const ct = e.changedTouches[0];
                if (now - lastTap.current < 300) {
                    lastTap.current = 0;
                    zoomTo(zoomRef.current > 1.2 ? 1 : 2.5, ct.clientX, ct.clientY);
                } else {
                    lastTap.current = now;
                }
            }
        };
        // Escritorio: ctrl/⌘ + rueda hace zoom (y captura el pinch del trackpad,
        // que el navegador envía como 'wheel' con ctrlKey=true).
        const onWheel = (e: WheelEvent) => {
            if (!e.ctrlKey && !e.metaKey) return;
            e.preventDefault();
            zoomTo(zoomRef.current * (e.deltaY < 0 ? 1.1 : 0.9), e.clientX, e.clientY);
        };
        el.addEventListener('touchstart', onStart, { passive: true });
        el.addEventListener('touchmove', onMove, { passive: false });
        el.addEventListener('touchend', onEnd, { passive: true });
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => {
            el.removeEventListener('touchstart', onStart);
            el.removeEventListener('touchmove', onMove);
            el.removeEventListener('touchend', onEnd);
            el.removeEventListener('wheel', onWheel);
        };
    }, [zoomTo]);

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

    const pageDims = useMemo(
        () => pages.map((p) => ({ num: p.num, w: p.baseW * renderScale, h: p.baseH * renderScale, fields: p.fields })),
        [pages, renderScale],
    );

    if (status === 'error') {
        return <div className="px-4 py-10 text-center text-sm text-red-600">No se pudo cargar la plantilla del informe.</div>;
    }

    return (
        <div className="flex h-full flex-col">
            {/* Barra superior: estado de guardado + zoom + descarga */}
            <div className="z-20 flex shrink-0 items-center justify-between gap-2 border-b border-gray-200 bg-white/95 px-2 py-2 backdrop-blur">
                <span className="hidden text-sm font-semibold text-gray-900 sm:block">Inspección #{hireId}</span>
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    {saveState === 'saving'
                        ? (<><Loader2 size={14} className="animate-spin" /> Guardando…</>)
                        : (<><CloudCheck size={14} className="text-green-600" /> Guardado</>)}
                </span>
                <div className="flex items-center gap-1">
                    <button type="button" aria-label="Alejar" onClick={() => zoomTo(zoom - ZOOM_STEP)}
                        className="rounded-lg border border-gray-300 p-1.5 text-gray-700 active:bg-gray-100 disabled:opacity-40"
                        disabled={zoom <= MIN_ZOOM}>
                        <ZoomOut size={16} />
                    </button>
                    <button type="button" onClick={() => zoomTo(1)}
                        className="min-w-[3.2rem] rounded-lg border border-gray-300 px-1.5 py-1.5 text-xs font-medium tabular-nums text-gray-700 active:bg-gray-100">
                        {Math.round(zoom * 100)}%
                    </button>
                    <button type="button" aria-label="Acercar" onClick={() => zoomTo(zoom + ZOOM_STEP)}
                        className="rounded-lg border border-gray-300 p-1.5 text-gray-700 active:bg-gray-100 disabled:opacity-40"
                        disabled={zoom >= MAX_ZOOM}>
                        <ZoomIn size={16} />
                    </button>
                    <button type="button" aria-label="Ajustar al ancho" onClick={() => zoomTo(1)}
                        className="hidden rounded-lg border border-gray-300 p-1.5 text-gray-700 active:bg-gray-100 sm:block">
                        <Maximize size={16} />
                    </button>
                    <button type="button" onClick={download}
                        className="ml-1 flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-medium text-gray-700 active:bg-gray-100">
                        <Download size={14} /> <span className="hidden sm:inline">PDF</span>
                    </button>
                </div>
            </div>

            {/* Área de scroll + pan. touch-action: pan para permitir desplazar; el pinch lo gestionamos a mano. */}
            <div
                ref={scrollRef}
                className="relative min-h-0 flex-1 overflow-auto overscroll-contain bg-gray-200"
                style={{ touchAction: 'pan-x pan-y' }}
            >
                {status === 'loading' && (
                    <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
                        <Loader2 size={18} className="animate-spin" /> Cargando informe…
                    </div>
                )}

                <div ref={wrapRef} className="flex min-w-full flex-col items-center gap-3 p-2">
                    {pageDims.map((p) => (
                        <div key={p.num} className="relative shrink-0 bg-white shadow-md" style={{ width: p.w, height: p.h }}>
                            <canvas ref={(el) => { canvasRefs.current.set(p.num, el); }} className="block" />
                            {p.fields.map((f) => {
                                const left = f.nx * p.w;
                                const top = f.ny * p.h;
                                const width = f.nw * p.w;
                                const height = f.nh * p.h;
                                // Una línea: la fuente sigue al alto de la caja. Textarea: la caja
                                // es alta por ser multilínea, así que el tamaño va por la ESCALA
                                // (≈ una línea de ~14pt), no por el alto, o se vería enorme.
                                const fontSize = f.kind === 'textarea'
                                    ? clamp(14 * renderScale * 0.6, 9, 18)
                                    : clamp(height * 0.6, 9, 22);
                                const common = {
                                    style: { position: 'absolute' as const, left, top, width, height, fontSize },
                                    className:
                                        'box-border border border-blue-400/60 bg-blue-50/40 px-1 text-blue-950 outline-none focus:border-blue-600 focus:bg-white',
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
                    <div className="h-6" />
                </div>
            </div>
        </div>
    );
}
