import { useState, useEffect, useRef, useLayoutEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCategories } from '../contexts/CategoryContext';
import { useSearch } from './useSearch.hooks';
import { useErrorHandler, isNetworkError } from './useErrorHandler';
import { mfaService } from '../services/mfaService';
import type { SearchItem, SearchFilters, PaginationMetadata } from './useSearch.hooks';
import { ROUTES } from '../constants/routes';

export interface SearchDashboardFilters {
    search: string;
    selectedCategories: number[];
    showInactives: boolean;
    isRevised: boolean | null;
    searchHireStatus: string;
    sortBy: string;
    sortDirection: 'asc' | 'desc';
}

export function useSearchDashboard() {
    const { user, isAuthenticated } = useAuth();
    const { categories } = useCategories();
    const { searchesWithFilters, reviseSearch: reviseSearchMutation } = useSearch();
    const navigate = useNavigate();

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filters, setFilters] = useState<SearchDashboardFilters>({
        search: '',
        selectedCategories: [],
        showInactives: false,
        isRevised: null,
        searchHireStatus: '',
        sortBy: 'createdAt',
        sortDirection: 'desc',
    });

    const [searchInput, setSearchInput] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);
    const cursorPositionRef = useRef<number | null>(null);
    const isFocusedRef = useRef(false);
    const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [currentSearches, setCurrentSearches] = useState<SearchItem[]>([]);
    const [currentPagination, setCurrentPagination] = useState<PaginationMetadata | null>(null);

    const isAdmin =
        user?.role === 'Admin' ||
        user?.email?.trim().toLowerCase() === 'dcastillaa@gmail.com'.toLowerCase();

    const allCategoriesSelected =
        Array.isArray(categories) &&
        filters.selectedCategories.length === categories.length &&
        categories.every((cat) => filters.selectedCategories.includes(cat.id));

    const apiFilters: SearchFilters = useMemo(
        () => ({
            page: 1,
            pageSize: 20,
            searchTerm: filters.search || undefined,
            category: allCategoriesSelected
                ? undefined
                : filters.selectedCategories.length > 0
                  ? filters.selectedCategories[0]
                  : undefined,
            isActive: filters.showInactives ? undefined : true,
            isRevised: filters.isRevised !== null ? filters.isRevised : undefined,
            searchHireStatus: filters.searchHireStatus || undefined,
            sortBy: filters.sortBy,
            sortDirection: filters.sortDirection,
        }),
        [filters, allCategoriesSelected],
    );

    const query = searchesWithFilters(apiFilters, isAdmin, true);
    const { isLoading, isFetching, data, error } = query;
    const loading = isLoading && currentSearches.length === 0;
    const isNetworkErr = error && isNetworkError(error instanceof Error ? error : { message: String(error) });

    useErrorHandler(error instanceof Error ? error : null, !!error && !isNetworkErr);

    useEffect(() => {
        if (data) {
            setCurrentSearches(data.searches || []);
            setCurrentPagination('pagination' in data ? data.pagination : null);
        }
    }, [data]);

    useEffect(() => {
        if (Array.isArray(categories) && categories.length > 0 && filters.selectedCategories.length === 0) {
            setFilters((prev) => ({
                ...prev,
                selectedCategories: categories.map((c) => c.id),
            }));
        }
    }, [categories, filters.selectedCategories.length]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        const cursorPos = e.target.selectionStart;
        setSearchInput(newValue);
        cursorPositionRef.current = cursorPos;
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = setTimeout(() => {
            setFilters((prev) => ({ ...prev, search: newValue }));
        }, 400);
    };

    const handleSearchFocus = () => {
        isFocusedRef.current = true;
    };

    const handleSearchBlur = () => {
        isFocusedRef.current = false;
    };

    useLayoutEffect(() => {
        if (!isFocusedRef.current || !searchInputRef.current || cursorPositionRef.current === null) return;
        const input = searchInputRef.current;
        const cursorPos = cursorPositionRef.current;
        const restore = () => {
            if (!input || !isFocusedRef.current || !document.body.contains(input)) return;
            if (document.activeElement !== input) input.focus();
            if (cursorPos !== null && cursorPos <= input.value.length) {
                try {
                    input.setSelectionRange(cursorPos, cursorPos);
                } catch {
                    /* ignore */
                }
            }
        };
        restore();
        requestAnimationFrame(restore);
    }, [filters.search]);

    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        };
    }, []);

    const getCategoryName = useCallback(
        (categoryId: number | undefined | null): string => {
            if (!categoryId || !Array.isArray(categories) || categories.length === 0) {
                return 'Sin categoría';
            }
            const category = categories.find((cat) => {
                const catId = typeof cat.id === 'number' ? cat.id : parseInt(String(cat.id), 10);
                const searchId =
                    typeof categoryId === 'number' ? categoryId : parseInt(String(categoryId), 10);
                return catId === searchId;
            });
            return category?.name || 'Sin categoría';
        },
        [categories],
    );

    const handleSearchClick = useCallback(
        async (search: SearchItem) => {
            if (isAdmin) {
                try {
                    await reviseSearchMutation.mutateAsync(search.id);
                } catch (err) {
                    console.error('Failed to mark search as revised:', err);
                }
                navigate(ROUTES.searchReport(search.id));
                return;
            }
            // Si la búsqueda ya está contratada, abrir el chat de la contratación
            // incrustado en Mensajes (una conversación más de la bandeja) en vez de
            // la página de resultados. El detalle completo (cita/estado/pagos) sigue
            // accesible desde el botón "Ver detalle" del panel de Mensajes.
            if (search.searchHire?.id) {
                navigate(`/messages?searchHireId=${search.searchHire.id}`);
                return;
            }
            navigate(ROUTES.searchReport(search.id));
        },
        [isAdmin, navigate, reviseSearchMutation],
    );

    const goToCreateInspection = useCallback(() => {
        sessionStorage.setItem('scrollToFormSection', 'true');
        navigate('/');
    }, [navigate]);

    const clearSearch = useCallback(() => {
        setSearchInput('');
        setFilters((prev) => ({ ...prev, search: '' }));
    }, []);

    const refetch = useCallback(() => {
        void query.refetch();
    }, [query]);

    return {
        isAdmin,
        isAuthenticated,
        categories,
        filters,
        setFilters,
        searchInput,
        searchInputRef,
        handleSearchChange,
        handleSearchFocus,
        handleSearchBlur,
        viewMode,
        setViewMode,
        searches: currentSearches,
        pagination: currentPagination,
        loading,
        isFetching,
        isNetworkErr,
        error,
        getCategoryName,
        handleSearchClick,
        goToCreateInspection,
        clearSearch,
        refetch,
        navigate,
    };
}
