import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { UserManagement } from '../components/UserManagement';
import AdminPanel from '../components/AdminPanel';
import NotificationManagement from '../components/NotificationManagement';
import { DisputePanel } from '../components/DisputePanel';
import HangfirePanel from '../components/HangfirePanel';
import { ArrowLeft, Users, Settings, Bell, AlertTriangle, Activity } from 'lucide-react';
import Background from '../components/Background';
import { useAuth } from '../contexts/AuthContext';

const AdminPanelPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading } = useAuth();
    const [activeTab, setActiveTab] = useState<'users' | 'config' | 'notifications' | 'disputes' | 'hangfire'>('users');

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

    // El objeto user viene del backend con mayúsculas: Email, Role (no email, role)
    const userEmail = (user?.Email || user?.email || '').trim().toLowerCase();
    const adminEmail = 'dcastillaa@gmail.com'.toLowerCase();
    const userRole = user?.Role || user?.role;
    
    // Verificar por email o por rol
    const isAdminByEmail = userEmail === adminEmail;
    const isAdminByRole = userRole === 'Admin' || userRole === 'admin';
    
    if (!isAdminByEmail && !isAdminByRole) {
        console.log(`Access denied: user email (${userEmail}) does not match admin email (${adminEmail}) and role (${userRole}) is not Admin`);
        return <Navigate to="/" replace />;
    }

    return (
        <div className="relative min-h-screen">
            <Background />
            <div className="relative z-10">
                {/* Header */}
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => navigate('/')}
                                    className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5 mr-2" />
                                    Volver
                                </button>
                                <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-6">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'users'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <Users className="w-4 h-4" />
                                    <span>Gestión de Usuarios</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('config')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'config'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <Settings className="w-4 h-4" />
                                    <span>Configuración de Porcentajes</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('notifications')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'notifications'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <Bell className="w-4 h-4" />
                                    <span>Gestión de Notificaciones</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('disputes')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'disputes'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>Panel de Disputas</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('hangfire')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'hangfire'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <Activity className="w-4 h-4" />
                                    <span>Hangfire</span>
                                </div>
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-7xl mx-auto">
                    {activeTab === 'users' && <UserManagement onBack={() => navigate('/')} />}
                    {activeTab === 'config' && <AdminPanel />}
                    {activeTab === 'notifications' && <NotificationManagement />}
                    {activeTab === 'disputes' && <DisputePanel />}
                    {activeTab === 'hangfire' && <HangfirePanel />}
                </div>
            </div>
        </div>
    );
};

export default AdminPanelPage;