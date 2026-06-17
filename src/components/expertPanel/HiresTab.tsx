import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStatusInfoWithFallback } from '../../utils/statusUtils';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';
import { Pagination } from '../Pagination';
import { getPriceDisplay } from '../../utils/priceUtils';
import { TERMINAL_SEARCH_HIRE_STATUSES } from '../../constants/hireStatuses';

interface Hire {
    id: number;
    searchId: number | null;
    client: { name: string; email: string } | null;
    service: { categoryId: number };
    serviceType: { name: string } | null;
    status: 'pending' | 'awaiting_client_decision' | 'disputed' | 'completed' | 'cancelled' | 'transfer_failed' | 'dispute_resolved' | 'dispute_resolved_client' | 'dispute_resolved_expert';
    createdAt: string;
    amount: number;
    searchTitle?: string | null;
    searchDescription?: string | null;
    unreadMessagesCount: number;
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

interface HiresTabProps {
    activeTab: 'services' | 'hires';
    hireTab: 'active' | 'inactive';
    hires: Hire[];
    isLoadingHires: boolean;
    hiresError: Error | null;
    filters: { clientName: string; status: string; dateFrom: string; dateTo: string };
    setHireTab: (value: 'active' | 'inactive') => void;
    setFilters: (value: { clientName: string; status: string; dateFrom: string; dateTo: string }) => void;
    handleViewHire: (hireId: number | null) => void;
    categories: { id: number; name: string }[] | undefined;
    pagination?: {
        page: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    } | null;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
}

type StatusTone = 'active' | 'done' | 'dispute' | 'cancelled' | 'neutral';

function isActiveHire(hire: Hire): boolean {
    if (hire.statusInfo) return !hire.statusInfo.isFinalizationStatus;
    return ['pending', 'awaiting_client_decision', 'disputed'].includes(hire.status);
}

function isCompletedStatus(statusValue: string): boolean {
    return ['completed', 'dispute_resolved', 'dispute_resolved_client', 'dispute_resolved_expert'].includes(statusValue);
}

function getStatusTone(statusValue: string): StatusTone {
    if (isCompletedStatus(statusValue)) return 'done';
    if (statusValue === 'cancelled') return 'cancelled';
    if (statusValue === 'disputed' || statusValue === 'transfer_failed') return 'dispute';
    if (statusValue === 'pending' || statusValue === 'awaiting_client_decision') return 'active';
    return 'neutral';
}

function formatHireDate(createdAt: string): string {
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function clientInitials(name?: string | null): string {
    const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function hasActiveFilters(filters: HiresTabProps['filters']): boolean {
    return Boolean(filters.clientName || filters.status || filters.dateFrom || filters.dateTo);
}

function HireRowSkeleton() {
    return (
        <li className="expert-hire-row expert-hire-row--skeleton" aria-hidden>
            <Skeleton className="expert-hire-avatar" />
            <div className="expert-hire-main">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-48 rounded mt-2" />
            </div>
            <Skeleton className="h-4 w-16 rounded hidden sm:block" />
        </li>
    );
}

export function HiresTab({
    activeTab,
    hireTab,
    hires,
    isLoadingHires,
    hiresError,
    filters,
    setHireTab,
    setFilters,
    handleViewHire,
    categories,
    pagination,
    onPageChange,
    onPageSizeChange,
}: HiresTabProps) {
    const navigate = useNavigate();
    const [filtersOpen, setFiltersOpen] = useState(hasActiveFilters(filters));

    if (!activeTab || activeTab !== 'hires') return null;

    const activeHires = useMemo(() => hires.filter(isActiveHire), [hires]);
    const inactiveHires = useMemo(
        () => hires.filter((hire) => !isActiveHire(hire)),
        [hires],
    );

    const pool = hireTab === 'active' ? activeHires : inactiveHires;

    const filteredHires = useMemo(() => pool.filter((hire) => {
        const matchesClient = !filters.clientName
            || (hire.client?.name || '').toLowerCase().includes(filters.clientName.toLowerCase());
        const hireStatus = hire.statusInfo?.statusValue || hire.status;
        const matchesStatus = !filters.status || hireStatus === filters.status;
        const hireDate = new Date(hire.createdAt);
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const toDate = filters.dateTo ? new Date(filters.dateTo) : null;
        const matchesDate = (!fromDate || hireDate >= fromDate) && (!toDate || hireDate <= toDate);
        return matchesClient && matchesStatus && matchesDate;
    }), [pool, filters]);

    const totalUnread = filteredHires.reduce((n, h) => n + (h.unreadMessagesCount || 0), 0);
    const filtersActive = hasActiveFilters(filters);

    const clearFilters = () => {
        setFilters({ clientName: '', status: '', dateFrom: '', dateTo: '' });
    };

    const switchTab = (tab: 'active' | 'inactive') => {
        setHireTab(tab);
        clearFilters();
        setFiltersOpen(false);
    };

    return (
        <div className="expert-hires">
            <div className="expert-hires-bar">
                <div className="expert-hires-segment" role="tablist" aria-label="Tipo de contrataciones">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={hireTab === 'active'}
                        className={`expert-hires-segment-btn${hireTab === 'active' ? ' expert-hires-segment-btn--active' : ''}`}
                        onClick={() => switchTab('active')}
                    >
                        Activas
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={hireTab === 'inactive'}
                        className={`expert-hires-segment-btn${hireTab === 'inactive' ? ' expert-hires-segment-btn--active' : ''}`}
                        onClick={() => switchTab('inactive')}
                    >
                        Inactivas
                    </button>
                </div>

                {totalUnread > 0 && (
                    <p className="expert-hires-bar-note">
                        {totalUnread} sin leer
                    </p>
                )}

                <div className="expert-hires-bar-spacer" aria-hidden />

                <button
                    type="button"
                    className={`expert-hires-filters-toggle${filtersOpen ? ' expert-hires-filters-toggle--open' : ''}${filtersActive ? ' expert-hires-filters-toggle--active' : ''}`}
                    onClick={() => setFiltersOpen((v) => !v)}
                    aria-expanded={filtersOpen}
                >
                    Filtros
                    {filtersActive && <span className="expert-hires-filters-dot" aria-hidden />}
                </button>
            </div>

            {filtersOpen && (
                <div className="expert-hires-filters">
                    <div className="expert-hires-filters-grid">
                        <div className="expert-hires-filter">
                            <label htmlFor="hire-client-filter">Cliente</label>
                            <Input
                                id="hire-client-filter"
                                type="search"
                                placeholder="Nombre del cliente"
                                value={filters.clientName}
                                onChange={(e) => setFilters({ ...filters, clientName: e.target.value })}
                                className="expert-hires-filter-input"
                            />
                        </div>
                        <div className="expert-hires-filter">
                            <label htmlFor="hire-status-filter">Estado</label>
                            <select
                                id="hire-status-filter"
                                className="expert-hires-filter-select"
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            >
                                <option value="">Todos</option>
                                <option value="pending">Pendiente</option>
                                <option value="awaiting_client_decision">Esperando decisión</option>
                                <option value="disputed">Disputado</option>
                                <option value="completed">Completado</option>
                                <option value="cancelled">Cancelado</option>
                                <option value="transfer_failed">Transferencia fallida</option>
                                <option value="dispute_resolved_client">Disputa resuelta (cliente)</option>
                                <option value="dispute_resolved_expert">Disputa resuelta (experto)</option>
                            </select>
                        </div>
                        <div className="expert-hires-filter">
                            <label htmlFor="hire-date-from">Desde</label>
                            <input
                                id="hire-date-from"
                                type="date"
                                className="expert-hires-filter-select"
                                value={filters.dateFrom}
                                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                            />
                        </div>
                        <div className="expert-hires-filter">
                            <label htmlFor="hire-date-to">Hasta</label>
                            <input
                                id="hire-date-to"
                                type="date"
                                className="expert-hires-filter-select"
                                value={filters.dateTo}
                                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                            />
                        </div>
                    </div>
                    {filtersActive && (
                        <button type="button" className="expert-hires-clear-filters" onClick={clearFilters}>
                            Limpiar filtros
                        </button>
                    )}
                </div>
            )}

            {isLoadingHires ? (
                <ul className="expert-hires-list" aria-busy="true" aria-label="Cargando contrataciones">
                    {[0, 1, 2].map((i) => (
                        <HireRowSkeleton key={i} />
                    ))}
                </ul>
            ) : hiresError ? (
                <div className="expert-hires-state expert-hires-state--error" role="alert">
                    <p className="expert-hires-state-title">No se pudieron cargar las contrataciones</p>
                    <p className="expert-hires-state-text">{hiresError.message}</p>
                </div>
            ) : hires.length === 0 ? (
                <div className="expert-hires-state" role="status">
                    <p className="expert-hires-state-title">Sin contrataciones todavía</p>
                    <p className="expert-hires-state-text">
                        Cuando un cliente contrate uno de tus servicios, aparecerá aquí para que puedas
                        seguir el estado, los mensajes y los pagos.
                    </p>
                </div>
            ) : filteredHires.length === 0 ? (
                <div className="expert-hires-state" role="status">
                    <p className="expert-hires-state-title">
                        No hay contrataciones {hireTab === 'active' ? 'activas' : 'inactivas'} con estos filtros
                    </p>
                    <button type="button" className="expert-hires-clear-filters expert-hires-clear-filters--standalone" onClick={clearFilters}>
                        Limpiar filtros
                    </button>
                </div>
            ) : (
                <>
                {!isLoadingHires && !hiresError && filteredHires.length > 0 && (
                    <div className="expert-hires-list-head" aria-hidden>
                        <span className="expert-hires-list-head-label">Cliente</span>
                        <span className="expert-hires-list-head-label">Contratación</span>
                        <span className="expert-hires-list-head-label expert-hires-list-head-label--end">Importe</span>
                    </div>
                )}
                <ul className="expert-hires-list" aria-label={`Contrataciones ${hireTab === 'active' ? 'activas' : 'inactivas'}`}>
                    {filteredHires.map((hire) => {
                        const statusValue = hire.statusInfo?.statusValue || hire.status;
                        const statusInfo = getStatusInfoWithFallback(hire.statusInfo, hire.status);
                        const statusLabel = statusInfo?.displayName || statusValue;
                        const tone = getStatusTone(statusValue);
                        const categoryName =
                            categories?.find((c) => c.id === hire.service.categoryId)?.name || 'Sin categoría';
                        const title = hire.serviceType?.name || hire.searchTitle || 'Contratación';
                        const price = getPriceDisplay(hire);
                        const clientName = hire.client?.name || 'Cliente';
                        const unread = hire.unreadMessagesCount || 0;

                        return (
                            <li
                                key={hire.id}
                                className={`expert-hire-row expert-hire-row--${tone}${unread > 0 ? ' expert-hire-row--unread' : ''}`}
                            >
                                <span className="expert-hire-avatar" aria-hidden>
                                    {clientInitials(clientName)}
                                </span>

                                <div className="expert-hire-main">
                                    <div className="expert-hire-head">
                                        <h3 className="expert-hire-client">{clientName}</h3>
                                        <span className={`expert-hire-status expert-hire-status--${tone}`}>
                                            {statusLabel}
                                        </span>
                                    </div>
                                    <p className="expert-hire-title">{title}</p>
                                    <p className="expert-hire-meta">
                                        {categoryName}
                                        <span className="expert-hire-meta-sep" aria-hidden>·</span>
                                        {formatHireDate(hire.createdAt)}
                                    </p>
                                    {unread > 0 && (
                                        <p className="expert-hire-unread">
                                            {unread} mensaje{unread === 1 ? '' : 's'} sin leer
                                        </p>
                                    )}
                                </div>

                                <div className="expert-hire-side">
                                    <span className="expert-hire-price">{price.formattedTotal}</span>
                                    {price.hasTaxInfo && (
                                        <span className="expert-hire-price-note">IVA incl.</span>
                                    )}
                                    <button
                                        type="button"
                                        className="expert-hire-action"
                                        onClick={() => handleViewHire(hire.id)}
                                    >
                                        {unread > 0 ? 'Ver mensajes' : 'Ver detalle'}
                                    </button>
                                    {isActiveHire(hire) && (
                                        <button
                                            type="button"
                                            className="expert-hire-action"
                                            style={{ background: 'hsl(var(--brand))', color: '#fff', borderColor: 'transparent', marginTop: 6 }}
                                            onClick={() => navigate(`/expert-panel/inspeccion/${hire.id}`)}
                                        >
                                            Rellenar inspección
                                        </button>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
                </>
            )}
            {pagination && onPageChange && onPageSizeChange && filteredHires.length > 0 && (
                <div className="expert-hires-pagination">
                    <Pagination
                        page={pagination.page}
                        pageSize={pagination.pageSize}
                        totalCount={pagination.totalCount}
                        totalPages={pagination.totalPages}
                        hasNextPage={pagination.hasNextPage}
                        hasPreviousPage={pagination.hasPreviousPage}
                        onPageChange={onPageChange}
                        onPageSizeChange={onPageSizeChange}
                    />
                </div>
            )}
        </div>
    );
}
