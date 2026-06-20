import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, CalendarClock, AlertTriangle, Loader2 } from 'lucide-react';
import { API_CONFIG } from '../config/api';
import SlotPicker, { type ChosenSlot } from '../components/SlotPicker';
import CheckoutLocationPicker, { type CheckoutLocationData } from '../components/CheckoutLocationPicker';
import { cn } from '../lib/utils';
import { SD_CHECKOUT_DESKTOP_CARD_CLASS } from '../constants/homepageTypography';

// Página PÚBLICA del magic link del vendedor. Sin login: el token de la URL es la credencial.
// El vendedor elige día/hora (calendario del experto, hasta el tope de días que fijó el cliente)
// y el lugar (mapa dentro del rango, igual que el checkout), y confirma la cita.
// 🎨 Estética unificada con el checkout del cliente: tarjeta shadcn (SD_CHECKOUT_*), calendario
// SlotPicker embebido a 2 columnas y mapa guiado CheckoutLocationPicker (variant wizard).
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
    const [declineConfirming, setDeclineConfirming] = useState(false);
    const [declining, setDeclining] = useState(false);
    const [declined, setDeclined] = useState(false);
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

    // "No puedo quedar": el vendedor declina coordinar. Cancela la autorización (0 € de coste,
    // captura diferida) y devuelve el importe al comprador. Confirmación en 2 pasos para no
    // disparar la cancelación por un clic accidental.
    const decline = async () => {
        setError(null);
        setDeclining(true);
        try {
            const res = await fetch(`${base}/decline`, { method: 'POST' });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.message || 'No se pudo cancelar la coordinación.');
            }
            setDeclined(true);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo cancelar la coordinación.');
            // Recargar el contexto por si el enlace caducó o la cita ya estaba reservada.
            try {
                const r = await fetch(base);
                if (r.ok) setCtx(await r.json());
            } catch { /* ignore */ }
        } finally {
            setDeclining(false);
            setDeclineConfirming(false);
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

    const showForm = status === 'ok' && ctx && !ctx.alreadyBooked && !ctx.expired && !done && !declined
        && windowInfo?.hasAvailability !== false;

    return (
        <div className="flex min-h-[100dvh] items-start justify-center bg-[#f7f7f7] px-4 py-8 sm:py-12">
            <div className={cn(SD_CHECKOUT_DESKTOP_CARD_CLASS, 'w-full max-w-3xl')}>
                <div className="px-5 py-6 sm:px-6">
                    {status === 'loading' && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 size={18} className="animate-spin" /> Comprobando el enlace…
                        </div>
                    )}

                    {status === 'invalid' && (
                        <div className="flex items-start gap-3">
                            <AlertTriangle size={20} className="shrink-0 text-red-600" />
                            <p className="text-sm">Este enlace no es válido o ya ha caducado. Pide al comprador que te lo reenvíe.</p>
                        </div>
                    )}

                    {status === 'ok' && (ctx?.alreadyBooked || done) && !declined && (
                        <div className="flex items-start gap-3">
                            <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
                            <div>
                                <p className="mb-1 text-[15px] font-semibold">Cita confirmada</p>
                                <p className="text-sm text-muted-foreground">El técnico acudirá en la fecha elegida. ¡Gracias!</p>
                            </div>
                        </div>
                    )}

                    {status === 'ok' && declined && (
                        <div className="flex items-start gap-3">
                            <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
                            <div>
                                <p className="mb-1 text-[15px] font-semibold">Coordinación cancelada</p>
                                <p className="text-sm text-muted-foreground">Hemos cancelado la inspección y devuelto el importe al comprador. Gracias por avisar.</p>
                            </div>
                        </div>
                    )}

                    {status === 'ok' && ctx?.expired && !ctx.alreadyBooked && !done && (
                        <div className="flex items-start gap-3">
                            <AlertTriangle size={20} className="shrink-0 text-red-600" />
                            <p className="text-sm">El plazo para reservar la cita ha caducado. Se ha devuelto el importe al comprador.</p>
                        </div>
                    )}

                    {status === 'ok' && ctx && !ctx.alreadyBooked && !ctx.expired && !done
                        && windowInfo && !windowInfo.hasAvailability && (
                        <div className="flex items-start gap-3">
                            <AlertTriangle size={20} className="shrink-0 text-red-600" />
                            <p className="text-sm">
                                El técnico no tiene disponibilidad en el plazo. Se devolverá el importe al comprador.
                            </p>
                        </div>
                    )}

                    {showForm && (
                        <div>
                            <div className="mb-5 flex items-start gap-3">
                                <CalendarClock size={20} className="shrink-0 text-brand" />
                                <div>
                                    <p className="mb-1 text-[15px] font-semibold">Elige cuándo y dónde ver el vehículo</p>
                                    <p className="text-sm text-muted-foreground">
                                        Un comprador ha <strong>pagado</strong> una inspección profesional. Elige un hueco del técnico y dónde está el coche.
                                    </p>
                                </div>
                            </div>

                            {windowInfo?.windowExtended && (
                                <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                                    <p className="text-[13px] text-amber-800">
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
                                embedded
                                embeddedSplitColumn
                            />

                            <div className="mt-5">
                                {isWorkshop ? (
                                    <div className="rounded-xl border border-[#ebebeb] bg-[#fafafa] px-4 py-3">
                                        <p className="text-sm text-muted-foreground">
                                            La inspección se hará en el taller del experto.
                                        </p>
                                    </div>
                                ) : (
                                    <CheckoutLocationPicker
                                        variant="wizard"
                                        expertLatitude={ctx.expertLatitude ?? undefined}
                                        expertLongitude={ctx.expertLongitude ?? undefined}
                                        expertCountry={ctx.expertCountry ?? undefined}
                                        expertRange={ctx.workRadiusKm ?? undefined}
                                        workRadiusKm={ctx.workRadiusKm ?? undefined}
                                        onChange={setChosenLocation}
                                    />
                                )}
                            </div>

                            {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}

                            <button
                                type="button"
                                onClick={confirm}
                                disabled={submitting || !slot || (!isWorkshop && !chosenLocation)}
                                className="mt-5 h-11 w-full rounded-full bg-brand text-[15px] font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {submitting ? 'Confirmando…' : 'Confirmar cita'}
                            </button>

                            {/* "No puedo quedar": acción secundaria sutil. Confirmación en 2 pasos
                                porque dispara la cancelación + devolución al comprador. */}
                            {!declineConfirming ? (
                                <button
                                    type="button"
                                    onClick={() => { setError(null); setDeclineConfirming(true); }}
                                    disabled={submitting || declining}
                                    className="mt-3 w-full py-2 text-[13px] text-muted-foreground underline transition hover:text-foreground disabled:opacity-50"
                                >
                                    No voy a poder coordinar la cita
                                </button>
                            ) : (
                                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
                                    <p className="mb-2.5 text-[13px] text-red-800">
                                        Se cancelará la inspección y el comprador recuperará su dinero. ¿Confirmar?
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={decline}
                                            disabled={declining}
                                            className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                                        >
                                            {declining ? 'Cancelando…' : 'Sí, cancelar'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeclineConfirming(false)}
                                            disabled={declining}
                                            className="flex-1 rounded-lg border border-[#dce3ec] bg-white py-2.5 text-sm font-semibold text-foreground transition hover:bg-gray-50"
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
        </div>
    );
}
