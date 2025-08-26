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
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-8">
                <div className="inline-flex bg-gray-100 rounded-xl p-1">
                    <button
                        onClick={() => { setHireTab('active'); setFilters({ clientName: '', status: '', dateFrom: '', dateTo: '' }); }}
                        className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${
                            hireTab === 'active' 
                                ? 'bg-white text-gray-900 shadow-sm' 
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Activas ({activeHires.length})
                    </button>
                    <button
                        onClick={() => { setHireTab('inactive'); setFilters({ clientName: '', status: '', dateFrom: '', dateTo: '' }); }}
                        className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${
                            hireTab === 'inactive' 
                                ? 'bg-white text-gray-900 shadow-sm' 
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Inactivas ({inactiveHires.length})
                    </button>
                </div>
                
                <div className="flex flex-wrap gap-3">
                    <input
                        type="text"
                        placeholder="Filtrar por cliente..."
                        value={filters.clientName}
                        onChange={(e) => setFilters({ ...filters, clientName: e.target.value })}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                    <input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredHires.map((hire) => (
                        <div
                            key={hire.id}
                            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
                        >
                            {/* Header con cliente y estado */}
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                                            <span className="text-sm font-semibold text-blue-700">
                                                {hire.client.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 text-base">
                                                {hire.client.name}
                                            </h3>
                                            <p className="text-xs text-gray-500">{hire.client.email}</p>
                                        </div>
                                    </div>
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            hire.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            hire.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                                            hire.status === 'awaiting_client_decision' ? 'bg-amber-100 text-amber-700' :
                                            hire.status === 'disputed' ? 'bg-orange-100 text-orange-700' :
                                            hire.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                            hire.status === 'transfer_failed' ? 'bg-red-100 text-red-700' :
                                            hire.status === 'dispute-resolved' ? 'bg-green-100 text-green-700' :
                                            'bg-gray-100 text-gray-700'
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
                            </div>

                            {/* Contenido de la tarjeta */}
                            <div className="px-6 py-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Servicio</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {categories?.find(c => c.id === hire.service.categoryId)?.name || 'Sin categoría'}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Tipo</span>
                                        <span className="text-sm font-medium text-gray-900 text-right max-w-[150px] truncate">
                                            {hire.serviceType?.name || 'Desconocido'}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Fecha</span>
                                        <span className="text-sm text-gray-900">
                                            {new Date(hire.createdAt).toLocaleDateString('es-ES', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                        <span className="text-sm font-medium text-gray-700">Monto</span>
                                        <span className="text-lg font-bold text-gray-900">
                                            {new Intl.NumberFormat('es-ES', {
                                                style: 'currency',
                                                currency: 'EUR',
                                            }).format(hire.amount)}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleViewHire(hire.id)}
                                    className="w-full mt-4 px-4 py-2 bg-black hover:bg-gray-800 text-white text-xs font-medium rounded-md transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <Search className="w-3 h-3" />
                                    Ver Contratación
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

}