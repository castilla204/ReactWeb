import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useExpert } from '../hooks/useExpert';
import { showToast } from '../lib/toast';
import { SileoPageLoader } from '../components/ui/sileo-loader';

/**
 * Maneja el retorno desde Stripe Connect onboarding.
 */
export function StripeOnboardingReturnPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { syncStripeStatus, startOnboarding } = useExpert();
    const ranRef = useRef(false);

    const isRefresh = location.pathname.includes('refresh');

    useEffect(() => {
        if (ranRef.current) return;
        ranRef.current = true;

        (async () => {
            if (isRefresh) {
                try {
                    await startOnboarding();
                    return;
                } catch {
                    showToast('error', 'No se pudo reanudar la configuración de pagos. Inténtalo desde tu panel.');
                    navigate('/expert', { replace: true });
                }
            } else {
                try {
                    await syncStripeStatus();
                } catch {
                    // best-effort; el panel volverá a consultar el estado por su cuenta
                }
                navigate('/expert', { replace: true });
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <SileoPageLoader
            message={isRefresh ? 'Reanudando la configuración de pagos…' : 'Verificando tu configuración de pagos…'}
            className="bg-white"
        />
    );
}

export default StripeOnboardingReturnPage;
