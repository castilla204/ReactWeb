import { useMemo, useState } from 'react';
import { GraduationCap, Plus, Pencil, BadgeCheck, X } from 'lucide-react';
import { parseFormacion } from './formacion';
import FormacionEditor from './FormacionEditor';
import { useIsMobile } from '../../hooks/useIsMobile';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '../ui/drawer';

interface FormacionFieldProps {
    /** JSON de la formación (lo que viene del perfil). */
    value?: string | null;
    /** Devuelve el nuevo JSON (ya limpio) al cambiar. */
    onChange: (json: string) => void;
}

/**
 * Campo compacto de "Formación" para el formulario de perfil.
 *
 * En vez de inlinear el editor completo (que ocupaba mucho), muestra una sola
 * fila-resumen y abre el editor en un overlay:
 *   · Desktop (≥768px): popup centrado (Radix Dialog).
 *   · Mobile  (<768px): drawer inferior (Vaul).
 *
 * El editor escribe en `onChange` en vivo, así que cerrar el overlay no
 * "guarda" nada extra: el JSON ya está sincronizado con el formulario padre,
 * que persiste todo al pulsar Guardar.
 */
export default function FormacionField({ value, onChange }: FormacionFieldProps) {
    const [open, setOpen] = useState(false);
    const isMobile = useIsMobile();

    const items = useMemo(() => parseFormacion(value), [value]);
    const count = items.length;
    const oficiales = items.filter((i) => i.esOficial).length;

    const subtitle =
        count === 0
            ? 'Añade tus estudios o cursos como señal de confianza.'
            : `${count} ${count === 1 ? 'añadida' : 'añadidas'}` +
              (oficiales > 0 ? ` · ${oficiales} ${oficiales === 1 ? 'oficial' : 'oficiales'}` : '');

    const close = () => setOpen(false);

    // Cuerpo compartido por Dialog (desktop) y Drawer (mobile). Es una función
    // normal (no un React.FC declarado aquí) para no remontar el editor en cada
    // render — mismo motivo que en SearchDashboardFiltersSheet.
    const renderBody = () => (
        <div
            style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                padding: isMobile ? '8px 16px 16px' : '12px 20px 4px',
            }}
        >
            <FormacionEditor value={value} onChange={onChange} hideHeader />
        </div>
    );

    const footer = (
        <div
            style={{
                borderTop: '0.5px solid hsl(var(--line))',
                padding: '12px 16px max(12px, env(safe-area-inset-bottom, 0px))',
                background: 'hsl(var(--surface))',
            }}
        >
            <button
                type="button"
                onClick={close}
                style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    border: 'none',
                    borderRadius: 12,
                    padding: '12px 16px',
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'hsl(var(--surface))',
                    background: 'hsl(var(--ink-strong))',
                    cursor: 'pointer',
                }}
            >
                Listo
            </button>
        </div>
    );

    return (
        <>
            {/* Fila-resumen compacta que abre el editor */}
            <button
                type="button"
                onClick={() => setOpen(true)}
                style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    border: '0.5px solid hsl(var(--line))',
                    borderRadius: 12,
                    padding: '12px 14px',
                    background: 'hsl(var(--surface))',
                    cursor: 'pointer',
                    textAlign: 'left',
                }}
            >
                <span
                    style={{
                        display: 'flex',
                        width: 36,
                        height: 36,
                        flexShrink: 0,
                        borderRadius: 10,
                        background: 'hsl(var(--surface-tinted))',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <GraduationCap size={18} color="hsl(var(--ink-muted))" />
                </span>

                <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: 14, color: 'hsl(var(--ink-strong))' }}>Formación</strong>
                        <span style={{ fontSize: 12, color: 'hsl(var(--ink-muted))' }}>(opcional)</span>
                        {oficiales > 0 && (
                            <span
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: 'hsl(var(--success))',
                                    background: 'hsl(var(--success-tint))',
                                    borderRadius: 999,
                                    padding: '1px 7px',
                                }}
                            >
                                <BadgeCheck size={12} /> Oficial
                            </span>
                        )}
                    </span>
                    <span
                        style={{
                            display: 'block',
                            fontSize: 12,
                            color: 'hsl(var(--ink-muted))',
                            marginTop: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {subtitle}
                    </span>
                </span>

                <span
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        flexShrink: 0,
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'hsl(var(--brand))',
                    }}
                >
                    {count === 0 ? (
                        <>
                            <Plus size={16} /> Añadir
                        </>
                    ) : (
                        <>
                            <Pencil size={14} /> Editar
                        </>
                    )}
                </span>
            </button>

            {isMobile ? (
                // shouldScaleBackground={false}: evita el scale del body de Vaul.
                // autoFocus: deja que el foco caiga en el contenido (X de cerrar)
                // y no quede bajo aria-hidden. Mismo patrón que el sheet de filtros.
                <Drawer open={open} onOpenChange={setOpen} shouldScaleBackground={false} autoFocus>
                    <DrawerContent className="flex max-h-[88dvh] flex-col rounded-t-[20px] border-t border-line bg-white">
                        <DrawerHeader className="flex flex-row items-center justify-between space-y-0 border-b border-line px-4 py-3 text-left">
                            <DrawerTitle className="text-base font-semibold text-ink-strong">
                                Formación
                            </DrawerTitle>
                            <button
                                type="button"
                                aria-label="Cerrar"
                                onClick={close}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-surface-tinted hover:text-ink-strong"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </DrawerHeader>
                        {renderBody()}
                        {footer}
                    </DrawerContent>
                </Drawer>
            ) : (
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="flex max-h-[85vh] w-full max-w-lg flex-col gap-0 overflow-hidden p-0">
                        <DialogTitle className="border-b border-line px-5 py-3.5 text-base font-semibold text-ink-strong">
                            Formación
                        </DialogTitle>
                        {renderBody()}
                        {footer}
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
