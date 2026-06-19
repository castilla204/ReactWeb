import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../hooks/useApi';
import { Shield, ShieldOff, CheckCircle, XCircle, Users, Search, CreditCard, Calendar, ArrowLeft, Check } from 'lucide-react';
import { UserAccountActions } from './UserAccountActions';
import { Pagination } from './Pagination';
import { showToast } from '../lib/toast';
import {
    AdminCard,
    AdminCardHeader,
    AdminButton,
    AdminStatusPill,
    AdminTable,
    AdminTHead,
    AdminTH,
    AdminTBody,
    AdminTR,
    AdminTD,
    AdminEmptyState,
    AdminTableSkeleton,
} from './admin/ui';

interface User {
    id: number;
    name: string;
    email: string;
    phoneNumber: string | null;
    phoneVerified: boolean;
    /** "mobile" | "landline" | "voip" | "unknown" | null (sin clasificar) */
    phoneLineType?: string | null;
    /** "stripe_kyc" | "checkout" | "otp" | null */
    phoneVerificationSource?: string | null;
    isBlocked: boolean;
    createdAt: string;
    searchCount: number;
    subscriptionPlan: string;
}

interface PaginatedUsersResponse {
    users: User[];
    pagination: {
        page: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

interface UserManagementProps {
    onBack: () => void;
}

const COLUMN_COUNT = 7;

export function UserManagement({ onBack }: UserManagementProps) {
    const { fetchApi } = useApi();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    const usersQuery = useQuery({
        queryKey: ['users', page, pageSize],
        queryFn: async () => {
            const response = await fetchApi<any>(`/api/User/all?page=${page}&pageSize=${pageSize}`);

            // NORMALIZAR respuesta según la guía
            return {
                users: response.users || [],
                pagination: response.pagination ? {
                    page: response.pagination.page || 1,
                    pageSize: response.pagination.pageSize || pageSize,
                    totalCount: response.pagination.totalCount || 0,
                    totalPages: response.pagination.totalPages || 0,
                    hasNextPage: response.pagination.hasNextPage ?? false,
                    hasPreviousPage: response.pagination.hasPreviousPage ?? false,
                } : {
                    page: 1,
                    pageSize: pageSize,
                    totalCount: 0,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPreviousPage: false,
                }
            } as PaginatedUsersResponse;
        },
        retry: 1,
        retryDelay: 1000,
    });


    const blockUserMutation = useMutation({
        mutationFn: (userId: number) =>
            fetchApi(`/api/User/${userId}/block`, {
                method: 'PUT',
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            showToast('success', 'Estado del usuario actualizado', undefined, { surface: 'homepage' });
        },
        onError: () => {
            showToast('error', 'No se pudo actualizar el estado del usuario');
        }
    });


    const handleBlockUser = async (userId: number) => {
        try {
            await blockUserMutation.mutateAsync(userId);
        } catch (error) {
            console.error('Error blocking user:', error);
        }
    };


    const renderTableBody = () => (
        <AdminTable zebra>
            <AdminTHead>
                <AdminTH>Usuario</AdminTH>
                <AdminTH>Estado</AdminTH>
                <AdminTH>Teléfono</AdminTH>
                <AdminTH>Plan</AdminTH>
                <AdminTH>Búsquedas</AdminTH>
                <AdminTH>Alta</AdminTH>
                <AdminTH className="text-right">Acciones</AdminTH>
            </AdminTHead>
            <AdminTBody>
                {usersQuery.data?.users?.map((user) => {
                    const isMutating =
                        blockUserMutation.isPending && blockUserMutation.variables === user.id;
                    return (
                        <AdminTR key={user.id}>
                            <AdminTD>
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10 bg-[hsl(220_16%_95%)] rounded-full flex items-center justify-center">
                                        <span className="text-[hsl(var(--ap-brand))] font-medium text-sm">
                                            {user.name && user.name.length > 0 ? user.name[0].toUpperCase() : '?'}
                                        </span>
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-[hsl(var(--ap-ink))]">{user.name || 'Sin nombre'}</div>
                                        <div className="text-sm text-[hsl(var(--ap-muted))]">{user.email || 'Sin email'}</div>
                                    </div>
                                </div>
                            </AdminTD>
                            <AdminTD>
                                {user.isBlocked ? (
                                    <AdminStatusPill tone="error">
                                        <XCircle className="w-3.5 h-3.5" />
                                        Bloqueado
                                    </AdminStatusPill>
                                ) : (
                                    <AdminStatusPill tone="success">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        Activo
                                    </AdminStatusPill>
                                )}
                            </AdminTD>
                            <AdminTD>
                                {/* SMS-CENTRAL: teléfono + tipo de línea + origen, visible para admin.
                                    Lectura defensiva de ambos casings (PascalCase/camelCase). */}
                                {(() => {
                                    const raw = user as unknown as Record<string, unknown>;
                                    const phone = (raw.phoneNumber ?? raw.PhoneNumber) as string | null;
                                    const lineType = (raw.phoneLineType ?? raw.PhoneLineType) as string | null;
                                    const verified = Boolean(raw.phoneVerified ?? raw.PhoneVerified);
                                    const source = (raw.phoneVerificationSource ?? raw.PhoneVerificationSource) as string | null;
                                    if (!phone) return <span className="text-sm text-[hsl(var(--ap-muted))]">—</span>;
                                    return (
                                        <div className="text-sm">
                                            <div className="text-[hsl(var(--ap-ink))]">{phone}</div>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                {lineType === 'landline' ? (
                                                    <AdminStatusPill tone="warning">Fijo · sin SMS</AdminStatusPill>
                                                ) : lineType === 'mobile' ? (
                                                    <AdminStatusPill tone="success">Móvil</AdminStatusPill>
                                                ) : (
                                                    <AdminStatusPill tone="neutral">{lineType || 'sin clasificar'}</AdminStatusPill>
                                                )}
                                                {verified ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-[hsl(var(--ap-success))]" title={`Verificado vía ${source || 'desconocido'}`}>
                                                        <Check className="w-3 h-3" />
                                                        {source || 'verificado'}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-[hsl(var(--ap-muted))]">sin verificar</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </AdminTD>
                            <AdminTD>
                                <div className="flex items-center gap-2 text-sm text-[hsl(var(--ap-ink))]">
                                    <CreditCard className="w-4 h-4 text-[hsl(var(--ap-brand))]" />
                                    {user.subscriptionPlan}
                                </div>
                            </AdminTD>
                            <AdminTD>
                                <div className="flex items-center gap-2 text-sm text-[hsl(var(--ap-ink))]">
                                    <Search className="w-4 h-4 text-[hsl(var(--ap-brand))]" />
                                    {user.searchCount}
                                </div>
                            </AdminTD>
                            <AdminTD>
                                <div className="flex items-center gap-2 text-sm text-[hsl(var(--ap-muted))]">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </div>
                            </AdminTD>
                            <AdminTD className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <AdminButton
                                        variant="outline"
                                        size="sm"
                                        loading={isMutating}
                                        icon={user.isBlocked ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                                        onClick={() => handleBlockUser(user.id)}
                                        title={user.isBlocked ? 'Desbloquear usuario' : 'Bloquear usuario'}
                                    >
                                        {user.isBlocked ? 'Desbloquear' : 'Bloquear'}
                                    </AdminButton>
                                    <UserAccountActions
                                        userId={user.id}
                                        userName={user.name}
                                        userEmail={user.email}
                                    />
                                </div>
                            </AdminTD>
                        </AdminTR>
                    );
                })}
            </AdminTBody>
        </AdminTable>
    );

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-sm text-[hsl(var(--ap-muted))] hover:text-[hsl(var(--ap-ink))] transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver
                </button>
            </div>

            <AdminCard>
                <AdminCardHeader
                    title={
                        <span className="inline-flex items-center gap-2">
                            <Users className="w-5 h-5 text-[hsl(var(--ap-brand))]" />
                            Usuarios
                        </span>
                    }
                    description="Gestiona los usuarios del sistema: estado, plan y acceso."
                />

                {usersQuery.isLoading ? (
                    <AdminTableSkeleton rows={6} cols={COLUMN_COUNT} />
                ) : usersQuery.error ? (
                    <AdminEmptyState
                        icon={<XCircle className="w-6 h-6" />}
                        title="Error al cargar"
                        description="No se pudieron cargar los usuarios. Inténtalo de nuevo."
                    />
                ) : (usersQuery.data?.users?.length ?? 0) === 0 ? (
                    <AdminEmptyState
                        icon={<Users className="w-6 h-6" />}
                        title="Sin usuarios"
                        description="Prueba con otro término de búsqueda"
                    />
                ) : (
                    renderTableBody()
                )}

                {usersQuery.data?.pagination && (usersQuery.data?.users?.length ?? 0) > 0 && (
                    <Pagination
                        page={usersQuery.data.pagination.page}
                        pageSize={usersQuery.data.pagination.pageSize}
                        totalCount={usersQuery.data.pagination.totalCount}
                        totalPages={usersQuery.data.pagination.totalPages}
                        hasNextPage={usersQuery.data.pagination.hasNextPage}
                        hasPreviousPage={usersQuery.data.pagination.hasPreviousPage}
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
            </AdminCard>
        </div>
    );
}
