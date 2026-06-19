import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, CalendarClock, AlertTriangle, Loader2 } from 'lucide-react';
import { API_CONFIG } from '../config/api';
import SlotPicker, { type ChosenSlot } from '../components/SlotPicker';
import CheckoutLocationPicker, { type CheckoutLocationData } from '../components/CheckoutLocationPicker';

// Página PÚBLICA del magic link del vendedor. Sin login: el token de la URL es la credencial.
// El vendedor elige día/hora (calendario del experto, hasta el tope de días que fijó el cliente)
// y el lugar (mapa dentro del rango, igual que el checkout), y confirma la cita.
interface Context {
    serviceId: number;
    alreadyBooked: boolean;
    expired?: boolean;
    listingUrl?: string | null;
    maxDays: number;
    expertLatitude?: string | null;
    expertLongitude?: string | null;
    expertCountry?: string | null;
    workRadiusKm?: number | null;
}

export default function SellerBookingPage() {
    const { token } = useParams<{ token: string }>();
    const [status, setStatus] = useState<'loading' | 'invalid' | 'ok'>('loading');
    const [ctx, setCtx] = useState<Context | null>(null);
    const [slot, setSlot] = useState<ChosenSlot | null>(null);
    const [chosenLocation, setChosenLocation] = useState<CheckoutLocationData | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [windowInfo, setWindowInfo] = useState<{
        fromYmd: string; days: number; windowExtended: boolean; hasAvailability: boolean;
    } | null>(null);

    const base = useMemo(
        () => (token ? `${API_CONFIG.baseUrl}/api/seller-booking/${encodeURIComponent(token)}` : ''),
        [token],
    );
    const isWorkshop = (ctx?.workRadiusKm ?? 0) === 0;

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
                // Cargar la ventana efectiva (objetivo vs ampliada) del experto.
                try {
                    const wr = await fetch(`${base}/window`);
                    if (wr.ok && !cancelled) setWindowInfo(await wr.json());
                } catch { /* sin ventana: caemos al fallback de abajo */ }
            } catch {
                if (!cancelled) setStatus('invalid');
            }
        })();
        return () => { cancelled = true; };
    }, [token, base]);

    const confirm = async () => {
        if (!slot) { setError('Elige un día y una hora.'); return; }
        if (!isWorkshop && !chosenLocation) { setError('Indica en el mapa dónde está el vehículo.'); return; }
        setError(null);
        setSubmitting(true);
        try {
            const res = await fetch(`${base}/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startsAtUtc: slot.startUtc,
                    endsAtUtc: slot.endUtc,
                    location: chosenLocation?.location ?? null,
                    latitude: chosenLocation?.latitude ?? null,
                    longitude: chosenLocation?.longitude ?? null,
                    doorNumber: chosenLocation?.doorNumber ?? null,
                    siteDetails: chosenLocation?.siteDetails ?? null,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.message || 'No se pudo confirmar la cita.');
            }
            setDone(true);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo confirmar la cita.');
            // Recargar el contexto por si el enlace caducó o la cita ya estaba reservada,
            // para que la UI transicione al estado correcto en vez de quedarse en el formulario.
            try {
                const r = await fetch(base);
                if (r.ok) setCtx(await r.json());
            } catch { /* ignore */ }
        } finally {
            setSubmitting(false);
        }
    };

    const slotConstraints = useMemo(() => {
        if (!windowInfo) return { minLeadDays: 0, windowDays: ctx?.maxDays ?? 14 };
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const [y, m, d] = windowInfo.fromYmd.split('-').map(Number);
        const from = new Date(y, m - 1, d);
        const minLeadDays = Math.max(0, Math.round((from.getTime() - today.getTime()) / 86400000));
        return { minLeadDays, windowDays: windowInfo.days };
    }, [windowInfo, ctx?.maxDays]);

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
                        <p style={{ margin: 0, fontSize: 14 }}>Este enlace no es válido o ya ha caducado. Pide al comprador que te lo reenvíe.</p>
                    </div>
                )}

                {status === 'ok' && (ctx?.alreadyBooked || done) && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <CheckCircle2 size={20} style={{ color: '#1F9D55', flexShrink: 0 }} />
                        <div>
                            <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600 }}>Cita confirmada</p>
                            <p style={{ margin: 0, fontSize: 14, color: '#6B7280' }}>El técnico acudirá en la fecha elegida. ¡Gracias!</p>
                        </div>
                    </div>
                )}

                {status === 'ok' && ctx?.expired && !ctx.alreadyBooked && !done && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <AlertTriangle size={20} style={{ color: '#D32F2F', flexShrink: 0 }} />
                        <p style={{ margin: 0, fontSize: 14 }}>El plazo para reservar la cita ha caducado. Se ha devuelto el importe al comprador.</p>
                    </div>
                )}

                {status === 'ok' && ctx && !ctx.alreadyBooked && !ctx.expired && !done
                    && windowInfo && !windowInfo.hasAvailability && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <AlertTriangle size={20} style={{ color: '#D32F2F', flexShrink: 0 }} />
                        <p style={{ margin: 0, fontSize: 14 }}>
                            El técnico no tiene disponibilidad en el plazo. Se devolverá el importe al comprador.
                        </p>
                    </div>
                )}

                {status === 'ok' && ctx && !ctx.alreadyBooked && !ctx.expired && !done
                    && windowInfo?.hasAvailability !== false && (
                    <div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}>
                            <CalendarClock size={20} style={{ color: '#1C63B4', flexShrink: 0 }} />
                            <div>
                                <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600 }}>Elige cuándo y dónde ver el vehículo</p>
                                <p style={{ margin: 0, fontSize: 14, color: '#6B7280' }}>
                                    Un comprador ha <strong>pagado</strong> una inspección profesional. Elige un hueco del técnico y dónde está el coche.
                                </p>
                            </div>
                        </div>

                        {windowInfo?.windowExtended && (
                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 12, background: '#FFF7E6', border: '0.5px solid #F0D38A', borderRadius: 10, padding: '10px 12px' }}>
                                <AlertTriangle size={16} style={{ color: '#B8860B', flexShrink: 0, marginTop: 1 }} />
                                <p style={{ margin: 0, fontSize: 13, color: '#7A5C00' }}>
                                    El técnico no tiene huecos en los próximos 7 días; te mostramos su disponibilidad ampliada.
                                </p>
                            </div>
                        )}

                        <SlotPicker
                            serviceId={ctx.serviceId}
                            selected={slot}
                            onSelect={setSlot}
                            slotsBaseUrl={base}
                            windowDays={slotConstraints.windowDays}
                            minLeadDays={slotConstraints.minLeadDays}
                            sectionTitle="Fecha y hora"
                        />

                        <div style={{ marginTop: 14 }}>
                            {isWorkshop ? (
                                <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
                                    La inspección se hará en el taller del experto.
                                </p>
                            ) : (
                                <CheckoutLocationPicker
                                    expertLatitude={ctx.expertLatitude ?? undefined}
                                    expertLongitude={ctx.expertLongitude ?? undefined}
                                    expertCountry={ctx.expertCountry ?? undefined}
                                    expertRange={ctx.workRadiusKm ?? undefined}
                                    workRadiusKm={ctx.workRadiusKm ?? undefined}
                                    onChange={setChosenLocation}
                                />
                            )}
                        </div>

                        {error && <p style={{ color: '#D32F2F', fontSize: 13, margin: '10px 0 0' }}>{error}</p>}

                        <button
                            type="button"
                            onClick={confirm}
                            disabled={submitting || !slot || (!isWorkshop && !chosenLocation)}
                            style={{
                                marginTop: 14, width: '100%', background: '#1C63B4', color: '#fff',
                                border: 'none', borderRadius: 10, padding: 12, fontSize: 15, fontWeight: 600,
                                cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.7 : 1,
                            }}
                        >
                            {submitting ? 'Confirmando…' : 'Confirmar cita'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
