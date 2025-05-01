import React, { useState } from 'react';
import { useSubscription } from '../hooks/useSubscription.hooks';
import { Check, Crown, Sparkles, ArrowRight, Loader2, XCircle } from 'lucide-react';
import type { Plan } from '../hooks/useSubscription.hooks';
import { useNavigate } from 'react-router-dom';

export function SubscriptionPlans() {
    const navigate = useNavigate();
    const { plans, currentPlan, subscriptionDetails, createCheckout, cancelSubscription } = useSubscription();
    const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    const handleSubscribe = async (plan: Plan) => {
        try {
            const result = await createCheckout.mutateAsync({
                planId: plan.id,
                isYearly: selectedBillingCycle === 'yearly'
            });

            if (result.url) {
                window.location.href = result.url;
            }
        } catch (error) {
            console.error('Error creating checkout session:', error);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: '❌ Error al procesar el pago'
                }
            }));
        }
    };

    const handleCancelSubscription = async () => {
        try {
            await cancelSubscription.mutateAsync();
            setShowCancelConfirm(false);
            navigate('/');
        } catch (error) {
            console.error('Error canceling subscription:', error);
        }
    };

    if (plans.isLoading || currentPlan.isLoading || subscriptionDetails.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex items-center gap-3 text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Cargando planes...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Planes y Precios
                </h1>
                <p className="text-gray-500 max-w-2xl mx-auto">
                    Elige el plan que mejor se adapte a tus necesidades. Todos los planes incluyen acceso a nuestras funciones principales.
                </p>
            </div>

            <div className="flex justify-center mb-8">
                <div className="bg-white rounded-xl p-1 shadow-sm border border-gray-200">
                    <button
                        onClick={() => setSelectedBillingCycle('monthly')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedBillingCycle === 'monthly'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Mensual
                    </button>
                    <button
                        onClick={() => setSelectedBillingCycle('yearly')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedBillingCycle === 'yearly'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Anual
                        <span className="ml-1 text-xs text-blue-200">-20%</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.data?.map((plan) => {
                    const price = selectedBillingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
                    const isCurrentPlan = currentPlan.data?.id === plan.id;

                    return (
                        <div
                            key={plan.id}
                            className={`relative bg-white rounded-2xl p-8 transition-all ${isCurrentPlan
                                ? 'ring-2 ring-blue-500 shadow-xl shadow-blue-500/10'
                                : 'border border-gray-200 shadow-lg hover:shadow-xl'
                                }`}
                        >
                            {isCurrentPlan && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                                    Plan Actual
                                </div>
                            )}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
                                    {plan.priceMonthly === 0 ? (
                                        <Sparkles className="w-6 h-6 text-white" />
                                    ) : (
                                        <Crown className="w-6 h-6 text-white" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                                    <p className="text-sm text-gray-500">{plan.description}</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-gray-900">
                                        {price === 0 ? 'Gratis' : `${price}€`}
                                    </span>
                                    {price > 0 && (
                                        <span className="text-gray-500">/{selectedBillingCycle === 'yearly' ? 'año' : 'mes'}</span>
                                    )}
                                </div>
                                {selectedBillingCycle === 'yearly' && price > 0 && (
                                    <p className="text-sm text-green-600 mt-1">
                                        Ahorra {((plan.priceMonthly * 12 - plan.priceYearly) / (plan.priceMonthly * 12) * 100).toFixed(0)}% con facturación anual
                                    </p>
                                )}
                            </div>

                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3 text-sm text-gray-600">
                                    <Check className="w-5 h-5 text-green-500" />
                                    <span>Hasta {plan.maxSearches} búsquedas activas</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm text-gray-600">
                                    <Check className="w-5 h-5 text-green-500" />
                                    <span>Actualización cada {plan.minSearchInterval}h</span>
                                </li>
                                {plan.priceMonthly > 0 && (
                                    <>
                                        <li className="flex items-center gap-3 text-sm text-gray-600">
                                            <Check className="w-5 h-5 text-green-500" />
                                            <span>Notificaciones por WhatsApp</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-sm text-gray-600">
                                            <Check className="w-5 h-5 text-green-500" />
                                            <span>Análisis de precios</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-sm text-gray-600">
                                            <Check className="w-5 h-5 text-green-500" />
                                            <span>Filtros avanzados</span>
                                        </li>
                                    </>
                                )}
                            </ul>

                            {isCurrentPlan ? (
                                <div className="space-y-3">
                                    <button
                                        disabled
                                        className="w-full px-6 py-3 bg-gray-100 text-gray-400 rounded-xl font-medium cursor-not-allowed"
                                    >
                                        Plan Actual
                                    </button>
                                    {plan.priceMonthly > 0 && (
                                        <button
                                            onClick={() => setShowCancelConfirm(true)}
                                            className="w-full px-6 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
                                        >
                                            Cancelar Suscripción
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleSubscribe(plan)}
                                    disabled={createCheckout.isPending}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                                >
                                    {createCheckout.isPending ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Procesando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Seleccionar Plan</span>
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Confirmation Modal */}
            {showCancelConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <XCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Cancelar Suscripción
                            </h3>
                        </div>
                        <p className="text-gray-600 mb-6">
                            ¿Estás seguro de que quieres cancelar tu suscripción? Perderás acceso a todas las funciones premium al final del período de facturación actual.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowCancelConfirm(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCancelSubscription}
                                disabled={cancelSubscription.isPending}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {cancelSubscription.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Cancelando...</span>
                                    </>
                                ) : (
                                    'Confirmar Cancelación'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}