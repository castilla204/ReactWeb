import { useQuery } from '@tanstack/react-query';
import { API_CONFIG } from '../config/api';
import { getAuthToken } from '../lib/auth';

export interface FinancialTransactionDto {
    id: number;
    amount: number;
    transactionType: string;
    relatedEntityType: string | null;
    relatedEntityId: number | null;
    stripeTransferId: string | null;
    stripePaymentIntentId: string | null;
    stripeRefundId: string | null;
    isRefunded: boolean;
    createdAt: string;
    transactionTypeDisplay: string;
    amountFormatted: string;
    isPositive: boolean;
}

export interface FinancialTransactionListResponseDto {
    transactions: FinancialTransactionDto[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

interface UseFinancialTransactionsOptions {
    page?: number;
    pageSize?: number;
    transactionType?: string | null;
    enabled?: boolean;
}

export function useFinancialTransactions(options: UseFinancialTransactionsOptions = {}) {
    const { page = 1, pageSize = 20, transactionType = null, enabled = true } = options;

    return useQuery<FinancialTransactionListResponseDto>({
        queryKey: ['financialTransactions', page, pageSize, transactionType],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: pageSize.toString(),
            });

            if (transactionType) {
                params.append('transactionType', transactionType);
            }

            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token');
            }

            const response = await fetch(
                `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.financialTransaction.myTransactions}?${params}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch transactions');
            }

            return response.json();
        },
        enabled,
    });
}

