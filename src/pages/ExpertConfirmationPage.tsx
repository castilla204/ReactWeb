import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, CalendarClock, MapPin, AlertTriangle, Loader2 } from 'lucide-react';
import { API_CONFIG } from '../config/api';

// Página PÚBLICA de confirmación del experto. Sin login: el token de la URL es la credencial.
// La cita YA está fijada (fecha/hora/lugar). El experto solo aprueba o rechaza.
// Espejo simplificado de SellerBookingPage: sin SlotPicker ni mapa, sin datos del cliente.
interface Context {
    serviceId: number;
    startsAtUtc: string;
    endsAtUtc: string;
    location?: string | null;
    doorNumber?: string | null;
    siteDetails?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    deadline?: string | null;
    expired?: boolean;
}

type Done = 'approved' | 'rejected' | null;

export default function ExpertConfirmationPage() {
    const { token } = useParams<{ token: string }>();
    const [status, setStatus] = useState<'loading' | 'invalid' | 'ok'>('loading');
    const [ctx, setCtx] = useState<Context | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState<Done>(null);
    const [rejectConfirming, setRejectConfirming] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const base = useMemo(
        () => (token ? `${API_CONFIG.baseUrl}/api/expert-confirmation/${encodeURIComponent(token)}` : ''),
        [token],
    );

    const reload = async () => {
        try {
            const r = await fetch(base);
            if (r.ok) setCtx(await r.json());
        } catch { /* ignore */ }
    };

    useEffect(() => {
        if (!token) { setStatus('invalid'); return; }
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(base);
                if (!res.ok) throw new Error('invalid');
                const data: Context = await res.json();
                if (cancelled) return;
                setCtx(data);
                setStatus('ok');
            } catch {
                if (!cancelled) setStatus('invalid');
            }
        })();
        return () => { cancelled = true; };
    }, [token, base]);

    // Fecha/hora legible (es-ES) a partir de startsAtUtc.
    const prettyDate = useMemo(() => {
        if (!ctx?.startsAtUtc) return '';
        const d = new Date(ctx.startsAtUtc);
        if (Number.isNaN(d.getTime())) return '';
        return d.toLocaleString('es-ES', {
            weekday: 'long', day: 'numeric', month: 'long',
            hour: '2-digit', minute: '2-digit',
        });
    }, [ctx?.startsAtUtc]);

    const prettyPlace = useMemo(() => {
        if (!ctx) return '';
        const parts = [ctx.location, ctx.doorNumber, ctx.siteDetails].filter(Boolean);
        return parts.join(' · ');
    }, [ctx]);

    const approve = async () => {
        setError(null);
        setSubmitting(true);
        try {
            const res = await fetch(`${base}/approve`, { method: 'POST' });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                if (res.status === 409) {
                    // Ya no está pendiente: recargamos el contexto para transicionar a la pantalla correcta.
                    await reload();
                    throw new Error('La cita ya no está pendiente de confirmación.');
                }
                // p.ej. 402 captura fallida → mostramos el mensaje del backend.
                throw new Error(data?.message || 'No se pudo confirmar la cita.');
            }
            setDone('approved');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo confirmar la cita.');
        } finally {
            setSubmitting(false);
        }
    };

    // Rechazo en 2 pasos: cancela la cita y devuelve el 100% al comprador.
    const reject = async () => {
        setError(null);
        setRejecting(true);
        try {
            const res = await fetch(`${base}/reject`, { method: 'POST' });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                if (res.status === 409) {
                    await reload();
                    throw new Error('La cita ya no está pendiente de confirmación.');
                }
                throw new Error(data?.message || 'No se pudo rechazar la cita.');
            }
            setDone('rejected');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo rechazar la cita.');
        } finally {
            setRejecting(false);
            setRejectConfirming(false);
        }
    };

    const card: React.CSSProperties = {
        background: '#fff', border: '0.5px solid #DCE3EC', borderRadius: 16,
        maxWidth: 560, width: '100%', padding: 24,
    };

    return (
        <div style={{ minHeight: '100dvh', background: '#F3F6FA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={card}>
                <strong style={{ fontSize: 18, color: '#1C63B4', display: 'block', marginBottom: 12 }}>Inspecciono</strong>

                {status === 'loading' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6B7280', fontSize: 14 }}>
                        <Loader2 size={18} className="animate-spin" /> Comprobando el enlace…
                    </div>
                )}

                {status === 'invalid' && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <AlertTriangle size={20} style={{ color: '#D32F2F', flexShrink: 0 }} />
                        <p style={{ margin: 0, fontSize: 14 }}>Este enlace no es válido o la cita ya se ha resuelto.</p>
                    </div>
                )}

                {status === 'ok' && done === 'approved' && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <CheckCircle2 size={20} style={{ color: '#1F9D55', flexShrink: 0 }} />
                        <div>
                            <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600 }}>Cita confirmada</p>
                            <p style={{ margin: 0, fontSize: 14, color: '#6B7280' }}>
                                Te esperamos el {prettyDate}. ¡Gracias!
                            </p>
                        </div>
                    </div>
                )}

                {status === 'ok' && done === 'rejected' && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <CheckCircle2 size={20} style={{ color: '#1F9D55', flexShrink: 0 }} />
                        <div>
                            <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600 }}>Cita rechazada</p>
                            <p style={{ margin: 0, fontSize: 14, color: '#6B7280' }}>
                                Has rechazado la cita. Se ha devuelto el importe al comprador.
                            </p>
                        </div>
                    </div>
                )}

                {status === 'ok' && !done && ctx?.expired && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <AlertTriangle size={20} style={{ color: '#D32F2F', flexShrink: 0 }} />
                        <p style={{ margin: 0, fontSize: 14 }}>El plazo para confirmar ha caducado.</p>
                    </div>
                )}

                {status === 'ok' && ctx && !done && !ctx.expired && (
                    <div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}>
                            <CalendarClock size={20} style={{ color: '#1C63B4', flexShrink: 0 }} />
                            <div>
                                <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600 }}>Confirma tu cita de inspección</p>
                                <p style={{ margin: 0, fontSize: 14, color: '#6B7280' }}>
                                    Un comprador ha reservado una inspección contigo. Revisa los datos y confirma si podrás atenderla.
                                </p>
                            </div>
                        </div>

                        {/* Resumen de la cita (fecha/hora + lugar). */}
                        <div style={{ background: '#F7FAFD', border: '0.5px solid #DCE3EC', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <CalendarClock size={18} style={{ color: '#1C63B4', flexShrink: 0, marginTop: 1 }} />
                                <div>
                                    <p style={{ margin: '0 0 2px', fontSize: 12, color: '#6B7280' }}>Fecha y hora</p>
                                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, textTransform: 'capitalize' }}>{prettyDate || 'Por determinar'}</p>
                                </div>
                            </div>
                            {prettyPlace && (
                                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 12 }}>
                                    <MapPin size={18} style={{ color: '#1C63B4', flexShrink: 0, marginTop: 1 }} />
                                    <div>
                                        <p style={{ margin: '0 0 2px', fontSize: 12, color: '#6B7280' }}>Lugar</p>
                                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{prettyPlace}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {error && <p style={{ color: '#D32F2F', fontSize: 13, margin: '0 0 10px' }}>{error}</p>}

                        <button
                            type="button"
                            onClick={approve}
                            disabled={submitting || rejecting}
                            style={{
                                width: '100%', background: '#1C63B4', color: '#fff',
                                border: 'none', borderRadius: 10, padding: 12, fontSize: 15, fontWeight: 600,
                                cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.7 : 1,
                            }}
                        >
                            {submitting ? 'Confirmando…' : 'Confirmar cita'}
                        </button>

                        {/* "No podré atender la cita": acción secundaria sutil. Confirmación en 2 pasos
                            porque dispara la cancelación + devolución al comprador. */}
                        {!rejectConfirming ? (
                            <button
                                type="button"
                                onClick={() => { setError(null); setRejectConfirming(true); }}
                                disabled={submitting || rejecting}
                                style={{
                                    marginTop: 10, width: '100%', background: 'transparent', color: '#6B7280',
                                    border: 'none', padding: 8, fontSize: 13,
                                    cursor: submitting ? 'default' : 'pointer', textDecoration: 'underline',
                                }}
                            >
                                No podré atender la cita
                            </button>
                        ) : (
                            <div style={{ marginTop: 12, background: '#FBF1F1', border: '0.5px solid #F0C9C9', borderRadius: 10, padding: '12px 14px' }}>
                                <p style={{ margin: '0 0 10px', fontSize: 13, color: '#7A2E2E' }}>
                                    Se cancelará la cita y el comprador recibirá el 100%. ¿Confirmar?
                                </p>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        type="button"
                                        onClick={reject}
                                        disabled={rejecting}
                                        style={{
                                            flex: 1, background: '#D32F2F', color: '#fff', border: 'none', borderRadius: 8,
                                            padding: 10, fontSize: 14, fontWeight: 600,
                                            cursor: rejecting ? 'default' : 'pointer', opacity: rejecting ? 0.7 : 1,
                                        }}
                                    >
                                        {rejecting ? 'Rechazando…' : 'Sí, rechazar'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRejectConfirming(false)}
                                        disabled={rejecting}
                                        style={{
                                            flex: 1, background: '#fff', color: '#374151', border: '0.5px solid #DCE3EC',
                                            borderRadius: 8, padding: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                                        }}
                                    >
                                        Volver
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
