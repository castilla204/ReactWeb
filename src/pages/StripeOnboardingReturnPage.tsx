import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useExpert } from '../hooks/useExpert';
import { showToast } from '../lib/toast';

/**
 * Maneja el retorno desde Stripe Connect onboarding.
 * - /complete-onboarding  (return_url): el usuario terminó/volvió de Stripe → sincroniza el
 *   estado real con Stripe y lo lleva a su panel.
 * - /refresh-onboarding   (refresh_url): el AccountLink caducó → genera uno nuevo y redirige.
 * Antes estas rutas NO existían y Stripe dejaba al usuario en un 404.
 */
export function StripeOnboardingReturnPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { syncStripeStatus, startOnboarding } = useExpert();
    const ranRef = useRef(false);

    const isRefresh = location.pathname.includes('refresh');

    useEffect(() => {
        if (ranRef.current) return; // evitar doble ejecución en StrictMode
        ranRef.current = true;

        (async () => {
            if (isRefresh) {
                // El AccountLink caducó: pedir uno nuevo y volver a redirigir a Stripe.
                try {
                    await startOnboarding(); // hace window.location.href = url
                    return;
                } catch {
                    showToast('error', 'No se pudo reanudar la configuración de pagos. Inténtalo desde tu panel.');
                    navigate('/expert-panel', { replace: true });
                }
            } else {
                // Volvió de Stripe: sincronizar el estado real antes de mostrar el panel.
                try {
                    await syncStripeStatus();
                } catch {
                    // best-effort; el panel volverá a consultar el estado por su cuenta
                }
                navigate('/expert-panel', { replace: true });
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="w-10 h-10 text-gray-900 animate-spin mx-auto mb-4" />
                <p className="text-gray-700 text-sm">
                    {isRefresh ? 'Reanudando la configuración de pagos…' : 'Verificando tu configuración de pagos…'}
                </p>
            </div>
        </div>
    );
}

export default StripeOnboardingReturnPage;
