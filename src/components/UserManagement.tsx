import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../hooks/useApi';
import { Shield, CheckCircle, XCircle, Users, Search, CreditCard, Calendar, ArrowLeft } from 'lucide-react';
import { UserAccountActions } from './UserAccountActions';
import { Pagination } from './Pagination';

interface User {
    id: number;
    name: string;
    email: string;
    phoneNumber: string | null;
    phoneVerified: boolean;
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


export function UserManagement({ onBack }: UserManagementProps) {
    const { fetchApi } = useApi();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    const usersQuery = useQuery({
        queryKey: ['users', page, pageSize],
        queryFn: async () => {
            const response = await fetchApi<any>(`/api/User/all?page=${page}&pageSize=${pageSize}`);
            
            // ✅ NORMALIZAR respuesta según la guía
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
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'success',
                    message: '🔒 User status updated successfully'
                }
            }));
        },
        onError: () => {
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: {
                    type: 'error',
                    message: '❌ Failed to update user status'
                }
            }));
        }
    });


    const handleBlockUser = async (userId: number) => {
        try {
            await blockUserMutation.mutateAsync(userId);
        } catch (error) {
            console.error('Error blocking user:', error);
        }
    };



    if (usersQuery.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-gray-500">Loading users...</div>
            </div>
        );
    }

    if (usersQuery.error) {
        return (
            <div className="flex items-center justify-center min-h-[400px] text-red-500">
                Error loading users
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Volver
                    </button>
                    <div className="flex items-center space-x-3">
                        <Users className="w-8 h-8 text-blue-600" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
                            <p className="text-gray-600">Gestionar usuarios del sistema</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Searches</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {usersQuery.data?.users?.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <span className="text-blue-600 font-medium text-sm">
                                                        {user.name && user.name.length > 0 ? user.name[0].toUpperCase() : '?'}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{user.name || 'Sin nombre'}</div>
                                                    <div className="text-sm text-gray-500">{user.email || 'Sin email'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {user.isBlocked ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        <XCircle className="w-4 h-4 mr-1" />
                                                        Blocked
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-gray-900">
                                                <CreditCard className="w-4 h-4 text-blue-500" />
                                                {user.subscriptionPlan}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-gray-900">
                                                <Search className="w-4 h-4 text-blue-500" />
                                                {user.searchCount} active
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleBlockUser(user.id)}
                                                    className={`p-2 rounded-lg transition-colors ${user.isBlocked
                                                            ? 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                                            : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                                        }`}
                                                    title={user.isBlocked ? 'Unblock user' : 'Block user'}
                                                >
                                                    <Shield className="w-5 h-5" />
                                                </button>
                                                <UserAccountActions 
                                                    userId={user.id}
                                                    userName={user.name}
                                                    userEmail={user.email}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {usersQuery.data?.pagination && (
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
                </div>
            </div>
        </div>
    );
}