import React from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ArrowLeft, Users, Settings, Bell, AlertTriangle, Activity, Home, LayoutDashboard, FolderTree, Link2 } from 'lucide-react';
import Background from '../Background';
import { useAuth } from '../../contexts/AuthContext';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <Background />
        <div className="relative z-10 text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
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
    return <Navigate to="/" replace />;
  }

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Usuarios', icon: Users },
    { path: '/admin/config', label: 'Configuración', icon: Settings },
    { path: '/admin/categories', label: 'Categorías', icon: FolderTree },
    { path: '/admin/mappings', label: 'Mapeos de Estado', icon: Link2 },
    { path: '/admin/notifications', label: 'Notificaciones', icon: Bell },
    { path: '/admin/disputes', label: 'Disputas', icon: AlertTriangle },
    { path: '/admin/hangfire', label: 'Hangfire', icon: Activity },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="relative min-h-screen">
      <Background />
      <div className="relative z-10 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen sticky top-0">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span className="font-semibold">Volver</span>
              </button>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mt-4">Panel Admin</h1>
          </div>
          
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto p-6">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};

