import { useParams } from 'react-router-dom';
import SearchDetails from '../components/SearchDetails';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function SearchResultsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.email === 'dcastillaa@gmail.com';

    if (!id) {
        return null;
    }

    return (
        <SearchDetails
            searchId={parseInt(id)}
            onBack={() => navigate('/busquedas')}
            isAdmin={isAdmin}
        />
    );
}