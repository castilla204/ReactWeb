import React, { useState } from 'react';
import { Check, X, Sparkles, Zap, Shield, Clock, Search, Bell } from 'lucide-react';
import { useSubscription, type Plan } from '../hooks/useSubscription.hooks';

export function SubscriptionPlans() {
    const [isYearly, setIsYearly] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { plans, currentPlan, subscriptionDetails, createCheckout } = useSubscription();

    // Check URL parameters for payment status
    const urlParams = new URLSearchParams(window.location.search);
    React.useEffect(() => {
        const checkPaymentStatus = async () => {
            if (urlParams.get('success')) {
                try {
                    // Verify the payment status with the API
                    await fetchApi('/api/Subscription/verify-payment', {
                        method: 'POST',
                        body: JSON.stringify({
                            sessionId: urlParams.get('session_id')
                        })
                    });
                    setSuccessMessage('¡Pago exitoso! Tu suscripción ha sido activada.');
                } catch (err) {
                    setError('Error al verificar el pago');
                }
            }
            if (urlParams.get('canceled')) {
                setError('El pago fue cancelado.');
            }
        };
        checkPaymentStatus();
    }, []);

    // Set yearly subscription based on current subscription
    React.useEffect(() => {
        if (subscriptionDetails.data?.isYearly) {
            setIsYearly(subscriptionDetails.data.isYearly);
        }
    }, [subscriptionDetails.data]);

    const getFeatures = (plan: Plan) => [
        {
            icon: <Search className="w-4 h-4" />,
            text: `Hasta ${plan.maxSearches} búsquedas simultáneas`,
            included: true
        },
        {
            icon: <Clock className="w-4 h-4" />,
            text: `Actualización cada ${Math.floor(plan.minSearchInterval / 60)} minutos`,
            included: true
        },
        {
            icon: <Bell className="w-4 h-4" />,
            text: 'Notificaciones por email',
            included: true
        },
        {
            icon: <Sparkles className="w-4 h-4" />,
            text: 'Filtros avanzados',
            included: plan.name !== 'Free'
        },
        {
            icon: <Shield className="w-4 h-4" />,
            text: 'Soporte prioritario',
            included: plan.name === 'Business'
        },
        {
            icon: <Zap className="w-4 h-4" />,
            text: 'Actualizaciones en tiempo real',
            included: plan.name === 'Business'
        }
    ];

    const handleSubscribe = async (plan: Plan) => {
        try {
            setError(null);
            if (plan.name === 'Free') {
                setError('No es posible suscribirse al plan gratuito');
                return;
            }
            const { url } = await createCheckout.mutateAsync({
                planId: plan.id,
                isYearly
            });
            // Ensure we have a valid URL before redirecting
            if (url && url.trim()) {
                window.location.href = url;
            } else {
                throw new Error('No se recibió una URL válida para el pago');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al procesar el pago');
            console.error('Error creating checkout session:', err);
        }
    };

    if (plans.isLoading || currentPlan.isLoading || subscriptionDetails.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-gray-400">Cargando planes...</div>
            </div>
        );
    }

    if (plans.error || currentPlan.error || subscriptionDetails.error) {
        return (
            <div className="flex items-center justify-center min-h-[50vh] text-red-400">
                {(plans.error || currentPlan.error || subscriptionDetails.error)?.message || 'Ha ocurrido un error'}
            </div>
        );
    }

    return (
        <div className="relative py-8 sm:py-16">
            {/* Background Effects */}
            <div className="absolute inset-0 -z-10">
                {/* Base layer with subtle gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-white to-blue-50" />

                {/* Animated gradient spheres */}
                <div className="absolute top-0 -right-1/4 w-full h-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-blue-300/10 to-transparent rounded-full blur-3xl animate-pulse" />
                </div>
                <div className="absolute bottom-0 -left-1/4 w-full h-full">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-blue-400/10 to-transparent rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
                </div>

                {/* Radial gradient overlays */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(37,99,235,0.1),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_80%,rgba(96,165,250,0.1),transparent_50%)]" />

                {/* Grid pattern */}
                <div className="absolute inset-0" style={{
                    backgroundImage: `
                        linear-gradient(to right, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px'
                }} />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-4xl text-center">
                    <h2 className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-600 text-sm font-medium mb-8">
                        Planes de Suscripción
                    </h2>
                    <p className="mt-2 text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                        <span className="text-gray-900">
                            Elige el plan perfecto
                        </span>
                        <br />
                        <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                            para tus necesidades
                        </span>
                    </p>
                </div>

                <div className="mt-6 flex justify-center">
                    <div className="relative flex rounded-full bg-white p-1 border border-gray-200 shadow-sm">
                        <button
                            type="button"
                            className={`flex items-center gap-1 rounded-full px-4 md:px-6 py-2 md:py-2.5 text-xs md:text-sm font-semibold transition-all ${!isYearly ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            onClick={() => setIsYearly(false)}
                        >
                            Mensual
                        </button>
                        <button
                            type="button"
                            className={`flex items-center gap-1 rounded-full px-4 md:px-6 py-2 md:py-2.5 text-xs md:text-sm font-semibold transition-all ${isYearly ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            onClick={() => setIsYearly(true)}
                        >
                            Anual <span className="text-xs opacity-75">(Ahorra 20%)</span>
                        </button>
                    </div>
                </div>

                <div className="isolate mx-auto mt-12 md:mt-16 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
                    {plans.data?.map((plan) => {
                        const features = getFeatures(plan);
                        const isCurrentPlan = currentPlan.data?.id === plan.id;

                        return (
                            <div
                                key={plan.id}
                                className={`relative rounded-2xl md:rounded-3xl p-6 md:p-8 transition-all duration-300 hover:translate-y-[-4px] ${plan.name === 'Pro'
                                    ? 'bg-white border-2 border-blue-500 shadow-xl'
                                    : 'bg-white border border-gray-200 shadow-lg'
                                    } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
                            >
                                {isCurrentPlan && (
                                    <div className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2 px-4 md:px-5 py-1.5 bg-green-500/90 text-white text-xs md:text-sm font-medium rounded-full shadow-lg backdrop-blur-xl border border-green-400/20">
                                        Plan Actual ({isYearly ? 'Anual' : 'Mensual'})
                                    </div>
                                )}

                                <h3 className="text-lg md:text-xl font-bold text-gray-900">
                                    {plan.name}
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-gray-500">{plan.description}</p>
                                <p className="mt-6 flex items-baseline gap-x-1">
                                    <span className="text-4xl md:text-5xl font-bold tracking-tight text-blue-600">
                                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(isYearly ? plan.priceYearly : plan.priceMonthly)}
                                    </span>
                                    <span className="text-xs md:text-sm font-semibold leading-6 text-gray-500">
                                        {isYearly ? '/año' : '/mes'}
                                    </span>
                                </p>

                                <ul role="list" className="mt-6 md:mt-8 space-y-2 md:space-y-3 text-xs md:text-sm leading-6 text-gray-600">
                                    {features.map((feature, index) => (
                                        <li key={index} className="flex gap-x-3">
                                            {feature.included ? (
                                                <>
                                                    <div className="flex items-center gap-2">
                                                        {feature.icon}
                                                        <Check className="h-3 md:h-4 w-3 md:w-4 flex-none text-green-500" />
                                                    </div>
                                                    <span>{feature.text}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-2 text-gray-500">
                                                        {feature.icon}
                                                        <X className="h-3 md:h-4 w-3 md:w-4 flex-none" />
                                                    </div>
                                                    <span className="text-gray-500">{feature.text}</span>
                                                </>
                                            )}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    type="button"
                                    disabled={isCurrentPlan || plan.name === 'Free' || createCheckout.isPending}
                                    onClick={() => handleSubscribe(plan)}
                                    className={`mt-8 w-full rounded-xl px-4 md:px-6 py-3 md:py-3.5 text-sm md:text-base font-semibold leading-6 text-white transition-all ${isCurrentPlan
                                        ? 'bg-green-500/90 cursor-default'
                                        : plan.name === 'Free'
                                            ? 'bg-gray-500/50 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30'
                                        }`}
                                >
                                    {isCurrentPlan
                                        ? `Plan ${isYearly ? 'Anual' : 'Mensual'} Actual`
                                        : plan.name === 'Free'
                                            ? 'Plan Gratuito'
                                            : createCheckout.isPending
                                                ? 'Procesando...'
                                                : 'Comenzar'}
                                </button>
                            </div>
                        );
                    })}
                </div>
                {error && (
                    <div className="mt-6 text-center text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100">
                        {error}
                    </div>
                )}
                {successMessage && (
                    <div className="mt-6 text-center text-sm text-green-600 bg-green-50 px-4 py-3 rounded-xl border border-green-100">
                        ¡Pago exitoso! Tu suscripción ha sido activada.
                    </div>
                )}
            </div>
        </div>
    );
}