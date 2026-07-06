import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertCircle, AlertTriangle, FileWarning, Clock, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import type { ExpertStripeStatusResult } from '../hooks/useExpertStripeStatus';
import { STRIPE_STATUS } from '../constants/stripeStatus';
import { ErrorDisplay } from './ErrorDisplay';
import { buildStripeStatusDisplay } from '../utils/stripeStatusDisplay';
import { getButtonClass, STRIPE_ERROR_STATES, STRIPE_WARNING_STATES } from '../utils/stripeStatusStyles';

interface StripeStatusCardProps {
    stripe: ExpertStripeStatusResult;
    onSetupStripe?: () => void;
    onAccessDashboard?: () => void;
    onContactSupport?: () => void;
    className?: string;
    isLoadingOnboarding?: boolean;
}

/**
 * Extrae las listas de requisitos del `stripeStatusDetails` (prosa que emite el backend).
 *
 * 🛡️ Sync back↔front: el parser antiguo (a) solo capturaba "requisitos vencidos" y perdía
 * SIEMPRE la lista de "requisitos futuros" (el caso de aviso temprano más común), (b) no
 * reconocía "Errores específicos:" de la ruta de rechazo, y (c) usaba `[^.]+` que truncaba
 * la lista en el primer punto de cualquier descripción. Esta versión captura cada sección de
 * forma perezosa hasta la siguiente sección conocida o el final del texto, y reconoce ambos
 * vocabularios de prefijos que produce el backend.
 */
function parseRequirements(details: string) {
    // Lookahead a cualquier inicio de sección conocido o fin de string → evita el truncado.
    const STOP = '(?=\\s*Requisitos pendientes:|\\s*Stripe indicó requisitos (?:vencidos|futuros):|\\s*Errores (?:a corregir|específicos):|\\s*Motivo:|\\s*Qué hacer:|\\s*$)';
    const grab = (label: string): string => {
        const m = new RegExp(`${label}\\s*([\\s\\S]*?)${STOP}`, 'i').exec(details);
        return (m?.[1] ?? '').replace(/[.\s]+$/, '').trim();
    };
    const splitBy = (s: string, sep: string) => s.split(sep).map((x) => x.trim()).filter(Boolean);
    return {
        pending: splitBy(grab('Requisitos pendientes:'), ','),
        pastDue: splitBy(grab('(?:Stripe indicó )?requisitos vencidos:'), ','),
        future: splitBy(grab('(?:Stripe indicó )?requisitos futuros:'), ','),
        errors: splitBy(grab('Errores (?:a corregir|específicos):'), ';'),
    };
}

type Severity = 'danger' | 'warning' | 'info';

