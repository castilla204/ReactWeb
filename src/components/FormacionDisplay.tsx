import { useState } from 'react';
import { Award, BadgeCheck, Expand, X } from 'lucide-react';
import { parseFormacion, type FormacionItem } from './expertPanel/formacion';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import { cn } from '../lib/utils';

interface FormacionDisplayProps {
    /** JSON de la formación del experto (campo `formacion` del perfil). */
    value?: string | null;
    /** ficha = bloque de credenciales en la ficha de servicio (desktop/móvil) */
    variant?: 'default' | 'ficha';
    /** Título visible (p. ej. pestaña Acerca del servicio en móvil) */
    showHeading?: boolean;
    className?: string;
}

function FormacionLightbox({
    item,
    onClose,
}: {
    item: FormacionItem | null;
    onClose: () => void;
}) {
    return (
        <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                className="!fixed !inset-0 !left-0 !top-0 z-[100] flex h-[100dvh] max-h-[100dvh] w-full !max-w-none !translate-x-0 !translate-y-0 flex-col gap-0 rounded-none border-0 bg-ink-strong p-0 shadow-none duration-200"
                overlayClassName="bg-black/90"
                hideCloseButton
                onEscapeKeyDown={onClose}
            >
                <DialogTitle className="sr-only">{item?.titulo ?? 'Título'}</DialogTitle>
                <DialogDescription className="sr-only">
                    Imagen del título o certificación del experto
                </DialogDescription>

                <header className="flex shrink-0 items-center justify-between px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] text-white">
                    <span className="min-w-0 truncate text-sm font-medium">{item?.titulo}</span>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <X className="h-5 w-5" strokeWidth={2} />
                    </button>
                </header>

                <div className="flex min-h-0 flex-1 items-center justify-center p-4 sm:p-8">
                    {item?.imagen ? (
                        <img
                            src={item.imagen}
                            alt={item.titulo}
                            className="max-h-full max-w-full rounded-lg object-contain"
                            draggable={false}
                        />
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Badge "Oficial" — variante legacy (default). En ficha se usa texto inline.
 */
function OficialBadge() {
    return (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-caption font-medium leading-none text-brand ring-1 ring-brand/10">
            <BadgeCheck size={12} strokeWidth={2.2} />
            Oficial
        </span>
    );
}

function MetaLine({
    centro,
    anio,
    className,
}: {
    centro?: string;
    anio?: string;
    className?: string;
}) {
    const parts = [centro, anio].filter(Boolean);
    if (parts.length === 0) return null;
    return (
        <p className={cn('mt-0.5 text-meta leading-snug text-ink-muted', className)}>
            {parts.join(' · ')}
        </p>
    );
}

function FichaCredentialRow({
    item,
    onOpenImage,
}: {
    item: FormacionItem;
    onOpenImage: (item: FormacionItem) => void;
}) {
    const metaParts = [item.centro, item.esOficial ? 'Titulación oficial' : null].filter(Boolean);

    return (
        <li className="sd-formacion-ficha-item py-3 first:pt-0 last:pb-0">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6">
                <p className="text-sm font-medium leading-snug text-ink">{item.titulo}</p>
                {item.anio ? (
                    <span className="shrink-0 text-meta tabular-nums leading-snug text-ink-muted">
                        {item.anio}
                    </span>
                ) : null}
            </div>
            {metaParts.length > 0 ? (
                <p className="mt-0.5 text-meta leading-snug text-ink-muted">{metaParts.join(' · ')}</p>
            ) : null}
            {item.imagen ? (
                <button
                    type="button"
                    onClick={() => onOpenImage(item)}
                    className="sd-formacion-ficha-doc-link mt-1 text-meta text-ink-muted underline-offset-2 hover:text-ink hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                    Ver acreditación
                </button>
            ) : null}
        </li>
    );
}

/**
 * Muestra la formación del experto en la ficha de servicio como señal de confianza.
 */
export default function FormacionDisplay({
    value,
    variant = 'default',
    showHeading = false,
    className,
}: FormacionDisplayProps) {
    const items = parseFormacion(value);
    const [zoom, setZoom] = useState<FormacionItem | null>(null);
    const isFicha = variant === 'ficha';

    if (items.length === 0) return null;

    if (isFicha) {
        return (
            <section
                className={cn('sd-formacion-ficha', className)}
                aria-label={showHeading ? undefined : 'Formación acreditada'}
                aria-labelledby={showHeading ? 'sd-formacion-heading' : undefined}
            >
                {showHeading ? (
                    <h2 id="sd-formacion-heading" className="sd-section-label mb-3">
                        Formación acreditada
                    </h2>
                ) : null}
                <ul className="m-0 list-none space-y-0 divide-y divide-line p-0">
                    {items.map((it, i) => (
                        <FichaCredentialRow key={i} item={it} onOpenImage={setZoom} />
                    ))}
                </ul>
                <FormacionLightbox item={zoom} onClose={() => setZoom(null)} />
            </section>
        );
    }

    return (
        <section className={className} aria-labelledby="sd-formacion-heading">
            <p id="sd-formacion-heading" className="sd-section-label mb-3">
                Formación y certificaciones
            </p>

            <ul className="m-0 list-none divide-y divide-line border-y border-line p-0">
                {items.map((it, i) => (
                    <li
                        key={i}
                        className="flex items-start gap-3.5 py-4 first:pt-0 last:pb-0"
                    >
                        {it.imagen ? (
                            <button
                                type="button"
                                onClick={() => setZoom(it)}
                                aria-label={`Ver título: ${it.titulo}`}
                                className="group relative h-[54px] w-[54px] shrink-0 overflow-hidden rounded-[10px] border border-line bg-surface-tinted outline-none transition-shadow duration-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.12)] focus-visible:ring-2 focus-visible:ring-brand/40"
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
                                className="flex h-[54px] w-[54px] shrink-0 flex-col items-center justify-center gap-[3px] overflow-hidden rounded-[10px] border border-line bg-surface-tinted"
                            >
                                <span className="h-1 w-[30px] rounded-full bg-line" />
                                <span className="h-[3px] w-[22px] rounded-full bg-line-soft" />
                                <Award size={15} strokeWidth={2} className="mt-0.5 text-warning" />
                            </span>
                        )}

                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="text-sm font-medium leading-snug text-ink-strong">
                                    {it.titulo}
                                </span>
                                {it.esOficial && <OficialBadge />}
                            </div>
                            <MetaLine centro={it.centro} anio={it.anio} />
                        </div>
                    </li>
                ))}
            </ul>

            <FormacionLightbox item={zoom} onClose={() => setZoom(null)} />
        </section>
    );
}
