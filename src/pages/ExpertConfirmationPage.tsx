import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { API_CONFIG } from '../config/api';
import { SileoLoader } from '../components/ui/sileo-loader';
import { SileoButton } from '../components/ui/sileo-button';
import { AppointmentWizardShell } from '../components/checkout/AppointmentWizardShell';
import { ReadOnlyAppointmentCalendar } from '../components/checkout/ReadOnlyAppointmentCalendar';
import { CheckoutCoordinationStep } from '../components/checkout/CheckoutCoordinationStep';
import { LazyAppointmentMap as AppointmentMap } from '../components/Map/LazyAppointmentMap';
import { CheckoutSelfChoicePreviewMap } from '../components/checkout/CheckoutSellerChoiceLocked';
import SEO from '../components/SEO';

// Página PÚBLICA de confirmación del experto.
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
    const [wizardStep, setWizardStep] = useState<1 | 2>(1);

    const base = useMemo(
        () => (token ? `${API_CONFIG.baseUrl}/api/expert-confirmation/${encodeURIComponent(token)}` : ''),
        [token],
    );

    const reload = async () => {
        try {
            const r = await fetch(base);
            if (r.ok) setCtx(await r.json());
            // W10 FIX: si el token ya se consumió (cancel-pending del comprador, watchdog, otra
            // pestaña), el GET devuelve 404. Antes se ignoraba → `pending` seguía true y el wizard
            // quedaba interactivo para siempre encadenando 409/404. Pasar a 'invalid'.
            else if (r.status === 404) setStatus('invalid');
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

    // 🛡️ H2 FIX (auditoría 2026-07-06): lock SÍNCRONO compartido approve/reject contra doble
    // submit. El `disabled` del botón depende de un useState (asíncrono), así que un doble tap
    // rápido podía lanzar dos POST → el 2º devolvía "la cita ya no está pendiente" justo tras una
    // acción exitosa. Mismo patrón que isSubmittingRef del checkout del comprador.
    const submitLockRef = useRef(false);

    const approve = async () => {
        if (submitLockRef.current) return;
        submitLockRef.current = true;
        setError(null);
        setSubmitting(true);
        try {
            const res = await fetch(`${base}/approve`, { method: 'POST' });
            if (!res.ok) {
                const data: { message?: string } = await res.json().catch(() => ({}));
                if (res.status === 409) {
                    await reload();
                    // W10 FIX: mostrar el mensaje REAL del backend (distingue "el plazo ha vencido"
                    // de "ya no está pendiente"); antes se pisaba con un texto único ambiguo.
                    throw new Error(data?.message || 'La cita ya no está pendiente de confirmación.');
                }
                throw new Error(data?.message || 'No se pudo confirmar la cita.');
            }
            setDone('approved');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo confirmar la cita.');
        } finally {
            setSubmitting(false);
            submitLockRef.current = false;
        }
    };

    const reject = async () => {
        if (submitLockRef.current) return;
        submitLockRef.current = true;
        setError(null);
        setRejecting(true);
        try {
            const res = await fetch(`${base}/reject`, { method: 'POST' });
            if (!res.ok) {
                const data: { message?: string } = await res.json().catch(() => ({}));
                if (res.status === 409) {
                    await reload();
                    // W10 FIX: en la carrera reject-vs-approve el backend dice "La cita acaba de
                    // confirmarse. No se puede rechazar." — el experto DEBE saber que tiene que acudir.
                    throw new Error(data?.message || 'La cita ya no está pendiente de confirmación.');
                }
                throw new Error(data?.message || 'No se pudo rechazar la cita.');
            }
            setDone('rejected');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo rechazar la cita.');
        } finally {
            setRejecting(false);
            setRejectConfirming(false);
            submitLockRef.current = false;
        }
    };

    // Determinar si hay coordenadas de ubicación del vehículo
    const hasMapPoint = useMemo(
        () =>
            ctx?.latitude != null &&
            ctx?.longitude != null &&
            Number.isFinite(Number(ctx.latitude)) &&
            Number.isFinite(Number(ctx.longitude)),
        [ctx?.latitude, ctx?.longitude],
    );

    const expertSteps = useMemo(
        () =>
            hasMapPoint
                ? [{ id: 1, label: 'Fecha y hora' }, { id: 2, label: 'Ubicación' }]
                : [{ id: 1, label: 'Fecha y hora' }],
        [hasMapPoint],
    );

    const isLastStep = !hasMapPoint || wizardStep === 2;

    const card: React.CSSProperties = {
        background: 'hsl(var(--surface))',
        border: '0.5px solid hsl(var(--line))',
        borderRadius: 16,
        maxWidth: 560,
        width: '100%',
        padding: 24,
    };

    const pending = status === 'ok' && ctx && !done && !ctx.expired;

    // Nodos de solo lectura (se construyen solo cuando hay ctx)
    const lockedCards = ctx ? (
        <CheckoutCoordinationStep
            view="choose"
            selection="seller"
            embedded
            showStepHeader={false}
            readOnly
            onSelect={() => {}}
            sellerPhone="" sellerEmail="" sellerListingUrl=""
            onSellerPhoneChange={() => {}} onSellerEmailChange={() => {}} onSellerListingUrlChange={() => {}}
        />
    ) : null;

    const calendarNode = ctx ? (
        <ReadOnlyAppointmentCalendar startUtc={ctx.startsAtUtc} />
    ) : null;

    // Mapa de solo lectura: usamos AppointmentMap directamente con initialLocation
    // para que se pinte el pin del vehículo. referencePreview=true impide clicks de selección
    // y abre el zoom amplio. disabled=false es necesario para que initialLocation pinte el marcador
    // (AppointmentMap solo pinta initialLocation cuando !disabled).
    // Usamos el mismo punto como expertLocation para centrar el mapa (sin radio de cobertura).
    const mapNode = ctx && hasMapPoint ? (
        <CheckoutSelfChoicePreviewMap className="h-full min-h-0" showInnerHeader={false}>
            <AppointmentMap
                initialLocation={{ latitude: Number(ctx.latitude), longitude: Number(ctx.longitude) }}
                expertLocation={{ latitude: Number(ctx.latitude), longitude: Number(ctx.longitude) }}
                expertRange={0}
                disabled={false}
                showSearch={false}
                showCountrySelector={false}
                frameless
                coverageStyle="minimal"
                referencePreview
                className="h-full w-full"
            />
        </CheckoutSelfChoicePreviewMap>
    ) : null;

    // Enlace/confirmación de rechazo: compartido entre el cuerpo móvil (paso 1) y el pie desktop.
    // W7 FIX (gemelo de SellerBookingPage): antes SOLO se pintaba después del shell → en móvil
    // quedaba bajo el fold y en el paso mapa (h-[100dvh] overflow-hidden) era inalcanzable; el
    // error del approve/reject (incluido el 402 de captura reintentable) era invisible.
    const rejectNode = !rejectConfirming ? (
        <button
            type="button"
            onClick={() => { setError(null); setRejectConfirming(true); }}
            disabled={submitting || rejecting}
            className="w-full py-2 text-center text-meta text-muted-foreground underline transition hover:text-foreground disabled:opacity-50"
        >
            No podré atender la cita
        </button>
    ) : (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
            <p className="mb-2.5 text-meta text-red-800">
                Se cancelará la cita y el comprador recibirá el 100%. ¿Confirmar?
            </p>
            <div className="flex gap-2">
                <SileoButton
                    onClick={reject}
                    disabled={rejecting}
                    loading={rejecting}
                    loadingText="Rechazando…"
                    className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                >
                    Sí, rechazar
                </SileoButton>
                <button
                    type="button"
                    onClick={() => setRejectConfirming(false)}
                    disabled={rejecting}
                    className="flex-1 rounded-lg border border-line bg-white py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-tinted"
                >
                    Volver
                </button>
            </div>
        </div>
    );

    // Estado pendiente: wizard a ancho completo
    if (pending && ctx) {
        return (
            <div className="min-h-[100dvh] bg-surface-tinted">
                <SEO title="Confirma la cita | Inspecciono" description="Revisa y confirma la cita de inspección." noindex />
                <AppointmentWizardShell
                    steps={expertSteps}
                    currentStep={wizardStep}
                    title={wizardStep === 1 ? 'Confirma tu cita de inspección' : 'Lugar de la inspección'}
                    description={
                        wizardStep === 1
                            ? 'Un comprador ha reservado una inspección contigo. Revisa el día y la hora y confirma si podrás atenderla.'
                            : 'Esta es la ubicación donde está el vehículo.'
                    }
                    onBack={wizardStep === 2 ? () => setWizardStep(1) : () => { /* no-op en paso 1 */ }}
                    desktopTallRight={hasMapPoint && wizardStep === 2}
                    desktopLeft={wizardStep === 1 ? lockedCards : (
                        <div className="space-y-2">
                            <p className="text-lead font-semibold text-ink-strong">Dirección</p>
                            <p className="text-meta leading-[1.5] text-ink-strong">{prettyPlace || 'Por determinar'}</p>
                            <p className="text-caption text-ink-muted">{prettyDate}</p>
                        </div>
                    )}
                    desktopRight={wizardStep === 1 ? calendarNode : mapNode}
                    mobileFullBleed={hasMapPoint && wizardStep === 2}
                    mobileBody={wizardStep === 1 ? (
                        <div className="space-y-4">
                            {lockedCards}
                            {calendarNode}
                            {/* W7 FIX: rechazo accesible dentro del cuerpo scrolleable móvil. */}
                            <div className="pt-1">{rejectNode}</div>
                        </div>
                    ) : (
                        <div className="absolute inset-0">{mapNode}</div>
                    )}
                    primaryLabel={isLastStep ? 'Confirmar cita' : 'Continuar'}
                    primaryDisabled={submitting || rejecting}
                    onPrimary={() => {
                        if (!isLastStep) { setWizardStep(2); return; }
                        void approve();
                    }}
                    onSecondary={wizardStep === 2 ? () => setWizardStep(1) : undefined}
                />
                {/* W7 FIX: error SIEMPRE visible en móvil — tira fija sobre el footer del wizard
                    (cubre el 402 de captura reintentable y los 409 de carrera, en ambos pasos). */}
                {error && (
                    <div
                        className="fixed inset-x-0 z-[71] px-5 lg:hidden"
                        style={{ bottom: 'calc(0.625rem + 2.75rem + max(0.625rem, env(safe-area-inset-bottom, 0px)) + 0.5rem)' }}
                    >
                        <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-meta text-red-800 shadow-lg">
                            {error}
                        </p>
                    </div>
                )}
                {/* Pie desktop: error + rechazo (en móvil viven en el cuerpo / tira fija). */}
                <div className="mx-auto hidden w-full px-5 pb-6 lg:block lg:max-w-[75rem] lg:px-8">
                    {error && <p className="mb-2 text-meta text-red-600">{error}</p>}
                    {rejectNode}
                </div>
            </div>
        );
    }

    // Estados resueltos / cargando / inválido / caducado: tarjeta centrada actual sin cambios.
    return (
        <div className="flex min-h-[100dvh] items-center justify-center bg-surface-tinted p-4">
            <SEO title="Confirma la cita | Inspecciono" description="Revisa y confirma la cita de inspección." noindex />
            <div style={card}>
                <strong className="mb-3 block text-lead font-semibold text-brand">Inspecciono</strong>

                {status === 'loading' && (
                    <SileoLoader message="Comprobando el enlace…" color="muted" />
                )}

                {status === 'invalid' && (
                    <div className="flex items-start gap-2.5">
                        <AlertTriangle size={20} className="shrink-0 text-destructive" />
                        <p className="m-0 text-body">Este enlace no es válido o la cita ya se ha resuelto.</p>
                    </div>
                )}

                {status === 'ok' && done === 'approved' && (
                    <div className="flex items-start gap-2.5">
                        <CheckCircle2 size={20} className="shrink-0 text-success" />
                        <div>
                            <p className="mb-1 text-body font-semibold">Cita confirmada</p>
                            <p className="m-0 text-body text-ink-muted">
                                Te esperamos el {prettyDate}. ¡Gracias!
                            </p>
                        </div>
                    </div>
                )}

                {status === 'ok' && done === 'rejected' && (
                    <div className="flex items-start gap-2.5">
                        <CheckCircle2 size={20} className="shrink-0 text-success" />
                        <div>
                            <p className="mb-1 text-body font-semibold">Cita rechazada</p>
                            <p className="m-0 text-body text-ink-muted">
                                Has rechazado la cita. Se ha devuelto el importe al comprador.
                            </p>
                        </div>
                    </div>
                )}

                {status === 'ok' && !done && ctx?.expired && (
                    <div className="flex items-start gap-2.5">
                        <AlertTriangle size={20} className="shrink-0 text-destructive" />
                        <p className="m-0 text-body">El plazo para confirmar ha caducado.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
