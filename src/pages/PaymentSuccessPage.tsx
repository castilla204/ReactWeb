import { useEffect } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PaymentSuccessPage() {
    useEffect(() => {
        window.dispatchEvent(new CustomEvent('showNotification', {
            detail: {
                type: 'success',
                message: '✨ ¡Suscripción activada con éxito!'
            }
        }));
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center -mt-16">
            {/* Background Effects */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-white to-blue-50" />
                <div className="absolute top-0 -right-1/4 w-full h-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 via-blue-300/20 to-transparent rounded-full blur-3xl animate-pulse" />
                </div>
                <div className="absolute bottom-0 -left-1/4 w-full h-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/30 via-blue-400/20 to-transparent rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
                </div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(37,99,235,0.1),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_80%,rgba(96,165,250,0.1),transparent_50%)]" />
            </div>

            <div className="relative z-10 w-full max-w-md mx-4 bg-white/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-gray-100">
                <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/20 transform -rotate-6">
                        <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        ¡Pago Completado!
                    </h2>
                    <p className="text-gray-500 text-sm max-w-sm mx-auto mb-8">
                        Tu suscripción ha sido activada correctamente. Ya puedes disfrutar de todas las funcionalidades premium.
                    </p>
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl font-medium transition-all shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30"
                    >
                        Ir al Dashboard
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}