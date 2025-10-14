import React from 'react'; import { Search, Loader2, MessageCircle } from 'lucide-react'; import { useCategories } from '../../contexts/CategoryContext';

interface Hire { 
    id: number; 
    searchId: number | null; 
    client: { name: string; email: string }; 
    service: { categoryId: number }; 
    serviceType: { name: string } | null; 
    status: 'pending' | 'awaiting_client_decision' | 'disputed' | 'completed' | 'cancelled' | 'transfer_failed' | 'dispute-resolved' | 'dispute-resolved-client' | 'dispute-resolved-expert'; 
    createdAt: string; 
    amount: number;
    // NUEVOS CAMPOS DEL BACKEND
    searchTitle?: string | null;
    searchDescription?: string | null;
    unreadMessagesCount: number;
}

interface HiresTabProps { activeTab: 'services' | 'hires'; hireTab: 'active' | 'inactive'; hires: Hire[]; isLoadingHires: boolean; hiresError: Error | null; filters: { clientName: string; status: string; dateFrom: string; dateTo: string }; setHireTab: (value: 'active' | 'inactive') => void; setFilters: (value: { clientName: string; status: string; dateFrom: string; dateTo: string }) => void; handleViewHire: (hireId: number | null) => void; categories: { id: number; name: string }[] | undefined; }

