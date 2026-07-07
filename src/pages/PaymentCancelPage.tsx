import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../lib/toast';
import { SileoPageLoader } from '../components/ui/sileo-loader';
import SEO from '../components/SEO';

// UX: en vez de una página dedicada de "pago cancelado", redirigimos de vuelta a la ficha del
// servicio (de donde venía la contratación) con un toast tranquilizador. El serviceId lo
// recuperamos de `pendingHire`, que el checkout guardó en sessionStorage antes de ir a Stripe.
export function PaymentCancelPage() {
    const navigate = useNavigate();
    const handledRef = useRef(false);

    useEffect(() => {
        if (handledRef.current) return;
        handledRef.current = true;

        let serviceId: number | string | null = null;
        try {
            const raw = sessionStorage.getItem('pendingHire');
            if (raw) {
                const parsed = JSON.parse(raw);
                serviceId = parsed?.serviceId ?? null;
            }
        } catch {
            serviceId = null;
        }
        sessionStorage.removeItem('pendingHire');

        showToast(
            'info',
            'Pago cancelado. No se ha realizado ningún cargo; puedes intentarlo cuando quieras.',
            4500,
            { surface: 'homepage' },
        );

        if (serviceId != null && `${serviceId}`.length > 0) {
            navigate(`/service/${serviceId}`, { replace: true });
        } else {
            navigate('/crear-busqueda', { replace: true });
        }
    }, [navigate]);

    return (
        <>
            <SEO title="Pago cancelado | Inspecciono" description="Has cancelado el proceso de pago." noindex />
            <SileoPageLoader message="Volviendo…" className="bg-white" />
        </>
    );
}
