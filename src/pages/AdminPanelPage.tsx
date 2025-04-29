import React, { useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { UserManagement } from '../components/UserManagement';
import { ArrowLeft } from 'lucide-react';
import Background from '../components/Background';
import { useAuth } from '../contexts/AuthContext';

const AdminPanelPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        console.log('AdminPanelPage - User:', user);
        console.log('AdminPanelPage - isAuthenticated:', isAuthenticated);
        console.log('AdminPanelPage - isLoading:', isLoading);
    }, [user, isAuthenticated, isLoading]);

    if (isLoading) {
        return (
            <div className="relative min-h-screen flex items-center justify-center">
                <Background />
                <div className="relative z-10 text-gray-600">Cargando...</div>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        console.log('Redirecting: Not authenticated or no user');
        return <Navigate to="/" replace />;
    }

    const userEmail = user?.email?.trim().toLowerCase();
    const adminEmail = 'dcastillaa@gmail.com'.toLowerCase();
    if (userEmail !== adminEmail) {
        console.log(`Access denied: user email (${userEmail}) does not match admin email (${adminEmail})`);
        return <Navigate to="/" replace />;
    }

    return (
        <div className="relative min-h-screen">
            <Background />
            <div className="relative z-10">
                <button
                    onClick={() => navigate('/')}
                    className="ml-4 mt-4 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Volver
                </button>
                <UserManagement onBack={() => navigate('/')} />
            </div>
        </div>
    );
};

export default AdminPanelPage;