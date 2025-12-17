import { X, ArrowLeft, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PaymentCancelPage() {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Elegant Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-50/50 via-white to-white" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-red-100/10 rounded-full blur-3xl -z-10" />
            </div>
            
            <div className="relative z-10 max-w-lg w-full bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] border border-gray-100/80 p-8 md:p-12 text-center">
                {/* Cancel Icon Animation */}
                <div className="mx-auto w-20 h-20 mb-8 relative group">
                    <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-20 duration-1000" />
                    <div className="relative w-full h-full bg-gradient-to-tr from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-xl shadow-red-500/20 group-hover:scale-105 transition-transform duration-300">
                        <X className="w-9 h-9 text-white stroke-[3]" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
                    Pago cancelado
                </h1>
                
                <p className="text-gray-500 mb-8 text-lg leading-relaxed max-w-xs mx-auto">
                    El proceso de pago no se ha completado. No se ha realizado ningún cargo en tu cuenta.
                </p>

                {/* Professional Info Box */}
                <div className="mb-8 p-5 rounded-2xl bg-gray-50 border border-gray-100 text-left flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="font-semibold text-gray-900 text-sm mb-1">¿Ha habido algún problema?</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Puedes intentar realizar el pago nuevamente o contactar con soporte si el problema persiste.
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <Link
                        to="/crear-busqueda"
                        className="block w-full bg-gray-900 text-white font-semibold py-4 px-6 rounded-xl hover:bg-black transition-all shadow-lg shadow-gray-900/10 hover:shadow-xl hover:-translate-y-0.5"
                    >
                        Intentar de nuevo
                    </Link>
                    
                    <Link
                        to="/"
                        className="block w-full text-gray-500 font-medium py-3 px-6 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center justify-center gap-2 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Volver al inicio
                    </Link>
                </div>
            </div>
        </div>
    );
}
