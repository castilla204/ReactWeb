import { useState } from 'react';
import { GraduationCap, BadgeCheck, Expand, X } from 'lucide-react';
import { parseFormacion, type FormacionItem } from './expertPanel/formacion';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';

interface FormacionDisplayProps {
    /** JSON de la formación del experto (campo `formacion` del perfil). */
    value?: string | null;
    className?: string;
}

/** Badge "Oficial" — mismo lenguaje visual que FormacionPhotoOverlay. */
function OficialBadge() {
    return (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#e8f5ee] px-2 py-[3px] text-[11px] font-semibold leading-none text-[#0d7a4d]">
            <BadgeCheck size={12} strokeWidth={2.4} />
            Oficial
        </span>
    );
}

/** Línea de metadatos "Centro · Año", sin iconos repetidos por fila. */
function MetaLine({ centro, anio }: { centro?: string; anio?: string }) {
    const parts = [centro, anio].filter(Boolean);
    if (parts.length === 0) return null;
    return (
        <div className="mt-1 truncate text-[13px] leading-snug text-[#717171]">
            {parts.join(' · ')}
        </div>
    );
}

/**
 * Muestra la formación del experto en la ficha de servicio como señal de confianza.
 *
 * Aprovecha las dos señales que el experto ya rellena pero que antes se ignoraban:
 * la foto del título/diploma (miniatura → lightbox) y el badge de título oficial.
 * Layout adaptativo: con imágenes usa un rail de miniaturas; sin ninguna imagen
 * cae a una lista de texto limpia (sin una columna de iconos idénticos repetidos).
 */
export default function FormacionDisplay({ value, className }: FormacionDisplayProps) {
    const items = parseFormacion(value);
    const [zoom, setZoom] = useState<FormacionItem | null>(null);

    if (items.length === 0) return null;

    const hasAnyImage = items.some((it) => it.imagen);

    return (
        <section className={className} aria-labelledby="sd-formacion-heading">
            <p id="sd-formacion-heading" className="sd-section-label mb-3">
                Formación y certificaciones
            </p>

            <ul className="m-0 list-none divide-y divide-[#ededed] border-y border-[#ededed] p-0">
                {items.map((it, i) => (
                    <li
                        key={i}
                        className={`flex gap-3.5 first:pt-0 last:pb-0 ${hasAnyImage ? 'items-start py-4' : 'flex-col py-3.5'}`}
                    >
                        {hasAnyImage &&
                            (it.imagen ? (
                                <button
                                    type="button"
                                    onClick={() => setZoom(it)}
                                    aria-label={`Ver título: ${it.titulo}`}
                                    className="group relative h-[54px] w-[54px] shrink-0 overflow-hidden rounded-[10px] border border-[#e6e6e6] bg-[#f2f2f2] outline-none transition-shadow duration-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.12)] focus-visible:ring-2 focus-visible:ring-[#1C63B4]/40"
                                >
                                    <img
                                        src={it.imagen}
                                        alt=""
                                        loading="lazy"
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                                    />
                                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-[background-color,opacity] duration-200 group-hover:bg-black/35 group-hover:opacity-100 motion-reduce:transition-none">
                                        <Expand size={16} strokeWidth={2} />
                                    </span>
                                </button>
                            ) : (
                                <span
                                    aria-hidden
                                    className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-[10px] bg-[#eef3fb] text-[#1C63B4]"
                                >
                                    <GraduationCap size={22} strokeWidth={1.75} />
                                </span>
                            ))}

                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="text-sm font-medium leading-snug text-[#1c1c1c]">
                                    {it.titulo}
                                </span>
                                {it.esOficial && <OficialBadge />}
                            </div>
                            <MetaLine centro={it.centro} anio={it.anio} />
                        </div>
                    </li>
                ))}
            </ul>

            <Dialog open={!!zoom} onOpenChange={(open) => !open && setZoom(null)}>
                <DialogContent
                    className="!fixed !inset-0 !left-0 !top-0 z-[100] flex h-[100dvh] max-h-[100dvh] w-full !max-w-none !translate-x-0 !translate-y-0 flex-col gap-0 rounded-none border-0 bg-[#0a0a0a] p-0 shadow-none duration-200"
                    overlayClassName="bg-black/90"
                    hideCloseButton
                    onEscapeKeyDown={() => setZoom(null)}
                >
                    <DialogTitle className="sr-only">{zoom?.titulo ?? 'Título'}</DialogTitle>
                    <DialogDescription className="sr-only">
                        Imagen del título o certificación del experto
                    </DialogDescription>

                    <header className="flex shrink-0 items-center justify-between px-4 py-3 text-white">
                        <span className="min-w-0 truncate text-sm font-medium">{zoom?.titulo}</span>
                        <button
                            type="button"
                            onClick={() => setZoom(null)}
                            aria-label="Cerrar"
                            className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                        >
                            <X className="h-5 w-5" strokeWidth={2} />
                        </button>
                    </header>

                    <div className="flex min-h-0 flex-1 items-center justify-center p-4 sm:p-8">
                        {zoom?.imagen ? (
                            <img
                                src={zoom.imagen}
                                alt={zoom.titulo}
                                className="max-h-full max-w-full rounded-lg object-contain"
                                draggable={false}
                            />
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>
        </section>
    );
}
