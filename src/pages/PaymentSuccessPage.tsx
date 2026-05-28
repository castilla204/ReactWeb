import { useEffect, useState } from 'react';
import { Check, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import blueCheckImg from '../media/bluecheck.png';
import { API_CONFIG } from '../config/api';

// 🛡️ N12: PaymentSuccessPage verifica la session contra el backend antes de mostrar éxito.
// Sin esta verificación, un atacante podría navegar a /success sin haber pagado y ver el
// mensaje de confirmación falso. El endpoint backend valida con Stripe que la sesión está
// completada y que el userId del metadata coincide con el usuario autenticado del JWT.
export function PaymentSuccessPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [state, setState] = useState<'verifying' | 'ok' | 'invalid'>('verifying');

    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        if (!sessionId) {
            setState('invalid');
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
                if (!res.ok) {
                    setState('invalid');
                    return;
                }
                const data = await res.json();
                if (data?.valid === true) {
                    setState('ok');
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: { type: 'success', message: '✨ ¡Pago procesado con éxito!' }
                    }));
                } else {
                    setState('invalid');
                }
            } catch {
                setState('invalid');
            }
        };
        verify();
    }, [searchParams]);

    if (state === 'verifying') {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
                <div className="animate-spin h-10 w-10 border-4 border-gray-300 border-t-gray-900 rounded-full mb-4" />
                <p className="text-gray-500 text-sm">Verificando tu pago…</p>
            </div>
        );
    }

    if (state === 'invalid') {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
                    <div className="mx-auto w-16 h-16 mb-6 bg-red-50 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-3">No pudimos verificar este pago</h1>
                    <p className="text-gray-500 mb-6">
                        Si efectivamente has pagado, revisa el detalle desde tu panel. Si no lo hiciste, ignora este aviso.
                    </p>
                    <div className="space-y-2">
                        <button
                            onClick={() => navigate('/busquedas')}
                            className="block w-full bg-gray-900 text-white font-semibold py-3 px-6 rounded-xl hover:bg-black transition-colors"
                        >
                            Ir a mis contrataciones
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="block w-full text-gray-500 font-medium py-2 px-6 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Volver al inicio
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Elegant Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-white" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-100/20 rounded-full blur-3xl -z-10" />
            </div>

            <div className="relative z-10 max-w-lg w-full bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] border border-gray-100/80 p-8 md:p-12 text-center">
                {/* Success Icon Animation */}
                <div className="mx-auto w-20 h-20 mb-8 relative group">
                    <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-20 duration-1000" />
                    <div className="relative w-full h-full bg-gradient-to-tr from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-green-500/20 group-hover:scale-105 transition-transform duration-300">
                        <Check className="w-9 h-9 text-white stroke-[3]" />
                    </div>
                    <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                        <Sparkles className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
                    ¡Pago realizado con éxito!
                </h1>

                <p className="text-gray-500 mb-8 text-lg leading-relaxed max-w-xs mx-auto">
                    Tu contratación se ha procesado correctamente. Ya puedes gestionar el servicio desde tu panel.
                </p>

                {/* Professional Image */}
                <div className="relative w-full h-48 mb-8 rounded-2xl overflow-hidden bg-gradient-to-b from-blue-50/50 to-white border border-gray-100 flex items-center justify-center group">
                    <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
                    <img
                        src={blueCheckImg}
                        alt="Success"
                        className="w-auto h-32 object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-500 ease-out"
                    />
                </div>

                <div className="space-y-3">
                    <Link
                        to="/busquedas"
                        className="block w-full bg-gray-900 text-white font-semibold py-4 px-6 rounded-xl hover:bg-black transition-all shadow-lg shadow-gray-900/10 hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
                    >
                        Ver mis contrataciones
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>

                    <Link
                        to="/"
                        className="block w-full text-gray-500 font-medium py-3 px-6 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                        Volver al inicio
                    </Link>
                </div>
            </div>
        </div>
    );
}
