import type { CSSProperties } from 'react';
import { useState } from 'react';
import { GraduationCap, Plus, Trash2, ImagePlus, BadgeCheck, X } from 'lucide-react';
import {
    type FormacionItem,
    parseFormacion,
    stringifyFormacion,
    compressImageToDataUrl,
} from './formacion';

interface FormacionEditorProps {
    /** JSON inicial de la formación (lo que viene del perfil). */
    value?: string | null;
    /** Devuelve el nuevo JSON (ya limpio) al cambiar. */
    onChange: (json: string) => void;
    /**
     * Oculta la cabecera (icono + título "Formación"). Se usa cuando el editor
     * se abre dentro de un popup/drawer que ya muestra ese título, para no
     * duplicarlo. La descripción de ayuda se mantiene.
     */
    hideHeader?: boolean;
}

// Editor OPCIONAL de formación. El experto añade los estudios/cursos/experiencia que
// quiera, marca si es título oficial y adjunta una imagen del título o del centro.
// Mantiene estado local para mostrar filas en blanco mientras se escriben.
export default function FormacionEditor({ value, onChange, hideHeader = false }: FormacionEditorProps) {
    const [items, setItems] = useState<FormacionItem[]>(() => parseFormacion(value));

    const commit = (next: FormacionItem[]) => {
        setItems(next);
        onChange(stringifyFormacion(next));
    };
    const setField = (i: number, patch: Partial<FormacionItem>) =>
        commit(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
    const add = () => commit([...items, { titulo: '' }]);
    const remove = (i: number) => commit(items.filter((_, idx) => idx !== i));

    const onPickImage = async (i: number, file: File | null) => {
        if (!file) return;
        try {
            const dataUrl = await compressImageToDataUrl(file);
            setField(i, { imagen: dataUrl });
        } catch {
            /* ignore */
        }
    };

    return (
        <div className="pf-formacion">
            {!hideHeader && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <GraduationCap size={18} />
                    <strong style={{ fontSize: 14 }}>Formación</strong>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>(opcional)</span>
                </div>
            )}
            <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 10px' }}>
                Añade tus estudios, cursos o experiencia. Marca si es título oficial y adjunta una imagen
                del título o del centro. Se mostrará a los clientes como señal de confianza. No hace falta
                acreditarlo con ninguna entidad.
            </p>

            {items.length === 0 && (
                <p style={{ fontSize: 13, color: '#9AA7B4', margin: '0 0 8px' }}>
                    Aún no has añadido formación.
                </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map((it, i) => (
                    <div
                        key={i}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            border: '0.5px solid #DCE3EC',
                            borderRadius: 12,
                            padding: 12,
                            background: '#FCFDFE',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                                value={it.titulo}
                                onChange={(e) => setField(i, { titulo: e.target.value })}
                                placeholder={it.esOficial ? 'Nombre oficial del título' : 'Título, curso o experiencia'}
                                style={{ ...inputStyle, flex: 1 }}
                            />
                            <button
                                type="button"
                                onClick={() => remove(i)}
                                aria-label="Quitar formación"
                                style={{ border: 'none', background: 'transparent', color: '#9AA7B4', cursor: 'pointer', padding: 4 }}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 8 }}>
                            <input
                                value={it.centro ?? ''}
                                onChange={(e) => setField(i, { centro: e.target.value })}
                                placeholder="Centro / institución (opcional)"
                                style={inputStyle}
                            />
                            <input
                                value={it.anio ?? ''}
                                onChange={(e) => setField(i, { anio: e.target.value })}
                                placeholder="Año"
                                style={inputStyle}
                            />
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={!!it.esOficial}
                                onChange={(e) => setField(i, { esOficial: e.target.checked })}
                            />
                            <BadgeCheck size={16} style={{ color: it.esOficial ? '#1C9D55' : '#9AA7B4' }} />
                            Es un título oficial (universidad, FP, certificado profesional)
                        </label>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {it.imagen ? (
                                <div style={{ position: 'relative' }}>
                                    <img
                                        src={it.imagen}
                                        alt="Título / centro"
                                        style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '0.5px solid #DCE3EC' }}
                                    />
                                    <button
                                        type="button"
                                        aria-label="Quitar imagen"
                                        onClick={() => setField(i, { imagen: undefined })}
                                        style={{
                                            position: 'absolute', top: -8, right: -8, background: 'rgba(0,0,0,.6)',
                                            color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                        }}
                                    >
                                        <X size={13} />
                                    </button>
                                </div>
                            ) : (
                                <label
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13,
                                        border: '0.5px dashed #CBD5E1', borderRadius: 8, padding: '8px 12px',
                                        color: '#6B7280', cursor: 'pointer', background: '#fff',
                                    }}
                                >
                                    <ImagePlus size={16} /> Añadir imagen del título o centro
                                    <input
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={(e) => onPickImage(i, e.target.files?.[0] ?? null)}
                                    />
                                </label>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={add}
                style={{
                    marginTop: 12,
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    border: '0.5px solid #DCE3EC', borderRadius: 10, padding: '8px 12px',
                    background: '#fff', fontSize: 13, cursor: 'pointer',
                }}
            >
                <Plus size={16} /> Añadir formación
            </button>
        </div>
    );
}

const inputStyle: CSSProperties = {
    width: '100%',
    border: '0.5px solid #CBD5E1',
    borderRadius: 8,
    padding: '8px 10px',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
};
