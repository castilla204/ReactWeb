import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_CONFIG } from '../config/api';
import { showToast } from '../lib/toast';
import { SileoPageLoader } from '../components/ui/sileo-loader';
import SEO from '../components/SEO';

// 🛡️ N12: verificamos la session contra el backend ANTES de dar el pago por bueno.
// Sin esta verificación, alguien podría navegar a /success sin haber pagado y ver una
// confirmación falsa. El endpoint valida con Stripe que la sesión está completada y que
// el userId del metadata coincide con el usuario autenticado del JWT.
export function PaymentSuccessPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const handledRef = useRef(false);

    useEffect(() => {
        if (handledRef.current) return;
        handledRef.current = true;

        const goToPanel = () => navigate('/busquedas', { replace: true });
        const sessionId = searchParams.get('session_id');

        if (!sessionId) {
            showToast('error', 'No pudimos verificar el pago. Revisa tus contrataciones.', 5000, { surface: 'homepage' });
            goToPanel();
            return;
        }

        const verify = async () => {
            try {
                const token = localStorage.getItem('token') || localStorage.getItem('authToken') || '';
                const res = await fetch(`${API_CONFIG.baseUrl}/api/subscription/verify-checkout-session/${encodeURIComponent(sessionId)}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    credentials: 'include'
                });
                const data = res.ok ? await res.json() : null;
                if (data?.valid === true) {
                    sessionStorage.removeItem('pendingHire');
                    showToast(
                        'success',
                        '✨ ¡Reserva recibida! Aún no se ha cobrado nada: el experto tiene que confirmar la cita y el cargo se hará en ese momento.',
                        5000,
                        { surface: 'homepage' },
                    );
                } else {
                    showToast('error', 'No pudimos verificar el pago. Revisa tus contrataciones.', 5000, { surface: 'homepage' });
                }
            } catch {
                showToast('error', 'No pudimos verificar el pago. Revisa tus contrataciones.', 5000, { surface: 'homepage' });
            } finally {
                goToPanel();
            }
        };
        verify();
    }, [searchParams, navigate]);

    return (
        <>
            <SEO title="Procesando tu reserva | Inspecciono" description="Confirmando el resultado de tu pago." noindex />
            <SileoPageLoader message="Procesando tu reserva…" className="bg-white" />
        </>
    );
}
