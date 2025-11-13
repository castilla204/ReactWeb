import { Search, Loader2, MessageCircle, Calendar, Euro, Tag } from 'lucide-react';
// ✅ NUEVOS IMPORTS PARA SISTEMA DE ESTADOS
import StatusBadge from '../StatusBadge';
import { getStatusInfoWithFallback } from '../../utils/statusUtils';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

interface Hire { 
    id: number; 
    searchId: number | null; 
    client: { name: string; email: string }; 
    service: { categoryId: number }; 
    serviceType: { name: string } | null; 
    status: 'pending' | 'awaiting_client_decision' | 'disputed' | 'completed' | 'cancelled' | 'transfer_failed' | 'dispute_resolved' | 'dispute_resolved_client' | 'dispute_resolved_expert'; 
    createdAt: string; 
    amount: number;
    // NUEVOS CAMPOS DEL BACKEND
    searchTitle?: string | null;
    searchDescription?: string | null;
    unreadMessagesCount: number;
    // ✅ NUEVO: statusInfo del backend
    statusInfo?: {
        id: number;
        statusType: string;
        statusName: string;
        statusValue: string;
        displayName: string;
        description: string | null;
        color: string | null;
        isActive: boolean;
        isFinalizationStatus: boolean;
        sortOrder: number;
        createdAt: string;
        updatedAt: string;
    };
}

interface HiresTabProps { activeTab: 'services' | 'hires'; hireTab: 'active' | 'inactive'; hires: Hire[]; isLoadingHires: boolean; hiresError: Error | null; filters: { clientName: string; status: string; dateFrom: string; dateTo: string }; setHireTab: (value: 'active' | 'inactive') => void; setFilters: (value: { clientName: string; status: string; dateFrom: string; dateTo: string }) => void; handleViewHire: (hireId: number | null) => void; categories: { id: number; name: string }[] | undefined; }

