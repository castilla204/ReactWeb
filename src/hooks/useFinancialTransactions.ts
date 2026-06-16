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

// 🛡️ NewApi serializa PascalCase (ver memoria del proyecto). El front debe leer
// ambos casings o `transactions` llega `undefined` y revienta el `.filter`.
type AnyRecord = Record<string, unknown>;
const pick = <T,>(obj: AnyRecord, ...keys: string[]): T | undefined => {
    for (const k of keys) {
        const v = obj?.[k];
        if (v !== undefined && v !== null) return v as T;
    }
    return undefined;
};

function normalizeTransaction(t: AnyRecord): FinancialTransactionDto {
    return {
        id: Number(pick<number>(t, 'id', 'Id') ?? 0),
        amount: Number(pick<number>(t, 'amount', 'Amount') ?? 0),
        transactionType: pick<string>(t, 'transactionType', 'TransactionType') ?? '',
        relatedEntityType: pick<string>(t, 'relatedEntityType', 'RelatedEntityType') ?? null,
        relatedEntityId: pick<number>(t, 'relatedEntityId', 'RelatedEntityId') ?? null,
        stripeTransferId: pick<string>(t, 'stripeTransferId', 'StripeTransferId') ?? null,
        stripePaymentIntentId: pick<string>(t, 'stripePaymentIntentId', 'StripePaymentIntentId') ?? null,
        stripeRefundId: pick<string>(t, 'stripeRefundId', 'StripeRefundId') ?? null,
        isRefunded: Boolean(pick<boolean>(t, 'isRefunded', 'IsRefunded') ?? false),
        createdAt: pick<string>(t, 'createdAt', 'CreatedAt') ?? '',
        transactionTypeDisplay: pick<string>(t, 'transactionTypeDisplay', 'TransactionTypeDisplay') ?? '',
        amountFormatted: pick<string>(t, 'amountFormatted', 'AmountFormatted') ?? '',
        isPositive: Boolean(pick<boolean>(t, 'isPositive', 'IsPositive') ?? false),
    };
}

function normalizeTransactionsResponse(
    json: AnyRecord,
    page: number,
    pageSize: number,
): FinancialTransactionListResponseDto {
    const rawList = pick<unknown[]>(json ?? {}, 'transactions', 'Transactions');
    const transactions = Array.isArray(rawList)
        ? rawList.map((t) => normalizeTransaction(t as AnyRecord))
        : [];
    return {
        transactions,
        totalCount: Number(pick<number>(json ?? {}, 'totalCount', 'TotalCount') ?? transactions.length),
        page: Number(pick<number>(json ?? {}, 'page', 'Page') ?? page),
        pageSize: Number(pick<number>(json ?? {}, 'pageSize', 'PageSize') ?? pageSize),
        totalPages: Number(pick<number>(json ?? {}, 'totalPages', 'TotalPages') ?? 1),
        hasNextPage: Boolean(pick<boolean>(json ?? {}, 'hasNextPage', 'HasNextPage') ?? false),
        hasPreviousPage: Boolean(pick<boolean>(json ?? {}, 'hasPreviousPage', 'HasPreviousPage') ?? false),
    };
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

            const json = await response.json();
            return normalizeTransactionsResponse(json, page, pageSize);
        },
        enabled,
    });
}

