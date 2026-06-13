import React from 'react';
import { Loader2 } from 'lucide-react';
import type { ExpertStripeStatusResult } from '../hooks/useExpertStripeStatus';
import { STRIPE_STATUS } from '../constants/stripeStatus';
import { ErrorDisplay } from './ErrorDisplay';
import { buildStripeStatusDisplay } from '../utils/stripeStatusDisplay';
import { getButtonClass } from '../utils/stripeStatusStyles';

interface StripeStatusCardProps {
    stripe: ExpertStripeStatusResult;
    onSetupStripe?: () => void;
    onAccessDashboard?: () => void;
    onContactSupport?: () => void;
    className?: string;
    isLoadingOnboarding?: boolean;
}

function parseRequirements(details: string) {
    const rxPending = /Requisitos pendientes:\s*([^.]+)\./i;
    const rxPastDue = /(?:Stripe indicó )?requisitos vencidos:\s*([^.]+)\./i;
    const rxErrors = /Errores a corregir:\s*([^.]+)\./i;
    const pending = rxPending.exec(details)?.[1]?.split(',').map((s) => s.trim()).filter(Boolean) || [];
    const pastDue = rxPastDue.exec(details)?.[1]?.split(',').map((s) => s.trim()).filter(Boolean) || [];
    const errors = rxErrors.exec(details)?.[1]?.split(';').map((s) => s.trim()).filter(Boolean) || [];
    return { pending, pastDue, errors };
}

export const StripeStatusCard: React.FC<StripeStatusCardProps> = ({
    stripe,
    onSetupStripe,
    onAccessDashboard,
    onContactSupport,
    className = '',
    isLoadingOnboarding = false,
}) => {
    const { status, loading, error, refetch, syncStatus, statusInfo, isPolling } = stripe;

    if (loading) {
        return (
            <div className={`stripe-status-panel stripe-status-panel--loading ${className}`}>
                <Loader2 className="h-5 w-5 animate-spin text-[#6a6a6a]" aria-hidden />
                <p className="stripe-status-loading-text">Comprobando estado de pagos…</p>
            </div>
        );
    }

    if (error) {
        return (
            <ErrorDisplay
                message={error}
                onRetry={refetch}
                fullScreen={false}
                className={className}
            />
        );
    }

    if (!status || !statusInfo) {
        return (
            <div className={`stripe-status-panel ${className}`}>
                <p className="stripe-status-summary">No hay datos de estado disponibles.</p>
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
    const showActionButton =
        status.stripeStatus !== STRIPE_STATUS.REJECTED || status.canRetryOnboarding !== false;
    const isBusy = loading || isLoadingOnboarding || isPolling;

    return (
        <div className={`stripe-status-panel ${className}`}>
            <header className="stripe-status-header">
                <p className="stripe-status-kicker">{display.kicker}</p>
                <h1 className="stripe-status-title">{display.title}</h1>
            </header>

            <p className="stripe-status-summary">{display.summary}</p>

            {display.reason && (
                <section className="stripe-status-block">
                    <h2 className="stripe-status-label">Motivo</h2>
                    <p className="stripe-status-text">{display.reason}</p>
                </section>
            )}

            {display.nextSteps && (
                <section className="stripe-status-block">
                    <h2 className="stripe-status-label">Qué hacer</h2>
                    <p className="stripe-status-text">{display.nextSteps}</p>
                </section>
            )}

            {requirements.pastDue.length > 0 && (
                <section className="stripe-status-block">
                    <h2 className="stripe-status-label">Vencidos</h2>
                    <ul className="stripe-status-list">
                        {requirements.pastDue.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                </section>
            )}

            {requirements.pending.length > 0 && (
                <section className="stripe-status-block">
                    <h2 className="stripe-status-label">Por completar en Stripe</h2>
                    <ul className="stripe-status-list">
                        {requirements.pending.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                </section>
            )}

            {requirements.errors.length > 0 && (
                <section className="stripe-status-block">
                    <h2 className="stripe-status-label">Errores a corregir</h2>
                    <ul className="stripe-status-list">
                        {requirements.errors.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                </section>
            )}

            {(statusInfo.deadlineText || statusInfo.futureRequirementsText) && (
                <section className="stripe-status-block stripe-status-block--meta">
                    {statusInfo.deadlineText && (
                        <p className="stripe-status-text">{statusInfo.deadlineText}</p>
                    )}
                    {statusInfo.futureRequirementsText && (
                        <p className="stripe-status-text">
                            <span className="font-medium">Próximos requisitos:</span>{' '}
                            {statusInfo.futureRequirementsText}
                        </p>
                    )}
                </section>
            )}

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
                                Cargando…
                            </>
                        ) : (
                            statusInfo.buttonText
                        )}
                    </button>
                </div>
            )}

            {(status.stripeStatus === STRIPE_STATUS.REJECTED && status.canRetryOnboarding === false) ||
            status.stripeAccountId ? (
                <footer className="stripe-status-footer">
                    {status.stripeStatus === STRIPE_STATUS.REJECTED && status.canRetryOnboarding === false && (
                        <p className="stripe-status-footer-line">
                            Soporte:{' '}
                            <a href="mailto:info@inspecciono.io" className="stripe-status-link">
                                info@inspecciono.io
                            </a>
                        </p>
                    )}
                    {!status.canReceivePayments &&
                        status.stripeStatus !== STRIPE_STATUS.NOT_REQUESTED &&
                        status.stripeStatus !== STRIPE_STATUS.APPROVED && (
                            <p className="stripe-status-footer-line">Los cobros están bloqueados hasta resolver esto.</p>
                        )}
                    {status.stripeAccountId && (
                        <p className="stripe-status-footer-line stripe-status-footer-line--mono">
                            ID Stripe: {status.stripeAccountId}
                        </p>
                    )}
                </footer>
            ) : null}
        </div>
    );
};
