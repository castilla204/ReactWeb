import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Loader2, Calendar, User, FileText } from 'lucide-react';
import { API_CONFIG } from '../config/api';
import { getAuthToken } from '../lib/auth';
import { Pagination } from './Pagination';

interface CriticalLog {
    id: number;
    message: string;
    details: string;  // ⭐ Según la guía: siempre presente (puede ser string vacío)
    createdAt: string;
    logType: {
        id: number;
        name: string;
        description: string | null;  // ⚠️ PUEDE SER NULL
        severityId: number;
    } | null;  // ⚠️ PUEDE SER NULL
    user: {
        id: number;
        name: string;
        email: string;
    } | null;  // ⚠️ PUEDE SER NULL
    additionalData: object | null;  // ⚠️ PUEDE SER NULL (JSON object, no string)
    // Campos legacy para compatibilidad
    source?: string;
    logTypeId?: number;
    userId?: number;
    relatedEntityType?: string;
    relatedEntityId?: number;
}

interface PaginatedLogsResponse {
    logs: CriticalLog[];
    pagination: {
        page: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
        hasNext: boolean;  // ⭐ Según la guía: hasNext (no hasNextPage)
        hasPrevious: boolean;  // ⭐ Según la guía: hasPrevious (no hasPreviousPage)
        // Campos legacy para compatibilidad
        hasNextPage?: boolean;
        hasPreviousPage?: boolean;
    };
}

const CriticalLogsPanel: React.FC = () => {
    const [logs, setLogs] = useState<CriticalLog[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<{
        page: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
        hasNext: boolean;  // ⭐ Según la guía
        hasPrevious: boolean;  // ⭐ Según la guía
        // Campos legacy para compatibilidad
        hasNextPage?: boolean;
        hasPreviousPage?: boolean;
    } | null>(null);
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(20);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = getAuthToken();
            if (!token) {
                throw new Error('No se encontró token de autenticación');
            }

            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.log.critical}?page=${page}&pageSize=${pageSize}`, {
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

            const data: any = await response.json();
            
            // ✅ NORMALIZAR respuesta según la guía
            const normalizedLogs = data.logs || [];
            const normalizedPagination = data.pagination ? {
                page: data.pagination.page || 1,
                pageSize: data.pagination.pageSize || pageSize,
                totalCount: data.pagination.totalCount || 0,
                totalPages: data.pagination.totalPages || 0,
                hasNext: data.pagination.hasNext ?? data.pagination.hasNextPage ?? false,
                hasPrevious: data.pagination.hasPrevious ?? data.pagination.hasPreviousPage ?? false,
                // Campos legacy para compatibilidad
                hasNextPage: data.pagination.hasNextPage,
                hasPreviousPage: data.pagination.hasPreviousPage,
            } : null;
            
            // Manejar respuesta paginada o no paginada
            if (normalizedLogs.length > 0 && normalizedPagination) {
                setLogs(normalizedLogs);
                setPagination(normalizedPagination);
            } else if (Array.isArray(data)) {
                setLogs(data);
                setPagination(null);
            } else {
                setLogs([]);
                setPagination(null);
            }
        } catch (err: any) {
            console.error('Error fetching critical logs:', err);
            setError(err.message || 'Error al obtener los logs críticos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, pageSize]);

    const getSeverityColor = (severityId?: number) => {
        // Asumiendo que severityId 1 = Critical, 2 = Error, 3 = Warning, etc.
        switch (severityId) {
            case 1:
                return 'bg-red-100 text-red-800 border-red-300';
            case 2:
                return 'bg-orange-100 text-orange-800 border-orange-300';
            case 3:
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Logs Críticos</h2>
                </div>
                <button
                    onClick={fetchLogs}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Cargando logs críticos...</span>
                </div>
            ) : error ? (
                <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-md">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-red-800">Error</p>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                </div>
            ) : logs.length === 0 ? (
                <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-500 text-lg">No hay logs críticos</p>
                    <p className="text-gray-400 text-sm mt-2">Los logs críticos aparecerán aquí cuando ocurran</p>
                </div>
            ) : (
                <>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Fecha
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tipo / Severidad
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Mensaje
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Origen
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Usuario
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Detalles
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                                    {formatDate(log.createdAt)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(log.logType?.severityId)}`}>
                                                    {log.logType?.name || 'Desconocido'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                                                <div className="flex items-start">
                                                    <FileText className="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <p className="font-medium">{log.message}</p>
                                                        {log.details && (
                                                            <p className="text-xs text-gray-500 mt-1">{log.details}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <code className="bg-gray-100 px-2 py-1 rounded text-xs">{log.source || 'Sistema'}</code>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {log.user ? (
                                                    <div className="flex items-center">
                                                        <User className="w-4 h-4 mr-2 text-gray-400" />
                                                        <div>
                                                            <p className="font-medium text-gray-900">{log.user.name}</p>
                                                            <p className="text-xs text-gray-500">{log.user.email}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {log.relatedEntityType && log.relatedEntityId && (
                                                    <div>
                                                        <p className="text-xs">
                                                            <span className="font-medium">{log.relatedEntityType}:</span> {log.relatedEntityId}
                                                        </p>
                                                    </div>
                                                )}
                                                {log.additionalData && (
                                                    <details className="mt-1">
                                                        <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                                                            Ver datos adicionales
                                                        </summary>
                                                        <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32">
                                                            {typeof log.additionalData === 'object' && log.additionalData !== null
                                                                ? JSON.stringify(log.additionalData, null, 2)
                                                                : String(log.additionalData || 'Sin datos adicionales')}
                                                        </pre>
                                                    </details>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {pagination && (
                            <Pagination
                                page={pagination.page}
                                pageSize={pagination.pageSize}
                                totalCount={pagination.totalCount}
                                totalPages={pagination.totalPages}
                                hasNextPage={pagination.hasNext ?? pagination.hasNextPage ?? false}
                                hasPreviousPage={pagination.hasPrevious ?? pagination.hasPreviousPage ?? false}
                                onPageChange={(newPage) => {
                                    setPage(newPage);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                onPageSizeChange={(newPageSize) => {
                                    setPageSize(newPageSize);
                                    setPage(1);
                                }}
                            />
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default CriticalLogsPanel;

