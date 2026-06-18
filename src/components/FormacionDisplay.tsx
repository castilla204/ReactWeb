import { GraduationCap, BadgeCheck } from 'lucide-react';
import { parseFormacion } from './expertPanel/formacion';

interface FormacionDisplayProps {
    /** JSON de la formación del experto (campo `formacion` del perfil). */
    value?: string | null;
    className?: string;
}

// Muestra la formación del experto al cliente como señal positiva.
// Si el experto no ha añadido nada, no renderiza nada.
export default function FormacionDisplay({ value, className }: FormacionDisplayProps) {
    const items = parseFormacion(value);
    if (items.length === 0) return null;

    return (
        <div className={className} style={{ marginTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <GraduationCap size={18} style={{ color: '#1C63B4' }} />
                <strong style={{ fontSize: 15 }}>Formación</strong>
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map((it, i) => (
                    <li
                        key={i}
                        style={{
                            display: 'flex',
                            gap: 12,
                            alignItems: 'flex-start',
                            border: '0.5px solid #E5EAF0',
                            borderRadius: 12,
                            padding: 10,
                        }}
                    >
                        {it.imagen && (
                            <img
                                src={it.imagen}
                                alt={it.titulo}
                                style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0, border: '0.5px solid #E5EAF0' }}
                            />
                        )}
                        <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 500, fontSize: 14 }}>{it.titulo}</span>
                                {it.esOficial && (
                                    <span
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 4,
                                            fontSize: 11, fontWeight: 500, color: '#0F6E56',
                                            background: '#E1F5EE', borderRadius: 999, padding: '2px 8px',
                                        }}
                                    >
                                        <BadgeCheck size={13} /> Título oficial
                                    </span>
                                )}
                            </div>
                            {(it.centro || it.anio) && (
                                <div style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>
                                    {[it.centro, it.anio].filter(Boolean).join(' · ')}
                                </div>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
