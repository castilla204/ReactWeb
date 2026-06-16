import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../lib/toast';

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
        // Limpiamos el estado pendiente: el pago no se completó.
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
            // Sin serviceId (p. ej. flujo de creación de búsqueda): volvemos a crear búsqueda.
            navigate('/crear-busqueda', { replace: true });
        }
    }, [navigate]);

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
            <div className="animate-spin h-10 w-10 border-4 border-gray-300 border-t-gray-900 rounded-full mb-4" />
            <p className="text-gray-500 text-sm">Volviendo…</p>
        </div>
    );
}
