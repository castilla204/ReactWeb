import React, { useState, useEffect } from 'react';
import { CreditCard, RefreshCw, AlertCircle, CheckCircle2, Loader2, Webhook, Plus, Trash2, Edit, Copy, Check } from 'lucide-react';
import { API_CONFIG } from '../config/api';
import { getAuthToken } from '../lib/auth';
import { Pagination } from './Pagination';

interface StripeModeResponse {
    mode: 'test' | 'production';
    keyPrefix: string;
    keyLength: number;
}

interface ToggleModeResponse {
    previousMode: 'test' | 'production';
    newMode: 'test' | 'production';
    message: string;
}

interface StripeWebhook {
    id: string;
    url: string;
    status: 'enabled' | 'disabled';
    description?: string;
    events: string[];
    created: number;
    secret?: string; // Solo cuando se crea/actualiza
}

interface WebhookFormData {
    webhookId?: string;
    url: string;
    description: string;
    enabled: boolean;
    events: string[];
}

const StripeModePanel: React.FC = () => {
    const [currentMode, setCurrentMode] = useState<'test' | 'production' | null>(null);
    const [keyPrefix, setKeyPrefix] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [toggling, setToggling] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Estados para webhooks
    const [webhooks, setWebhooks] = useState<StripeWebhook[]>([]);
    const [webhooksLoading, setWebhooksLoading] = useState<boolean>(false);
    const [webhooksPage, setWebhooksPage] = useState<number>(1);
    const [webhooksPageSize, setWebhooksPageSize] = useState<number>(20);
    const [webhooksPagination, setWebhooksPagination] = useState<{
        page: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    } | null>(null);
    const [showWebhookForm, setShowWebhookForm] = useState<boolean>(false);
    const [editingWebhook, setEditingWebhook] = useState<StripeWebhook | null>(null);
    const [webhookFormData, setWebhookFormData] = useState<WebhookFormData>({
        url: '',
        description: '',
        enabled: true,
        events: ['account.updated', 'checkout.session.completed', 'payment_intent.succeeded', 'payment_intent.payment_failed']
    });
    const [newWebhookSecret, setNewWebhookSecret] = useState<string | null>(null);
    const [copiedSecret, setCopiedSecret] = useState<boolean>(false);

    const fetchCurrentMode = async () => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);

            const token = getAuthToken();
            if (!token) {
                throw new Error('No se encontró token de autenticación');
            }

            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.admin.stripe.mode}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
                throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
            }

            const data: StripeModeResponse = await response.json();
            setCurrentMode(data.mode);
            setKeyPrefix(data.keyPrefix);
        } catch (err: any) {
            console.error('Error fetching Stripe mode:', err);
            setError(err.message || 'Error al obtener el modo actual de Stripe');
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = async (mode?: 'test' | 'production' | 'toggle') => {
        try {
            setToggling(true);
            setError(null);
            setSuccess(null);

            const token = getAuthToken();
            if (!token) {
                throw new Error('No se encontró token de autenticación');
            }

            let response: Response;
            
            // Si es 'toggle', usar el endpoint toggle-mode sin body
            // Si es 'test' o 'production', usar el endpoint mode con body
            if (mode === 'toggle' || !mode) {
                // Usar toggle-mode (no requiere body)
                response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.admin.stripe.toggleMode}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    // No enviar body para toggle-mode
                });
            } else {
                // Usar mode endpoint para establecer modo específico
                response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.admin.stripe.mode}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ Mode: mode === 'test' ? 'development' : 'production' }),
                });
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
                throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
            }

            const data: ToggleModeResponse = await response.json();
            setCurrentMode(data.newMode);
            setSuccess(`Modo cambiado de ${data.previousMode} a ${data.newMode}`);
            
            // Recargar el modo actual después de un breve delay
            setTimeout(() => {
                fetchCurrentMode();
            }, 1000);
        } catch (err: any) {
            console.error('Error toggling Stripe mode:', err);
            setError(err.message || 'Error al cambiar el modo de Stripe');
        } finally {
            setToggling(false);
        }
    };

    // Funciones para webhooks
    const fetchWebhooks = async () => {
        try {
            setWebhooksLoading(true);
            const token = getAuthToken();
            if (!token) {
                throw new Error('No se encontró token de autenticación');
            }

            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.admin.stripe.webhooks}?page=${webhooksPage}&pageSize=${webhooksPageSize}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
                throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            // Manejar respuesta paginada
            if (data.webhooks && data.pagination) {
                setWebhooks(Array.isArray(data.webhooks) ? data.webhooks : []);
                setWebhooksPagination(data.pagination);
            } else {
                // Fallback para respuesta sin paginación
                const webhooksArray = Array.isArray(data) ? data : (data.data || data.webhooks || []);
                setWebhooks(webhooksArray);
                setWebhooksPagination(null);
            }
        } catch (err: any) {
            console.error('Error fetching webhooks:', err);
            setError(err.message || 'Error al obtener los webhooks');
        } finally {
            setWebhooksLoading(false);
        }
    };

    const createOrUpdateWebhook = async () => {
        try {
            setWebhooksLoading(true);
            setError(null);
            setNewWebhookSecret(null);

            const token = getAuthToken();
            if (!token) {
                throw new Error('No se encontró token de autenticación');
            }

            const body: any = {
                url: webhookFormData.url,
                description: webhookFormData.description,
                enabled: webhookFormData.enabled,
                events: webhookFormData.events,
            };

            if (editingWebhook) {
                body.webhookId = editingWebhook.id;
            }

            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.admin.stripe.webhooks}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
                throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
            }

            const data: StripeWebhook = await response.json();
            
            if (data.secret) {
                setNewWebhookSecret(data.secret);
            }

            setSuccess(editingWebhook ? 'Webhook actualizado correctamente' : 'Webhook creado correctamente');
            setShowWebhookForm(false);
            setEditingWebhook(null);
            resetWebhookForm();
            await fetchWebhooks();
        } catch (err: any) {
            console.error('Error creating/updating webhook:', err);
            setError(err.message || 'Error al crear/actualizar el webhook');
        } finally {
            setWebhooksLoading(false);
        }
    };

    const deleteWebhook = async (webhookId: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este webhook?')) {
            return;
        }

        try {
            setWebhooksLoading(true);
            setError(null);

            const token = getAuthToken();
            if (!token) {
                throw new Error('No se encontró token de autenticación');
            }

            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.admin.stripe.webhook(webhookId)}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
                throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
            }

            setSuccess('Webhook eliminado correctamente');
            await fetchWebhooks();
        } catch (err: any) {
            console.error('Error deleting webhook:', err);
            setError(err.message || 'Error al eliminar el webhook');
        } finally {
            setWebhooksLoading(false);
        }
    };

    const resetWebhookForm = () => {
        setWebhookFormData({
            url: '',
            description: '',
            enabled: true,
            events: ['account.updated', 'checkout.session.completed', 'payment_intent.succeeded', 'payment_intent.payment_failed']
        });
    };

    const openEditWebhook = (webhook: StripeWebhook) => {
        setEditingWebhook(webhook);
        setWebhookFormData({
            webhookId: webhook.id,
            url: webhook.url || '',
            description: webhook.description || '',
            enabled: webhook.status === 'enabled',
            events: Array.isArray(webhook.events) ? webhook.events : []
        });
        setShowWebhookForm(true);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
    };

    useEffect(() => {
        fetchCurrentMode();
    }, []);

    useEffect(() => {
        fetchWebhooks();
    }, [webhooksPage, webhooksPageSize]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Configuración de Stripe</h2>
                </div>
                <button
                    onClick={fetchCurrentMode}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </button>
            </div>

            {/* Información del modo actual */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <span className="ml-2 text-gray-600">Cargando estado actual...</span>
                    </div>
                ) : error ? (
                    <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-md">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-red-800">Error</p>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                        </div>
                    </div>
                ) : currentMode ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Modo actual</p>
                                <div className="flex items-center space-x-2">
                                    <span
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                            currentMode === 'production'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}
                                    >
                                        {currentMode === 'production' ? '🔴 Producción' : '🧪 Prueba'}
                                    </span>
                                </div>
                            </div>
                            {keyPrefix && (
                                <div className="text-right">
                                    <p className="text-sm text-gray-600 mb-1">Prefijo de clave</p>
                                    <p className="text-sm font-mono text-gray-900">{keyPrefix}...</p>
                                </div>
                            )}
                        </div>

                        {success && (
                            <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-md">
                                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-green-800">Éxito</p>
                                    <p className="text-sm text-green-700 mt-1">{success}</p>
                                </div>
                            </div>
                        )}

                        {/* Advertencia importante */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start space-x-2">
                                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-yellow-800">
                                    <p className="font-medium mb-1">⚠️ Advertencia importante</p>
                                    <ul className="list-disc list-inside space-y-1 text-yellow-700">
                                        <li>El cambio de modo afecta a toda la aplicación inmediatamente</li>
                                        <li>Los controladores ya instanciados pueden requerir reinicio de la aplicación</li>
                                        <li>Verifica que estés usando el modo correcto antes de realizar transacciones reales</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Botones de acción */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cambiar modo</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => toggleMode('toggle')}
                        disabled={loading || toggling || !currentMode}
                        className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {toggling ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Cambiando...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Alternar modo
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => toggleMode('test')}
                        disabled={loading || toggling || currentMode === 'test'}
                        className="flex items-center justify-center px-6 py-3 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {toggling ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Cambiando...
                            </>
                        ) : (
                            <>
                                🧪 Modo Prueba
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => toggleMode('production')}
                        disabled={loading || toggling || currentMode === 'production'}
                        className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {toggling ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Cambiando...
                            </>
                        ) : (
                            <>
                                🔴 Modo Producción
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Información adicional */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                    <div className="text-sm text-blue-800">
                        <p className="font-medium mb-2">ℹ️ Información</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-700">
                            <li>El modo de prueba usa claves que comienzan con <code className="bg-blue-100 px-1 rounded">sk_test_</code></li>
                            <li>El modo de producción usa claves que comienzan con <code className="bg-blue-100 px-1 rounded">sk_live_</code></li>
                            <li>Los cambios se aplican inmediatamente a todas las nuevas peticiones</li>
                            <li>Algunos controladores pueden requerir reinicio de la aplicación para aplicar cambios</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Sección de Webhooks */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <Webhook className="w-6 h-6 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Gestión de Webhooks</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={fetchWebhooks}
                            disabled={webhooksLoading}
                            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${webhooksLoading ? 'animate-spin' : ''}`} />
                            Actualizar
                        </button>
                        <button
                            onClick={() => {
                                resetWebhookForm();
                                setEditingWebhook(null);
                                setShowWebhookForm(true);
                            }}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Nuevo Webhook
                        </button>
                    </div>
                </div>

                {/* Formulario de webhook */}
                {showWebhookForm && (
                    <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <h4 className="text-md font-semibold text-gray-900 mb-4">
                            {editingWebhook ? 'Editar Webhook' : 'Crear Nuevo Webhook'}
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                                <input
                                    type="url"
                                    value={webhookFormData.url}
                                    onChange={(e) => setWebhookFormData({ ...webhookFormData, url: e.target.value })}
                                    placeholder="https://inspeccionoapi-cgh5amebepbje7dz.spaincentral-01.azurewebsites.net/api/Subscription/webhook"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <input
                                    type="text"
                                    value={webhookFormData.description}
                                    onChange={(e) => setWebhookFormData({ ...webhookFormData, description: e.target.value })}
                                    placeholder="Webhook de producción"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Eventos</label>
                                <textarea
                                    value={Array.isArray(webhookFormData.events) ? webhookFormData.events.join(', ') : ''}
                                    onChange={(e) => setWebhookFormData({ 
                                        ...webhookFormData, 
                                        events: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                                    })}
                                    placeholder="account.updated, checkout.session.completed"
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">Separa los eventos con comas</p>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="enabled"
                                    checked={webhookFormData.enabled}
                                    onChange={(e) => setWebhookFormData({ ...webhookFormData, enabled: e.target.checked })}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="enabled" className="ml-2 text-sm text-gray-700">Habilitado</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={createOrUpdateWebhook}
                                    disabled={webhooksLoading || !webhookFormData.url}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {webhooksLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        editingWebhook ? 'Actualizar' : 'Crear'
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowWebhookForm(false);
                                        setEditingWebhook(null);
                                        resetWebhookForm();
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Signing Secret después de crear/actualizar */}
                {newWebhookSecret && (
                    <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                        <div className="flex items-start space-x-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-yellow-800 mb-2">
                                    ⚠️ Signing Secret - IMPORTANTE
                                </p>
                                <p className="text-sm text-yellow-700 mb-3">
                                    Guarda este secret en Google Cloud Secret Manager como <code className="bg-yellow-100 px-1 rounded">stripe-webhook-secret</code> (producción) o <code className="bg-yellow-100 px-1 rounded">stripe-webhook-secret-dev</code> (desarrollo):
                                </p>
                                <div className="flex items-center space-x-2 bg-white p-3 rounded border border-yellow-200">
                                    <code className="flex-1 text-sm font-mono text-gray-900 break-all">{newWebhookSecret}</code>
                                    <button
                                        onClick={() => copyToClipboard(newWebhookSecret)}
                                        className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors flex items-center"
                                    >
                                        {copiedSecret ? (
                                            <>
                                                <Check className="w-4 h-4 mr-1" />
                                                Copiado
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4 mr-1" />
                                                Copiar
                                            </>
                                        )}
                                    </button>
                                </div>
                                <p className="text-xs text-yellow-600 mt-2">
                                    Después de guardar el secret, reinicia la aplicación para que se cargue.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Lista de webhooks */}
                {webhooksLoading && webhooks.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <span className="ml-2 text-gray-600">Cargando webhooks...</span>
                    </div>
                ) : !Array.isArray(webhooks) || webhooks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Webhook className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p>No hay webhooks configurados</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {Array.isArray(webhooks) && webhooks.map((webhook) => (
                            <div key={webhook.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                                                webhook.status === 'enabled' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {webhook.status === 'enabled' ? '✓ Habilitado' : '✗ Deshabilitado'}
                                            </span>
                                            {webhook.description && (
                                                <span className="text-sm text-gray-600">{webhook.description}</span>
                                            )}
                                        </div>
                                        <p className="text-sm font-mono text-gray-900 mb-2 break-all">{webhook.url}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {Array.isArray(webhook.events) && webhook.events.length > 0 ? (
                                                webhook.events.map((event, idx) => (
                                                    <span key={idx} className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                                        {event}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-gray-500">Sin eventos configurados</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Creado: {webhook.created ? new Date(webhook.created * 1000).toLocaleString('es-ES') : 'Fecha no disponible'}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2 ml-4">
                                        <button
                                            onClick={() => openEditWebhook(webhook)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            title="Editar"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteWebhook(webhook.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {webhooksPagination && (
                    <Pagination
                        page={webhooksPagination.page}
                        pageSize={webhooksPagination.pageSize}
                        totalCount={webhooksPagination.totalCount}
                        totalPages={webhooksPagination.totalPages}
                        hasNextPage={webhooksPagination.hasNextPage}
                        hasPreviousPage={webhooksPagination.hasPreviousPage}
                        onPageChange={(newPage) => {
                            setWebhooksPage(newPage);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        onPageSizeChange={(newPageSize) => {
                            setWebhooksPageSize(newPageSize);
                            setWebhooksPage(1);
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default StripeModePanel;

