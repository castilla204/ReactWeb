import { useEffect } from 'react';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import blueCheckImg from '../media/bluecheck.png';

export function PaymentSuccessPage() {
    useEffect(() => {
        window.dispatchEvent(new CustomEvent('showNotification', {
            detail: {
                type: 'success',
                message: '✨ ¡Pago procesado con éxito!'
            }
        }));
    }, []);

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
