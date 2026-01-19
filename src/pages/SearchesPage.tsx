import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SearchDashboard } from '../components/SearchDashboard';

const SearchesPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Posicionar arriba cuando se carga o se vuelve a la página (sin scroll)
    useEffect(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, [location.pathname]);

    return (
        <SearchDashboard />
    );
};

export default SearchesPage;