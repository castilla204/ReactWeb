import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
    page,
    pageSize,
    totalCount,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    onPageChange,
    onPageSizeChange,
}) => {
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxPagesToShow = 7;

        if (totalPages <= maxPagesToShow) {
            // Mostrar todas las páginas si son pocas
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Mostrar páginas con elipsis
            if (page <= 3) {
                // Al inicio
                for (let i = 1; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            } else if (page >= totalPages - 2) {
                // Al final
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                // En el medio
                pages.push(1);
                pages.push('...');
                for (let i = page - 1; i <= page + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const endItem = Math.min(page * pageSize, totalCount);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-700">
                <span>
                    Mostrando <span className="font-medium">{startItem}</span> a{' '}
                    <span className="font-medium">{endItem}</span> de{' '}
                    <span className="font-medium">{totalCount}</span> resultados
                </span>
                {onPageSizeChange && (
                    <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        className="ml-2 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value={10}>10 por página</option>
                        <option value={20}>20 por página</option>
                        <option value={50}>50 por página</option>
                    </select>
                )}
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={!hasPreviousPage}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                    {getPageNumbers().map((pageNum, index) => {
                        if (pageNum === '...') {
                            return (
                                <span key={`ellipsis-${index}`} className="px-2 py-1 text-gray-500">
                                    ...
                                </span>
                            );
                        }

                        const pageNumber = pageNum as number;
                        return (
                            <button
                                key={pageNumber}
                                onClick={() => onPageChange(pageNumber)}
                                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                    page === pageNumber
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                {pageNumber}
                            </button>
                        );
                    })}
                </div>

                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={!hasNextPage}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

