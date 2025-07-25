import React from 'react'; import { Search, Loader2 } from 'lucide-react'; import { useCategories } from '../../contexts/CategoryContext';

interface Hire { id: number; searchId: number | null; client: { name: string; email: string }; service: { categoryId: number }; serviceType: { name: string } | null; status: 'pending' | 'awaiting_client_decision' | 'disputed' | 'completed' | 'cancelled' | 'transfer_failed' | 'dispute-resolved'; createdAt: string; amount: number; }

interface HiresTabProps { activeTab: 'services' | 'hires'; hireTab: 'active' | 'inactive'; hires: Hire[]; isLoadingHires: boolean; hiresError: Error | null; filters: { clientName: string; status: string; dateFrom: string; dateTo: string }; setHireTab: (value: 'active' | 'inactive') => void; setFilters: (value: { clientName: string; status: string; dateFrom: string; dateTo: string }) => void; handleViewHire: (hireId: number | null) => void; categories: { id: number; name: string }[] | undefined; }

export function HiresTab({ activeTab, hireTab, hires, isLoadingHires, hiresError, filters, setHireTab, setFilters, handleViewHire, categories, }: HiresTabProps) {
    if (!activeTab || activeTab !== 'hires') return null;

    const activeHires = hires.filter((hire) => ['pending', 'awaiting_client_decision', 'disputed'].includes(hire.status));
    const inactiveHires = hires.filter((hire) => ['completed', 'cancelled', 'transfer_failed', 'dispute-resolved'].includes(hire.status));
    const filteredHires = (hireTab === 'active' ? activeHires : inactiveHires).filter((hire) => {
        const matchesClient = !filters.clientName || hire.client.name.toLowerCase().includes(filters.clientName.toLowerCase());
        const matchesStatus = !filters.status || hire.status === filters.status;
        const hireDate = new Date(hire.createdAt);
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const toDate = filters.dateTo ? new Date(filters.dateTo) : null;
        const matchesDate = (!fromDate || hireDate >= fromDate) && (!toDate || hireDate <= toDate);
        return matchesClient && matchesStatus && matchesDate;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-px bg-gray-200 rounded-lg overflow-hidden">
                    <button
                        onClick={() => { setHireTab('active'); setFilters({ clientName: '', status: '', dateFrom: '', dateTo: '' }); }}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${hireTab === 'active' ? 'bg-white text-blue-600 shadow-inner' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        Activas ({activeHires.length})
                    </button>
                    <button
                        onClick={() => { setHireTab('inactive'); setFilters({ clientName: '', status: '', dateFrom: '', dateTo: '' }); }}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${hireTab === 'inactive' ? 'bg-white text-blue-600 shadow-inner' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        Inactivas ({inactiveHires.length})
                    </button>
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Filtrar por cliente..."
                        value={filters.clientName}
                        onChange={(e) => setFilters({ ...filters, clientName: e.target.value })}
                        className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                        className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Todos los estados</option>
                        <option value="pending">Pendiente</option>
                        <option value="awaiting_client_decision">Esperando Decisión</option>
                        <option value="disputed">Disputado</option>
                        <option value="completed">Completado</option>
                        <option value="cancelled">Cancelado</option>
                        <option value="transfer_failed">Transferencia Fallida</option>
                        <option value="dispute-resolved">Disputa Resuelta</option>
                    </select>
                    <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                        className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                        className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            {isLoadingHires ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
            ) : hiresError ? (
                <div className="text-center py-12 bg-red-50 text-red-600 rounded border border-red-200 shadow-lg">
                    <p>Error al cargar contrataciones: {hiresError.message}</p>
                </div>
            ) : filteredHires.length === 0 ? (
                <div className="text-center py-12 bg-white rounded border border-gray-200 shadow-lg">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                        No tienes contrataciones {hireTab === 'active' ? 'activas' : 'inactivas'} con los filtros aplicados
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredHires.map((hire) => (
                        <div
                            key={hire.id}
                            className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all"
                        >
                            <div className="h-6 px-4 flex items-center" style={{
                                backgroundColor:
                                    hire.status === 'completed' ? 'rgba(16, 185, 129, 0.3)' :
                                        hire.status === 'pending' ? 'rgba(59, 130, 246, 0.3)' :
                                            hire.status === 'awaiting_client_decision' ? 'rgba(245, 158, 11, 0.3)' :
                                                hire.status === 'disputed' ? 'rgba(249, 115, 22, 0.3)' :
                                                    hire.status === 'cancelled' ? 'rgba(239, 68, 68, 0.3)' :
                                                        hire.status === 'transfer_failed' ? 'rgba(239, 68, 68, 0.3)' :
                                                            hire.status === 'dispute-resolved' ? 'rgba(16, 185, 129, 0.3)' :
                                                                'rgba(75, 85, 99, 0.3)'
                            }}>
                                <h3 className="font-medium text-gray-800 text-sm">
                                    {hire.client.name}
                                </h3>
                            </div>
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-500">
                                        {new Date(hire.createdAt).toLocaleDateString()}
                                    </span>
                                    <span
                                        className={`px-2 py-1 rounded text-xs font-medium ${hire.status === 'completed' ? 'bg-green-100 text-green-600' :
                                            hire.status === 'pending' ? 'bg-blue-100 text-blue-600' :
                                                hire.status === 'awaiting_client_decision' ? 'bg-yellow-100 text-yellow-600' :
                                                    hire.status === 'disputed' ? 'bg-orange-100 text-orange-600' :
                                                        hire.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                                                            hire.status === 'transfer_failed' ? 'bg-red-100 text-red-600' :
                                                                hire.status === 'dispute-resolved' ? 'bg-green-100 text-green-600' :
                                                                    'bg-gray-100 text-gray-600'
                                            }`}
                                    >
                                        {hire.status === 'pending' ? 'Pendiente' :
                                            hire.status === 'awaiting_client_decision' ? 'Esperando Decisión' :
                                                hire.status === 'disputed' ? 'Disputado' :
                                                    hire.status === 'completed' ? 'Completado' :
                                                        hire.status === 'cancelled' ? 'Cancelado' :
                                                            hire.status === 'transfer_failed' ? 'Transferencia Fallida' :
                                                                hire.status === 'dispute-resolved' ? 'Disputa Resuelta' : hire.status}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Servicio</span>
                                        <span className="font-medium text-gray-900">
                                            {categories?.find(c => c.id === hire.service.categoryId)?.name || 'Sin categoría'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Tipo de Servicio</span>
                                        <span className="font-medium text-gray-900">
                                            {hire.serviceType?.name || 'Desconocido'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Fecha</span>
                                        <span className="text-gray-900">
                                            {new Date(hire.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Monto</span>
                                        <span className="font-medium text-gray-900">
                                            {new Intl.NumberFormat('es-ES', {
                                                style: 'currency',
                                                currency: 'EUR',
                                            }).format(hire.amount)}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-2 space-y-1">
                                    <button
                                        onClick={() => handleViewHire(hire.id)}
                                        className="w-full px-2 py-1 bg-blue-600 text-white hover:bg-blue-700 transition-colors text-xs flex items-center justify-center gap-1"
                                    >
                                        <Search className="w-3 h-3" />
                                        Ver Contratación
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

}