export function HiresTab({ activeTab, hireTab, hires, isLoadingHires, hiresError, filters, setHireTab, setFilters, handleViewHire, categories, }: HiresTabProps) {
    if (!activeTab || activeTab !== 'hires') return null;

    const activeHires = hires.filter((hire) => ['pending', 'awaiting_client_decision', 'disputed'].includes(hire.status));
    const inactiveHires = hires.filter((hire) => ['completed', 'cancelled', 'transfer_failed', 'dispute-resolved', 'dispute-resolved-client', 'dispute-resolved-expert'].includes(hire.status));
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
        <div className="p-3 sm:p-6">
            {/* Header con pestañas - móvil optimizado */}
            <div className="mb-4 sm:mb-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h2 className="text-base sm:text-lg font-semibold text-slate-900">Contrataciones</h2>
                    {(() => {
                        const totalUnreadMessages = filteredHires.reduce((total, hire) => total + hire.unreadMessagesCount, 0);
                        return totalUnreadMessages > 0 && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                <MessageCircle className="w-3 h-3" />
                                <span className="text-xs font-medium">{totalUnreadMessages}</span>
                            </div>
                        );
                    })()}
                </div>
                <div className="flex bg-slate-100 rounded-lg p-1">
                    <button
                        onClick={() => { setHireTab('active'); setFilters({ clientName: '', status: '', dateFrom: '', dateTo: '' }); }}
                        className={`flex-1 px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                            hireTab === 'active' 
                                ? 'bg-white text-slate-900 shadow-sm' 
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <span className="hidden sm:inline">Activas</span>
                        <span className="sm:hidden">Act.</span>
                        <span className="ml-1">({activeHires.length})</span>
                    </button>
                    <button
                        onClick={() => { setHireTab('inactive'); setFilters({ clientName: '', status: '', dateFrom: '', dateTo: '' }); }}
                        className={`flex-1 px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                            hireTab === 'inactive' 
                                ? 'bg-white text-slate-900 shadow-sm' 
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <span className="hidden sm:inline">Inactivas</span>
                        <span className="sm:hidden">Inact.</span>
                        <span className="ml-1">({inactiveHires.length})</span>
                    </button>
                </div>
            </div>

            {/* Filtros compactos - móvil optimizado */}
            <div className="mb-4 sm:mb-6 space-y-2 sm:space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                    <input
                        type="text"
                        placeholder="Filtrar por cliente..."
                        value={filters.clientName}
                        onChange={(e) => setFilters({ ...filters, clientName: e.target.value })}
                        className="px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                        className="px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                        <option value="">Todos los estados</option>
                        <option value="pending">Pendiente</option>
                        <option value="awaiting_client_decision">Esperando Decisión</option>
                        <option value="disputed">Disputado</option>
                        <option value="completed">Completado</option>
                        <option value="cancelled">Cancelado</option>
                        <option value="transfer_failed">Transferencia Fallida</option>
                        <option value="dispute-resolved">Disputa Resuelta</option>
                        <option value="dispute-resolved-client">Disputa Resuelta (Cliente)</option>
                        <option value="dispute-resolved-expert">Disputa Resuelta (Experto)</option>
                    </select>
                    <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                        className="px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                    <input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                        className="px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                </div>
            </div>

            {isLoadingHires ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
            ) : hiresError ? (
                <div className="text-center py-12 bg-red-50 text-red-600 rounded-lg border border-red-200">
                    <p>Error al cargar contrataciones: {hiresError.message}</p>
                </div>
            ) : filteredHires.length === 0 ? (
                <div className="text-center py-12">
                    <Search className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">
                        No tienes contrataciones {hireTab === 'active' ? 'activas' : 'inactivas'} con los filtros aplicados
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {filteredHires.map((hire) => (
                        <div
                            key={hire.id}
                            className="bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors overflow-hidden"
                        >
                            {/* Header con título y estado */}
                            <div className="p-3 sm:p-4 border-b border-slate-100">
                                <div className="flex items-start justify-between mb-2 sm:mb-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-slate-900 text-sm sm:text-base mb-1 line-clamp-1">
                                            {hire.searchTitle || 'Sin título'}
                                        </h3>
                                        {hire.searchDescription && (
                                            <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                                                {hire.searchDescription}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="text-xs font-semibold text-blue-700">
                                                    {hire.client.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <span className="text-xs text-slate-500">{hire.client.name}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span
                                            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-medium ${
                                                hire.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                hire.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                                                hire.status === 'awaiting_client_decision' ? 'bg-amber-100 text-amber-700' :
                                                hire.status === 'disputed' ? 'bg-orange-100 text-orange-700' :
                                                hire.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                hire.status === 'transfer_failed' ? 'bg-red-100 text-red-700' :
                                                hire.status === 'dispute-resolved' ? 'bg-green-100 text-green-700' :
                                                hire.status === 'dispute-resolved-client' ? 'bg-green-100 text-green-700' :
                                                hire.status === 'dispute-resolved-expert' ? 'bg-green-100 text-green-700' :
                                                'bg-slate-100 text-slate-700'
                                            }`}
                                        >
                                            {hire.status === 'pending' ? 'Pendiente' :
                                             hire.status === 'awaiting_client_decision' ? 'Esperando' :
                                             hire.status === 'disputed' ? 'Disputado' :
                                             hire.status === 'completed' ? 'Completado' :
                                             hire.status === 'cancelled' ? 'Cancelado' :
                                             hire.status === 'transfer_failed' ? 'Fallida' :
                                             hire.status === 'dispute-resolved' ? 'Resuelta' :
                                             hire.status === 'dispute-resolved-client' ? 'Resuelta (Cliente)' :
                                             hire.status === 'dispute-resolved-expert' ? 'Resuelta (Experto)' : hire.status}
                                        </span>
                                        {hire.unreadMessagesCount > 0 && (
                                            <div className="flex items-center gap-1">
                                                <MessageCircle className="w-3 h-3 text-blue-600" />
                                                <span className="text-xs font-medium text-blue-600">
                                                    {hire.unreadMessagesCount}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Contenido de la tarjeta */}
                            <div className="p-3 sm:p-4">
                                <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500">Servicio</span>
                                        <span className="text-xs font-medium text-slate-900">
                                            {categories?.find(c => c.id === hire.service.categoryId)?.name || 'Sin categoría'}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500">Fecha</span>
                                        <span className="text-xs text-slate-900">
                                            {new Date(hire.createdAt).toLocaleDateString('es-ES', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-slate-100">
                                        <span className="text-xs sm:text-sm font-medium text-slate-700">Monto</span>
                                        <span className="text-base sm:text-lg font-bold text-slate-900">
                                            {new Intl.NumberFormat('es-ES', {
                                                style: 'currency',
                                                currency: 'EUR',
                                            }).format(hire.amount)}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleViewHire(hire.id)}
                                    className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1 ${
                                        hire.unreadMessagesCount > 0 
                                            ? 'bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200' 
                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                    }`}
                                >
                                    {hire.unreadMessagesCount > 0 ? (
                                        <MessageCircle className="w-3 h-3" />
                                    ) : (
                                        <Search className="w-3 h-3" />
                                    )}
                                    <span className="hidden sm:inline">
                                        {hire.unreadMessagesCount > 0 ? 'Ver Mensajes' : 'Ver Contratación'}
                                    </span>
                                    <span className="sm:hidden">
                                        {hire.unreadMessagesCount > 0 ? 'Mensajes' : 'Ver'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

}