export function HiresTab({ activeTab, hireTab, hires, isLoadingHires, hiresError, filters, setHireTab, setFilters, handleViewHire, categories, }: HiresTabProps) {
    if (!activeTab || activeTab !== 'hires') return null;

    // ✅ NUEVA LÓGICA: Usar isFinalizationStatus del statusInfo del backend
    const activeHires = hires.filter((hire) => {
        // Si hay statusInfo, usar isFinalizationStatus del backend
        if (hire.statusInfo) {
            return !hire.statusInfo.isFinalizationStatus;
        }
        // Fallback: usar status directamente (no hay statusInfo disponible)
        return ['pending', 'awaiting_client_decision', 'disputed'].includes(hire.status);
    });
    
    const inactiveHires = hires.filter((hire) => {
        // Si hay statusInfo, usar isFinalizationStatus del backend
        if (hire.statusInfo) {
            return hire.statusInfo.isFinalizationStatus;
        }
        // Fallback: usar status directamente (no hay statusInfo disponible)
        return ['completed', 'cancelled', 'transfer_failed', 'dispute_resolved', 'dispute_resolved_client', 'dispute_resolved_expert'].includes(hire.status);
    });
    const filteredHires = (hireTab === 'active' ? activeHires : inactiveHires).filter((hire) => {
        const matchesClient = !filters.clientName || hire.client.name.toLowerCase().includes(filters.clientName.toLowerCase());
        // ✅ Usar statusInfo.statusValue cuando esté disponible para comparar con el filtro
        const hireStatus = hire.statusInfo?.statusValue || hire.status;
        const matchesStatus = !filters.status || hireStatus === filters.status;
        const hireDate = new Date(hire.createdAt);
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const toDate = filters.dateTo ? new Date(filters.dateTo) : null;
        const matchesDate = (!fromDate || hireDate >= fromDate) && (!toDate || hireDate <= toDate);
        return matchesClient && matchesStatus && matchesDate;
    });

    return (
        <div className="p-3 sm:p-6 space-y-6">
            {/* Header con pestañas - usando Tabs de shadcn */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Contrataciones</h2>
                        <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
                            Gestiona tus contrataciones activas e inactivas
                        </p>
                    </div>
                    {(() => {
                        const totalUnreadMessages = filteredHires.reduce((total, hire) => total + hire.unreadMessagesCount, 0);
                        return totalUnreadMessages > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full border border-primary/20">
                                <MessageCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">{totalUnreadMessages}</span>
                            </div>
                        );
                    })()}
                </div>
                <Tabs value={hireTab} onValueChange={(value: string) => {
                    setHireTab(value as 'active' | 'inactive');
                    setFilters({ clientName: '', status: '', dateFrom: '', dateTo: '' });
                }}>
                    <TabsList className="w-full sm:w-auto">
                        <TabsTrigger value="active" className="flex-1 sm:flex-none">
                            <span className="hidden sm:inline">Activas</span>
                            <span className="sm:hidden">Act.</span>
                            <span className="ml-2">({activeHires.length})</span>
                        </TabsTrigger>
                        <TabsTrigger value="inactive" className="flex-1 sm:flex-none">
                            <span className="hidden sm:inline">Inactivas</span>
                            <span className="sm:hidden">Inact.</span>
                            <span className="ml-2">({inactiveHires.length})</span>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Filtros mejorados con shadcn */}
            <Card>
                <CardHeader className="pb-3">
                    <h3 className="text-sm font-semibold">Filtros</h3>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="client-filter" className="text-xs">Filtrar por cliente</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    id="client-filter"
                                    type="text"
                                    placeholder="Nombre del cliente..."
                                    value={filters.clientName}
                                    onChange={(e) => setFilters({ ...filters, clientName: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status-filter" className="text-xs">Estado</Label>
                            <select
                                id="status-filter"
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                                className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            >
                                <option value="">Todos los estados</option>
                                <option value="pending">Pendiente</option>
                                <option value="awaiting_client_decision">Esperando Decisión</option>
                                <option value="disputed">Disputado</option>
                                <option value="completed">Completado</option>
                                <option value="cancelled">Cancelado</option>
                                <option value="transfer_failed">Transferencia Fallida</option>
                                <option value="dispute_resolved">Disputa Resuelta</option>
                                <option value="dispute_resolved_client">Disputa Resuelta (Cliente)</option>
                                <option value="dispute_resolved_expert">Disputa Resuelta (Experto)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date-from" className="text-xs">Fecha desde</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                <input
                                    id="date-from"
                                    type="date"
                                    value={filters.dateFrom}
                                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date-to" className="text-xs">Fecha hasta</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                <input
                                    id="date-to"
                                    type="date"
                                    value={filters.dateTo}
                                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {isLoadingHires ? (
                <Card>
                    <CardContent className="py-12">
                        <div className="flex flex-col items-center justify-center gap-3">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <p className="text-sm text-muted-foreground">Cargando contrataciones...</p>
                        </div>
                    </CardContent>
                </Card>
            ) : hiresError ? (
                <Card className="border-destructive/50">
                    <CardContent className="py-12">
                        <div className="text-center space-y-2">
                            <p className="text-sm font-medium text-destructive">Error al cargar contrataciones</p>
                            <p className="text-xs text-muted-foreground">{hiresError.message}</p>
                        </div>
                    </CardContent>
                </Card>
            ) : filteredHires.length === 0 ? (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center space-y-3">
                            <Search className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
                            <div>
                                <p className="text-sm font-medium text-foreground">
                                    No hay contrataciones {hireTab === 'active' ? 'activas' : 'inactivas'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {filters.clientName || filters.status || filters.dateFrom || filters.dateTo
                                        ? 'Intenta ajustar los filtros'
                                        : 'No tienes contrataciones en este momento'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {filteredHires.map((hire) => (
                        <Card key={hire.id} className="hover:shadow-sm transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                    {/* Información principal - lado izquierdo */}
                                    <div className="flex-1 min-w-0 flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                                        {/* Avatar y cliente */}
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                                                <span className="text-xs font-semibold text-primary">
                                                    {hire.client.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-foreground">D {hire.client.name}</span>
                                                {hire.unreadMessagesCount > 0 && (
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <MessageCircle className="w-3 h-3 text-primary" />
                                                        <span className="text-xs text-primary font-medium">{hire.unreadMessagesCount}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Título y descripción */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-sm font-semibold text-foreground line-clamp-1">
                                                    {hire.serviceType?.name || hire.searchTitle || 'Sin título'}
                                                </h3>
                                            </div>
                                            {hire.searchDescription && (
                                                <p className="text-xs text-muted-foreground line-clamp-1">
                                                    {hire.searchDescription}
                                                </p>
                                            )}
                                        </div>

                                        {/* Información detallada en fila compacta */}
                                        <div className="flex items-center gap-4 text-xs flex-wrap">
                                            <div className="flex items-center gap-1.5">
                                                <Tag className="w-3 h-3 text-muted-foreground" />
                                                <span className="text-muted-foreground">Servicio:</span>
                                                <span className="font-medium text-foreground">
                                                    {categories?.find(c => c.id === hire.service.categoryId)?.name || 'Sin categoría'}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3 h-3 text-muted-foreground" />
                                                <span className="font-medium text-foreground">
                                                    {new Date(hire.createdAt).toLocaleDateString('es-ES', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-1.5">
                                                <Euro className="w-3 h-3 text-muted-foreground" />
                                                <span className="font-bold text-foreground">
                                                    {new Intl.NumberFormat('es-ES', {
                                                        style: 'currency',
                                                        currency: 'EUR',
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    }).format(hire.amount)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Estado y botón - lado derecho */}
                                    <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto sm:pl-4 border-t sm:border-t-0 border-border pt-3 sm:pt-0">
                                        <StatusBadge
                                            statusInfo={getStatusInfoWithFallback(
                                                hire.statusInfo,
                                                hire.status
                                            )}
                                            size="sm"
                                        />
                                        <Button
                                            onClick={() => handleViewHire(hire.id)}
                                            variant={hire.unreadMessagesCount > 0 ? "default" : "outline"}
                                            size="sm"
                                            className="w-full sm:w-auto"
                                        >
                                            {hire.unreadMessagesCount > 0 ? (
                                                <>
                                                    <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                                                    Ver Mensajes
                                                </>
                                            ) : (
                                                <>
                                                    <Search className="w-3.5 h-3.5 mr-1.5" />
                                                    Ver Contratación
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );

}