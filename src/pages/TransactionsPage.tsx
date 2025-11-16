import { useState } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, CreditCard, ArrowLeftRight, RefreshCw, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFinancialTransactions, FinancialTransactionDto } from '../hooks/useFinancialTransactions';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { Spinner } from '../components/ui/spinner';

const TRANSACTION_TYPES = [
    { value: 'all', label: 'Todas las transacciones' },
    { value: 'Deposit', label: 'Depósitos' },
    { value: 'ServicePayment', label: 'Pagos de Servicio' },
    { value: 'Refund', label: 'Reembolsos' },
    { value: 'Payout', label: 'Pagos Recibidos' },
];

function getTransactionIcon(transaction: FinancialTransactionDto) {
    switch (transaction.transactionType) {
        case 'Deposit':
            return <TrendingUp className="w-4 h-4" />;
        case 'ServicePayment':
            return <CreditCard className="w-4 h-4" />;
        case 'Refund':
            return <RefreshCw className="w-4 h-4" />;
        case 'Payout':
            return <TrendingUp className="w-4 h-4" />;
        default:
            return <ArrowLeftRight className="w-4 h-4" />;
    }
}

function getTransactionBarColor(transaction: FinancialTransactionDto): string {
    switch (transaction.transactionType) {
        case 'Deposit':
            return 'bg-blue-500';
        case 'ServicePayment':
            return 'bg-yellow-500';
        case 'Refund':
            return 'bg-green-500';
        case 'Payout':
            return 'bg-blue-500';
        default:
            return 'bg-gray-500';
    }
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function TransactionsPage() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [transactionType, setTransactionType] = useState<string>('all');
    const pageSize = 20;

    const { data, isLoading, error, refetch } = useFinancialTransactions({
        page,
        pageSize,
        transactionType: transactionType === 'all' ? null : transactionType,
    });

    const handleFilterChange = (value: string) => {
        setTransactionType(value);
        setPage(1); // Reset to first page when filter changes
    };

    const handlePreviousPage = () => {
        if (data?.hasPreviousPage) {
            setPage((p) => p - 1);
        }
    };

    const handleNextPage = () => {
        if (data?.hasNextPage) {
            setPage((p) => p + 1);
        }
    };

    // Calculate totals
    const totalIncome = data?.transactions
        .filter((t) => t.isPositive)
        .reduce((sum, t) => sum + t.amount, 0) || 0;

    const totalExpenses = data?.transactions
        .filter((t) => !t.isPositive)
        .reduce((sum, t) => sum + t.amount, 0) || 0;

    const balance = totalIncome - totalExpenses;

    if (error) {
        return (
            <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <ErrorDisplay
                        message="Error al cargar las transacciones"
                        onRetry={() => refetch()}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-3">
                {/* Header Compact Dark */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="h-8 w-8"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-lg font-medium">Transacciones</h1>
                    </div>
                    <Select
                        value={transactionType}
                        onValueChange={handleFilterChange}
                    >
                        <SelectTrigger className="w-[160px] h-8 text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {TRANSACTION_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Transactions List - Shadcn Style */}
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Spinner className="w-5 h-5" />
                        </div>
                    ) : !data?.transactions || data.transactions.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-sm text-muted-foreground">
                                No se encontraron transacciones
                            </p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-muted/30 border-b">
                                        <TableHead className="w-[50px] px-4"></TableHead>
                                        <TableHead className="px-4">Tipo</TableHead>
                                        <TableHead className="w-[130px] px-4">Fecha</TableHead>
                                        <TableHead className="w-[150px] px-4 text-right">Cantidad</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.transactions.map((transaction) => (
                                        <TableRow key={transaction.id} className="hover:bg-muted/50">
                                            {/* Icon Column */}
                                            <TableCell className="w-[50px] px-4 py-3">
                                                <div className="p-2 rounded-md bg-muted text-foreground w-fit">
                                                    {getTransactionIcon(transaction)}
                                                </div>
                                            </TableCell>

                                            {/* Type Column */}
                                            <TableCell className="px-4 py-3">
                                                <div className="flex flex-col min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">
                                                            {transaction.transactionTypeDisplay}
                                                        </span>
                                                        {transaction.isRefunded && (
                                                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                                                Reembolsado
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {transaction.relatedEntityId && (
                                                        <span className="text-xs text-muted-foreground mt-0.5">
                                                            Contratación #{transaction.relatedEntityId}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* Date Column */}
                                            <TableCell className="w-[130px] px-4 py-3">
                                                <div className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {new Date(transaction.createdAt).toLocaleDateString('es-ES', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </div>
                                            </TableCell>

                                            {/* Amount Column - Fixed width and padding for perfect alignment */}
                                            <TableCell className="w-[150px] px-4 py-3">
                                                <div className="flex items-center justify-end relative">
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                                        <div className={`w-1 h-8 rounded-full ${getTransactionBarColor(transaction)}`} />
                                                    </div>
                                                    <div className="text-sm font-semibold text-foreground whitespace-nowrap ml-6">
                                                        {transaction.amountFormatted}
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {data.totalPages > 1 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
                                    <div className="text-xs text-muted-foreground">
                                        Página {data.page} de {data.totalPages}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handlePreviousPage}
                                            disabled={!data.hasPreviousPage}
                                            className="h-8"
                                        >
                                            Anterior
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleNextPage}
                                            disabled={!data.hasNextPage}
                                            className="h-8"
                                        >
                                            Siguiente
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

