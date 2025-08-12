// SubscriptionsPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, Loader2, CreditCard } from 'lucide-react';
import Background from '../components/Background';
import { useSubscription } from '../hooks/useSubscription.hooks';

const SubscriptionsPage: React.FC = () => {
    const navigate = useNavigate();
    const { loadMoney, isLoading } = useSubscription();

    const handleLoadMoney = async (amount: number) => {
        // Validate amount before calling loadMoney
        if (typeof amount !== 'number' || isNaN(amount) || amount <= 0 || amount > 1000) {
            console.error('Invalid amount:', amount);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: '❌ El monto debe ser un número entre 0.01 y 1000'
                }
            }));
            return;
        }

        try {
            const response = await loadMoney({ Amount: amount }); // Capture the response
            if (response?.url) {
                window.location.href = response.url; // Redirect to Stripe Checkout URL
            } else {
                throw new Error('No payment URL returned from the server');
            }
        } catch (error: any) {
            console.error('Error loading money:', error.message);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: `❌ Error al cargar dinero: ${error.message}`
                }
            }));
        }
    };

    return (
        <div className="relative min-h-screen">
            <Background />
            <div className="relative z-10">
                <button
                    onClick={() => navigate('/')}
                    className="ml-4 mt-4 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Volver
                </button>

                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="text-center mb-12">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            Recargar Saldo
                        </h1>
                        <p className="text-gray-500 max-w-2xl mx-auto">
                            Recarga tu saldo para poder contratar servicios de búsqueda de expertos
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {/* 10€ Card */}
                        <div className="bg-white rounded-2xl p-8 transition-all border border-gray-200 hover:border-blue-200 shadow-lg hover:shadow-xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
                                    <Wallet className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Recarga Básica</h3>
                                    <p className="text-sm text-gray-500">Ideal para empezar</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-gray-900">10€</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleLoadMoney(10)}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Procesando...</span>
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="w-5 h-5" />
                                        <span>Recargar 10€</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* 20€ Card */}
                        <div className="bg-white rounded-2xl p-8 transition-all border border-gray-200 hover:border-blue-200 shadow-lg hover:shadow-xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
                                    <Wallet className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Recarga Plus</h3>
                                    <p className="text-sm text-gray-500">Para búsquedas regulares</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-gray-900">20€</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleLoadMoney(20)}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Procesando...</span>
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="w-5 h-5" />
                                        <span>Recargar 20€</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* 50€ Card */}
                        <div className="bg-white rounded-2xl p-8 transition-all border border-gray-200 hover:border-blue-200 shadow-lg hover:shadow-xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
                                    <Wallet className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Recarga Pro</h3>
                                    <p className="text-sm text-gray-500">Para usuarios frecuentes</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-gray-900">50€</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleLoadMoney(50)}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Procesando...</span>
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="w-5 h-5" />
                                        <span>Recargar 50€</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionsPage;