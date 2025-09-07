import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchDashboard } from '../components/SearchDashboard';

const SearchesPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <SearchDashboard />
    );
};

export default SearchesPage;