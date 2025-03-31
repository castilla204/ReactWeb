import  { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAuthToken } from '../lib/auth';

interface Category {
    id: number;
    name: string;
    parentId: number | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface CategoryContextType {
    categories: Category[];
    loading: boolean;
    error: string | null;
}

const CategoryContext = createContext<CategoryContextType>({
    categories: [],
    loading: true,
    error: null
});

export function CategoryProvider({ children }: { children: ReactNode }) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('http://localhost:7124/api/Categories', {
                    headers: getAuthToken() ? {
                        'Authorization': `Bearer ${getAuthToken()}`
                    } : {}
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch categories');
                }

                const data = await response.json();
                console.log('Fetched categories:', data);
                setCategories(data);
            } catch (err) {
                console.error('Error fetching categories:', err);
                setError(err instanceof Error ? err.message : 'Failed to load categories');
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    return (
        <CategoryContext.Provider value={{ categories, loading, error }}>
            {children}
        </CategoryContext.Provider>
    );
}

export function useCategories() {
    const context = useContext(CategoryContext);
    if (!context) {
        throw new Error('useCategories must be used within a CategoryProvider');
    }
    return context;
}

export { CategoryContext };