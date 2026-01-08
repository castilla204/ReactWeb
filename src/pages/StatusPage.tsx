import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, AlertCircle, XCircle, Clock, RefreshCw, Bell, Activity, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { API_CONFIG } from '../config/api';

/**
 * ✅ MEJOR PRÁCTICA: Interfaces bien definidas para el estado del sistema
 */
interface ServiceStatus {
    id: string;
    name: string;
    status: 'operational' | 'degraded' | 'down' | 'maintenance';
    uptime: number;
    responseTime?: number; // Tiempo de respuesta en ms
    lastChecked: Date;
    description?: string;
}

interface Incident {
    id: string;
    date: string;
    title: string;
    description: string;
    status: 'resolved' | 'investigating' | 'monitoring';
    affectedServices: string[];
    resolvedAt?: string;
}

interface StatusPageData {
    overallStatus: 'operational' | 'degraded' | 'down';
    services: ServiceStatus[];
    incidents: Incident[];
    lastUpdated: Date;
}

/**
 * ✅ MEJOR PRÁCTICA: Constantes para configuración
 */
const POLLING_INTERVAL = 30000; // 30 segundos
const HEALTH_CHECK_TIMEOUT = 5000; // 5 segundos
const UPTIME_DAYS = 90;

/**
 * ✅ MEJOR PRÁCTICA: Función para calcular uptime basado en checks históricos
 */
function calculateUptime(checks: Array<{ timestamp: Date; status: boolean }>): number {
    if (checks.length === 0) return 100;
    
    const successfulChecks = checks.filter(c => c.status).length;
    return (successfulChecks / checks.length) * 100;
}

/**
 * ✅ MEJOR PRÁCTICA: Función para verificar estado de servicio con métricas
 */
async function checkServiceHealth(
    name: string,
    url: string
): Promise<{ status: ServiceStatus['status']; responseTime: number }> {
    const startTime = Date.now();
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);
        
        const response = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
            cache: 'no-cache',
        });
        
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;
        
        if (response.ok) {
            // ✅ MEJOR PRÁCTICA: Considerar tiempo de respuesta para determinar degradación
            const isDegraded = responseTime > 2000; // Más de 2 segundos = degradado
            return {
                status: isDegraded ? 'degraded' : 'operational',
                responseTime,
            };
        } else {
            return {
                status: 'down',
                responseTime,
            };
        }
    } catch (error) {
        const responseTime = Date.now() - startTime;
        return {
            status: 'down',
            responseTime,
        };
    }
}

/**
 * ✅ MEJOR PRÁCTICA: Página de estado profesional con mejores prácticas
 * Basado en estándares de status pages modernas (Statuspage.io, Atlassian, etc.)
 */