export const StripeStatusCard: React.FC<StripeStatusCardProps> = ({
    stripe,
    onSetupStripe,
    onAccessDashboard,
    onContactSupport,
    className = '',
    isLoadingOnboarding = false,
}) => {
    const { t } = useTranslation();
    const { status, loading, error, refetch, syncStatus, statusInfo } = stripe;

    if (loading && !status) {
        // Skeleton (no spinner) — refleja la forma real de la tarjeta mientras carga.
        return (
            <div className={`stripe-status-panel stripe-status-skeleton ${className}`} aria-busy="true" aria-live="polite">
                <span className="sr-only">{t('stripe.common.checking')}</span>
                <div className="sk sk-kicker" />
                <div className="sk sk-title" />
                <div className="sk sk-line" />
                <div className="sk sk-line sk-line--short" />
                <div className="sk sk-block" />
            </div>
        );
    }

    if (error) {
        return <ErrorDisplay message={error} onRetry={refetch} fullScreen={false} className={className} />;
    }

    if (!status || !statusInfo) {
        return (
            <div className={`stripe-status-panel ${className}`}>
                <p className="stripe-status-summary">{t('stripe.common.noData')}</p>
            </div>
        );
    }

    const handleAction = () => {
        switch (statusInfo.action) {
            case 'setup':
            case 'retry':
                onSetupStripe?.();
                break;
            case 'complete_requirements':
            case 'edit_account':
                onAccessDashboard?.();
                break;
            case 'wait':
                syncStatus();
                break;
            case 'contact':
                onContactSupport?.();
                break;
        }
    };

    const display = buildStripeStatusDisplay({
        stripeStatus: status.stripeStatus,
        fallbackMessage: statusInfo.message,
        stripeStatusDetails: status.stripeStatusDetails,
        rejectionReason: status.rejectionReason,
        canRetryOnboarding: status.canRetryOnboarding,
    });

    const requirements = parseRequirements(status.stripeStatusDetails || '');

    // Si la lista de futuros no vino embebida en los detalles, usar el campo dedicado.
    const futureItems = requirements.future.length > 0
        ? requirements.future
        : (statusInfo.futureRequirementsText
            ? statusInfo.futureRequirementsText.split(',').map((s) => s.trim()).filter(Boolean)
            : []);

    // Grupos de requisitos en orden de urgencia, con severidad semántica (no solo color: icono + etiqueta).
    const groups: { key: string; title: string; items: string[]; severity: Severity; Icon: typeof AlertCircle }[] = [
        { key: 'errors', title: t('stripe.common.errorsToFix'), items: requirements.errors, severity: 'danger', Icon: AlertCircle },
        { key: 'pastDue', title: t('stripe.common.pastDueTitle'), items: requirements.pastDue, severity: 'danger', Icon: AlertTriangle },
        { key: 'pending', title: t('stripe.common.pendingNow'), items: requirements.pending, severity: 'warning', Icon: FileWarning },
        { key: 'future', title: t('stripe.common.upcoming'), items: futureItems, severity: 'info', Icon: Clock },
    ].filter((g) => g.items.length > 0);

    // El plazo es danger si ya bloquea (vencido/restringido), warning si es un aviso anticipado.
    const deadlineUrgent =
        status.stripeStatus === STRIPE_STATUS.REQUIREMENTS_PAST_DUE ||
        status.stripeStatus === STRIPE_STATUS.RESTRICTED ||
        status.stripeStatus === STRIPE_STATUS.DISABLED;

    const showActionButton =
        status.stripeStatus !== STRIPE_STATUS.REJECTED || status.canRetryOnboarding !== false;
    const isBusy = loading || isLoadingOnboarding;

    // Severidad global del estado → medallón + kicker coloreados. Mismo vocabulario
    // del panel (fondo blanco siempre; el color vive solo en icono y texto — MUD).
    // PENDING cuenta como warning: onboarding a medias = acción del experto pendiente.
    const cardSeverity: Severity | 'success' =
        STRIPE_ERROR_STATES.includes(status.stripeStatus) ? 'danger'
        : STRIPE_WARNING_STATES.includes(status.stripeStatus) || status.stripeStatus === STRIPE_STATUS.PENDING ? 'warning'
        : status.stripeStatus === STRIPE_STATUS.APPROVED ? 'success'
        : 'info';
    const SeverityIcon =
        cardSeverity === 'danger' ? XCircle
        : cardSeverity === 'warning' ? AlertTriangle
        : cardSeverity === 'success' ? CheckCircle2
        : Clock;

    // 🖥️ Desktop: el panel pasa a 2 columnas cuando hay requisitos que listar —
    // narrativa (resumen/plazo/motivo/qué hacer) a la izquierda y checklist a la
    // derecha— para que no se vea como una tira estrecha y muy vertical. En móvil
    // colapsa a una sola columna en el mismo orden de lectura.
    const isSplit = groups.length > 0;

    return (
        <div className={`stripe-status-panel ${isSplit ? 'stripe-status-panel--split' : ''} ${className}`}>
            <header className="stripe-status-header">
                <span className={`stripe-status-medallion stripe-status-medallion--${cardSeverity}`} aria-hidden>
                    <SeverityIcon className="h-[18px] w-[18px]" strokeWidth={2} />
                </span>
                <div className="stripe-status-heading">
                    <p className={`stripe-status-kicker stripe-status-kicker--${cardSeverity}`}>{display.kicker}</p>
                    <h2 className="stripe-status-title">{display.title}</h2>
                </div>
            </header>

            <div className="stripe-status-body">
                <div className="stripe-status-main">
                    <p className="stripe-status-summary">{display.summary}</p>

                    {statusInfo.deadlineText && (
                        <div className={`stripe-deadline-pill ${deadlineUrgent ? 'stripe-deadline-pill--danger' : 'stripe-deadline-pill--warning'}`}>
                            <Clock className="h-3.5 w-3.5" aria-hidden />
                            <span>{statusInfo.deadlineText}</span>
                        </div>
                    )}

                    {display.reason && (
                        <section className="stripe-status-block">
                            <h3 className="stripe-status-label">{t('stripe.common.reason')}</h3>
                            <p className="stripe-status-text">{display.reason}</p>
                        </section>
                    )}

                    {display.nextSteps && (
                        <section className="stripe-status-block">
                            <h3 className="stripe-status-label">{t('stripe.common.whatToDo')}</h3>
                            <p className="stripe-status-text">{display.nextSteps}</p>
                        </section>
                    )}
                </div>

                {isSplit && (
                    <div className="stripe-status-side">
                        {groups.map((group) => (
                            <section key={group.key} className="stripe-req-group">
                                <div className="stripe-req-group-head">
                                    <group.Icon className={`h-4 w-4 sev-${group.severity}`} aria-hidden />
                                    <h3 className="stripe-req-title">{group.title}</h3>
                                    <span className="stripe-req-count">{group.items.length}</span>
                                </div>
                                <ul className="stripe-req-rows">
                                    {group.items.map((item) => (
                                        <li key={item} className="stripe-req-row">
                                            <span className={`stripe-req-dot stripe-req-dot--${group.severity}`} aria-hidden />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ))}
                    </div>
                )}
            </div>

            {showActionButton && (
                <div className="stripe-status-actions">
                    <button
                        type="button"
                        onClick={handleAction}
                        disabled={isBusy}
                        className={`stripe-status-btn ${getButtonClass(statusInfo.action)} ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isBusy ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                                {t('stripe.common.loading')}
                            </>
                        ) : (
                            statusInfo.buttonText
                        )}
                    </button>
                    {/* Doc Stripe (hosted onboarding): el formulario auto-detecta lo pendiente y
                        pre-rellena lo ya enviado. Decírselo reduce el abandono en reintentos —
                        solo si ya existe una cuenta (en el primer alta no hay nada guardado). */}
                    {(statusInfo.action === 'setup' || statusInfo.action === 'retry' || statusInfo.action === 'complete_requirements') &&
                        (status.hasStripeAccount || status.hasPendingOnboarding) && (
                            <p className="stripe-resume-hint">{t('stripe.common.resumeHint')}</p>
                        )}
                </div>
            )}

            {/* El panel se actualiza solo: poll de respaldo + push realtime de Stripe. */}
            <p className="stripe-live-note">
                <RefreshCw className="h-3 w-3" aria-hidden />
                {t('stripe.common.autoUpdate')}
            </p>

            {(status.stripeStatus === STRIPE_STATUS.REJECTED && status.canRetryOnboarding === false) ||
            status.stripeAccountId ? (
                <footer className="stripe-status-footer">
                    {status.stripeStatus === STRIPE_STATUS.REJECTED && status.canRetryOnboarding === false && (
                        <p className="stripe-status-footer-line">
                            {t('stripe.common.support')}{' '}
                            <a href="mailto:info@inspecciono.io" className="stripe-status-link">
                                info@inspecciono.io
                            </a>
                        </p>
                    )}
                    {!status.canReceivePayments &&
                        status.stripeStatus !== STRIPE_STATUS.NOT_REQUESTED &&
                        status.stripeStatus !== STRIPE_STATUS.APPROVED && (
                            <p className="stripe-status-footer-line">{t('stripe.common.paymentsBlocked')}</p>
                        )}
                    {status.stripeAccountId && (
                        <p className="stripe-status-footer-line stripe-status-footer-line--mono">
                            {t('stripe.common.stripeId')} {status.stripeAccountId}
                        </p>
                    )}
                </footer>
            ) : null}
        </div>
    );
};
