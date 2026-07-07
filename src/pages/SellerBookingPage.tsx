import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { API_CONFIG } from '../config/api';
import SlotPicker, { type ChosenSlot } from '../components/SlotPicker';
import CheckoutLocationPicker, { type CheckoutLocationData } from '../components/CheckoutLocationPicker';
import { CheckoutCoordinationStep } from '../components/checkout/CheckoutCoordinationStep';
import { AppointmentWizardShell } from '../components/checkout/AppointmentWizardShell';
import { cn } from '../lib/utils';
import { SD_CHECKOUT_DESKTOP_CARD_CLASS } from '../constants/homepageTypography';
import { SileoLoader } from '../components/ui/sileo-loader';
import { SileoButton } from '../components/ui/sileo-button';
import SEO from '../components/SEO';

// Página PÚBLICA del magic link del vendedor.
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
    const [wizardStep, setWizardStep] = useState<1 | 2>(1);

    const base = useMemo(
        () => (token ? `${API_CONFIG.baseUrl}/api/seller-booking/${encodeURIComponent(token)}` : ''),
        [token],
    );
    const isWorkshop = (ctx?.workRadiusKm ?? 0) === 0;

    const wizardSteps = useMemo(
        () => (isWorkshop
            ? [{ id: 1, label: 'Fecha y hora' }]
            : [{ id: 1, label: 'Fecha y hora' }, { id: 2, label: 'Ubicación' }]),
        [isWorkshop],
    );
    const isLastStep = isWorkshop || wizardStep === 2;
    const canPrimary = isWorkshop
        ? !!slot
        : wizardStep === 1
          ? !!slot
          : !!chosenLocation;

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

    // 🛡️ H2 FIX (auditoría 2026-07-06): lock SÍNCRONO contra doble submit. El `disabled` del
    // botón depende de un useState (asíncrono: solo surte efecto tras el re-render), así que un
    // doble click/tap rápido podía lanzar dos POST. El backend es idempotente por estado, pero el
    // segundo POST devolvía un error confuso justo tras una acción exitosa. Mismo patrón que
    // isSubmittingRef del checkout del comprador.
    const submitLockRef = useRef(false);

    const confirm = async () => {
        if (!slot) { setError('Elige un día y una hora.'); return; }
        if (!isWorkshop && !chosenLocation) { setError('Indica en el mapa dónde está el vehículo.'); return; }
        if (submitLockRef.current) return;
        submitLockRef.current = true;
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
            try {
                const r = await fetch(base);
                if (r.ok) setCtx(await r.json());
            } catch { /* ignore */ }
        } finally {
            setSubmitting(false);
            submitLockRef.current = false;
        }
    };

    const decline = async () => {
        if (submitLockRef.current) return;
        submitLockRef.current = true;
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
            try {
                const r = await fetch(base);
                if (r.ok) setCtx(await r.json());
            } catch { /* ignore */ }
        } finally {
            setDeclining(false);
            setDeclineConfirming(false);
            submitLockRef.current = false;
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

    // Nodos reutilizados (solo se calculan cuando hay ctx)
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
            bare
            showSectionHeader={false}
        />
    ) : null;

    const mapNode = ctx ? (
        <CheckoutLocationPicker
            variant="sidebar"
            showEmbeddedHeader={false}
            expertLatitude={ctx.expertLatitude ?? undefined}
            expertLongitude={ctx.expertLongitude ?? undefined}
            expertCountry={ctx.expertCountry ?? undefined}
            expertRange={ctx.workRadiusKm ?? undefined}
            workRadiusKm={ctx.workRadiusKm ?? undefined}
            onChange={setChosenLocation}
        />
    ) : null;

    const mapNodeMobile = ctx ? (
        <CheckoutLocationPicker
            variant="wizard"
            expertLatitude={ctx.expertLatitude ?? undefined}
            expertLongitude={ctx.expertLongitude ?? undefined}
            expertCountry={ctx.expertCountry ?? undefined}
            expertRange={ctx.workRadiusKm ?? undefined}
            workRadiusKm={ctx.workRadiusKm ?? undefined}
            onChange={setChosenLocation}
        />
    ) : null;

    // Formulario activo: shell del wizard a ancho completo
    if (showForm && ctx) {
        return (
            <div className="min-h-[100dvh] bg-[#f3f4f6]">
                <SEO title="Coordina la cita | Inspecciono" description="Elige fecha y lugar para la inspección." noindex />
                <AppointmentWizardShell
                    steps={wizardSteps}
                    currentStep={wizardStep}
                    title={wizardStep === 1 ? 'Elige cuándo ver el vehículo' : '¿Dónde está el vehículo?'}
                    description={
                        wizardStep === 1
                            ? 'Un comprador ha pagado una inspección profesional. Elige un hueco del técnico.'
                            : 'Marca el punto donde está el coche, dentro del área del experto.'
                    }
                    onBack={wizardStep === 2 ? () => setWizardStep(1) : () => { /* primer paso: no hay atrás */ }}
                    desktopTallRight={!isWorkshop && wizardStep === 2}
                    desktopLeft={wizardStep === 1 ? lockedCards : (
                        <div className="space-y-2">
                            <p className="text-[15px] font-semibold text-[#1c1c1c]">Ubicación del vehículo</p>
                            <p className="text-[13px] leading-[1.5] text-[#64748b]">
                                Busca la dirección o marca el punto en el mapa. Solo el experto verá la dirección exacta.
                            </p>
                        </div>
                    )}
                    desktopRight={wizardStep === 1 ? calendarNode : mapNode}
                    mobileFullBleed={!isWorkshop && wizardStep === 2}
                    mobileBody={wizardStep === 1 ? (
                        <div className="space-y-4">
                            {windowInfo?.windowExtended && (
                                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                                    <p className="text-[13px] text-amber-800">
                                        El técnico no tiene huecos en los próximos 7 días; te mostramos su disponibilidad ampliada.
                                    </p>
                                </div>
                            )}
                            {lockedCards}
                            {calendarNode}
                        </div>
                    ) : (
                        <div className="absolute inset-0">{mapNodeMobile}</div>
                    )}
                    primaryLabel={isLastStep ? 'Confirmar cita' : 'Continuar'}
                    primaryDisabled={submitting || !canPrimary}
                    onPrimary={() => {
                        if (!isLastStep) { setWizardStep(2); return; }
                        void confirm();
                    }}
                    onSecondary={wizardStep === 2 ? () => setWizardStep(1) : undefined}
                />
                {/* Decline: discreto, siempre accesible */}
                <div className="mx-auto w-full max-w-md px-5 pb-6 lg:max-w-[75rem] lg:px-8">
                    {error && <p className="mb-2 text-[13px] text-red-600">{error}</p>}
                    {!declineConfirming ? (
                        <button
                            type="button"
                            onClick={() => { setError(null); setDeclineConfirming(true); }}
                            disabled={submitting || declining}
                            className="w-full py-2 text-center text-[13px] text-muted-foreground underline transition hover:text-foreground disabled:opacity-50"
                        >
                            No voy a poder coordinar la cita
                        </button>
                    ) : (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
                            <p className="mb-2.5 text-[13px] text-red-800">
                                Se cancelará la inspección y el comprador recuperará su dinero. ¿Confirmar?
                            </p>
                            <div className="flex gap-2">
                                <SileoButton
                                    onClick={decline}
                                    disabled={declining}
                                    loading={declining}
                                    loadingText="Cancelando…"
                                    className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                                >
                                    Sí, cancelar
                                </SileoButton>
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
            </div>
        );
    }

    // Estados sin formulario (cargando / error / éxito): tarjeta centrada, sin cambios.
    return (
        <div className="flex min-h-[100dvh] items-start justify-center bg-[#f7f7f7] px-4 py-8 sm:py-12">
            <SEO title="Coordina la cita | Inspecciono" description="Elige fecha y lugar para la inspección." noindex />
            <div className="w-full max-w-3xl">
                <div className={cn(SD_CHECKOUT_DESKTOP_CARD_CLASS, 'px-5 py-6 sm:px-6')}>
                    {status === 'loading' && (
                        <SileoLoader message="Comprobando el enlace…" color="muted" />
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
                </div>
            </div>
        </div>
    );
}