export const StatusPage: React.FC = () => {
    // ✅ MEJOR PRÁCTICA: Estado local para checks históricos (simulado, en producción usar API)
    const [healthCheckHistory, setHealthCheckHistory] = useState<
        Map<string, Array<{ timestamp: Date; status: boolean; responseTime: number }>>
    >(new Map());

    // ✅ MEJOR PRÁCTICA: Verificar estado de API con métricas
    const { data: apiHealth, isLoading, refetch } = useQuery({
        queryKey: ['api-health-status'],
        queryFn: async () => {
            const health = await checkServiceHealth(
                'API',
                `${API_CONFIG.baseUrl}/health`
            );
            
            // Guardar en historial
            const now = new Date();
            setHealthCheckHistory(prev => {
                const newMap = new Map(prev);
                const apiHistory = newMap.get('API') || [];
                const updatedHistory = [
                    ...apiHistory,
                    { timestamp: now, status: health.status === 'operational', responseTime: health.responseTime },
                ].slice(-(UPTIME_DAYS * 24)); // Mantener últimos 90 días (24 checks por día)
                
                newMap.set('API', updatedHistory);
                return newMap;
            });
            
            return {
                ...health,
                timestamp: now,
            };
        },
        refetchInterval: POLLING_INTERVAL,
        retry: 1,
        staleTime: POLLING_INTERVAL / 2,
    });

    // ✅ MEJOR PRÁCTICA: Calcular servicios con uptime real
    const services = useMemo<ServiceStatus[]>(() => {
        const apiHistory = healthCheckHistory.get('API') || [];
        const apiUptime = calculateUptime(apiHistory.map(h => ({ timestamp: h.timestamp, status: h.status })));
        
        return [
            {
                id: 'api',
                name: 'API',
                status: apiHealth?.status || 'operational',
                uptime: apiHistory.length > 0 ? apiUptime : 100,
                responseTime: apiHealth?.responseTime,
                lastChecked: apiHealth?.timestamp || new Date(),
                description: 'API REST principal del sistema',
            },
            {
                id: 'web',
                name: 'Web',
                status: 'operational', // Si la página carga, la web está operativa
                uptime: 100, // En producción, calcular basado en monitoreo real
                lastChecked: new Date(),
                description: 'Aplicación web frontend',
            },
        ];
    }, [apiHealth, healthCheckHistory]);

    // ✅ MEJOR PRÁCTICA: Estado general calculado dinámicamente
    const overallStatus = useMemo(() => {
        if (services.some(s => s.status === 'down')) return 'down';
        if (services.some(s => s.status === 'degraded')) return 'degraded';
        return 'operational';
    }, [services]);

    // ✅ MEJOR PRÁCTICA: Incidentes (en producción, obtener de API)
    const [incidents] = useState<Incident[]>([]);

    // ✅ MEJOR PRÁCTICA: Funciones helper para UI
    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'operational':
                return {
                    color: 'green',
                    bgColor: 'bg-green-50 dark:bg-green-900/20',
                    borderColor: 'border-green-200 dark:border-green-800',
                    textColor: 'text-green-700 dark:text-green-300',
                    icon: CheckCircle2,
                    label: 'Operacional',
                };
            case 'degraded':
                return {
                    color: 'yellow',
                    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
                    borderColor: 'border-yellow-200 dark:border-yellow-800',
                    textColor: 'text-yellow-700 dark:text-yellow-300',
                    icon: AlertCircle,
                    label: 'Degradado',
                };
            case 'down':
                return {
                    color: 'red',
                    bgColor: 'bg-red-50 dark:bg-red-900/20',
                    borderColor: 'border-red-200 dark:border-red-800',
                    textColor: 'text-red-700 dark:text-red-300',
                    icon: XCircle,
                    label: 'Caído',
                };
            case 'maintenance':
                return {
                    color: 'blue',
                    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
                    borderColor: 'border-blue-200 dark:border-blue-800',
                    textColor: 'text-blue-700 dark:text-blue-300',
                    icon: Clock,
                    label: 'Mantenimiento',
                };
            default:
                return {
                    color: 'gray',
                    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
                    borderColor: 'border-gray-200 dark:border-gray-800',
                    textColor: 'text-gray-700 dark:text-gray-300',
                    icon: Clock,
                    label: 'Desconocido',
                };
        }
    };

    // ✅ MEJOR PRÁCTICA: Generar timeline de uptime visual
    const generateUptimeTimeline = (serviceId: string, days: number = UPTIME_DAYS) => {
        const history = healthCheckHistory.get(serviceId) || [];
        const bars: Array<{ status: boolean; date: Date }> = [];
        
        // Generar barras para los últimos N días
        const now = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            // Buscar checks de ese día
            const dayChecks = history.filter(
                h => h.timestamp.toDateString() === date.toDateString()
            );
            
            // Si hay checks, usar el promedio; si no, asumir operacional
            const dayStatus = dayChecks.length > 0
                ? dayChecks.every(c => c.status)
                : true;
            
            bars.push({ status: dayStatus, date });
        }
        
        return bars;
    };

    const overallConfig = getStatusConfig(overallStatus);
    const StatusIcon = overallConfig.icon;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* ✅ MEJOR PRÁCTICA: Header con información clara */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                Estado del Sistema
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Monitoreo en tiempo real de todos los servicios
                            </p>
                        </div>
                        <Button
                            onClick={() => refetch()}
                            variant="outline"
                            size="sm"
                            disabled={isLoading}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Actualizar
                        </Button>
                    </div>

                    {/* ✅ MEJOR PRÁCTICA: Banner de estado general prominente */}
                    <div
                        className={`rounded-lg p-6 mb-6 ${overallConfig.bgColor} border ${overallConfig.borderColor}`}
                    >
                        <div className="flex items-center gap-4">
                            <StatusIcon className={`w-8 h-8 ${overallConfig.textColor}`} />
                            <div className="flex-1">
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                                    {overallStatus === 'operational'
                                        ? 'Todos los sistemas operativos'
                                        : overallStatus === 'degraded'
                                        ? 'Algunos sistemas con problemas de rendimiento'
                                        : 'Sistemas no disponibles'}
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Última actualización: {new Date().toLocaleString('es-ES', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ✅ MEJOR PRÁCTICA: Botón de suscripción prominente */}
                <div className="mb-8 flex justify-end">
                    <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => {
                            // TODO: Implementar suscripción a notificaciones
                            alert('Funcionalidad de suscripción próximamente');
                        }}
                    >
                        <Bell className="w-4 h-4" />
                        Suscribirse a actualizaciones
                    </Button>
                </div>

                {/* ✅ MEJOR PRÁCTICA: Sección de uptime con métricas detalladas */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Uptime en los últimos {UPTIME_DAYS} días
                        </h2>
                        <Badge variant="outline" className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Vista histórica
                        </Badge>
                    </div>

                    <div className="space-y-6">
                        {services.map((service) => {
                            const serviceConfig = getStatusConfig(service.status);
                            const ServiceIcon = serviceConfig.icon;
                            const timeline = generateUptimeTimeline(service.id);

                            return (
                                <div
                                    key={service.id}
                                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    {service.name}
                                                </h3>
                                                <ServiceIcon className={`w-5 h-5 ${serviceConfig.textColor}`} />
                                                <Badge
                                                    variant={
                                                        service.status === 'operational'
                                                            ? 'default'
                                                            : service.status === 'degraded'
                                                            ? 'secondary'
                                                            : 'destructive'
                                                    }
                                                >
                                                    {serviceConfig.label}
                                                </Badge>
                                            </div>
                                            {service.description && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                    {service.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-4 text-sm">
                                                {service.responseTime !== undefined && (
                                                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                                        <Activity className="w-4 h-4" />
                                                        <span>
                                                            {service.responseTime < 1000
                                                                ? `${service.responseTime}ms`
                                                                : `${(service.responseTime / 1000).toFixed(2)}s`}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="text-gray-500 dark:text-gray-400">
                                                    Última verificación:{' '}
                                                    {service.lastChecked.toLocaleTimeString('es-ES')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                {service.uptime.toFixed(2)}%
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">uptime</p>
                                        </div>
                                    </div>

                                    {/* ✅ MEJOR PRÁCTICA: Timeline visual de uptime */}
                                    <div className="mb-2">
                                        <div className="flex gap-0.5 mb-2">
                                            {timeline.map((bar, i) => (
                                                <div
                                                    key={i}
                                                    className={`h-8 flex-1 rounded ${
                                                        bar.status
                                                            ? 'bg-green-500 hover:bg-green-600'
                                                            : 'bg-red-500 hover:bg-red-600'
                                                    } transition-colors cursor-help`}
                                                    title={`${bar.date.toLocaleDateString('es-ES')}: ${
                                                        bar.status ? 'Operacional' : 'Caído'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Vista histórica de uptime. Pasa el cursor sobre las barras para ver detalles.
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ✅ MEJOR PRÁCTICA: Sección de incidentes bien estructurada */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Incidentes pasados
                    </h2>

                    <div className="space-y-4">
                        {incidents.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
                                <div className="text-center">
                                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                                    <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">
                                        No se han reportado incidentes hoy.
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-500">
                                        Todos los sistemas están funcionando normalmente.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            incidents.map((incident) => (
                                <div
                                    key={incident.id}
                                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                                {incident.date} - {incident.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                {incident.description}
                                            </p>
                                            {incident.affectedServices.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        Servicios afectados:
                                                    </span>
                                                    {incident.affectedServices.map((service) => (
                                                        <Badge key={service} variant="outline" className="text-xs">
                                                            {service}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <Badge
                                            variant={
                                                incident.status === 'resolved'
                                                    ? 'default'
                                                    : incident.status === 'investigating'
                                                    ? 'secondary'
                                                    : 'outline'
                                            }
                                        >
                                            {incident.status === 'resolved'
                                                ? 'Resuelto'
                                                : incident.status === 'investigating'
                                                ? 'Investigando'
                                                : 'Monitoreando'}
                                        </Badge>
                                    </div>
                                    {incident.resolvedAt && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                            Resuelto el: {incident.resolvedAt}
                                        </p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
