import { lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { NotFoundPage } from './NotFoundPage';
import { parsePositiveIntegerParam } from '../utils/routeParams';
import { isAdmin as isAdminUser } from '../utils/admin';
import { SearchDetailsSkeleton } from '../components/SearchDetailsSkeleton';

const SearchDetails = lazy(() => import('../components/SearchDetails'));

export function SearchResultsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = isAdminUser(user?.email) || user?.role === 'Admin' || user?.role === 'admin';
    const searchId = parsePositiveIntegerParam(id);

    if (!searchId) {
        return <NotFoundPage />;
    }

    return (
        <Suspense fallback={<SearchDetailsSkeleton />}>
            <SearchDetails
                searchId={searchId}
                onBack={() => navigate('/hires')}
                isAdmin={isAdmin}
            />
        </Suspense>
    );
}