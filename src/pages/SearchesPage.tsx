import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchDashboard } from '../components/SearchDashboard';
import Background from '../components/Background';

const SearchesPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="relative min-h-screen">
            <Background />
            <div className="relative z-10">
                <SearchDashboard onBack={() => navigate('/')} />
            </div>
        </div>
    );
};

export default SearchesPage;