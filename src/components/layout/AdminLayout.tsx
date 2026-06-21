import React from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ArrowLeft, Users, Settings, Bell, AlertTriangle, Activity, LayoutDashboard, FolderTree, Link2, Mail } from 'lucide-react';
import Background from '../Background';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/admin-panel.css';

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
    { path: '/admin/email-templates', label: 'Plantillas de email', icon: Mail },
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

  const sectionMeta: Record<string, { title: string; subtitle: string }> = {
    '/admin': { title: 'Dashboard', subtitle: 'Resumen y accesos del panel de administración' },
    '/admin/users': { title: 'Usuarios', subtitle: 'Gestión, bloqueo y eliminación de cuentas' },
    '/admin/config': { title: 'Configuración', subtitle: 'Reparto de pagos, Stripe y cancelaciones' },
    '/admin/categories': { title: 'Categorías', subtitle: 'Categorías del catálogo de servicios' },
    '/admin/mappings': { title: 'Mapeos de Estado', subtitle: 'Relación estado de cita → estado general' },
    '/admin/email-templates': { title: 'Plantillas de email', subtitle: 'Previsualización del diseño de los emails' },
    '/admin/notifications': { title: 'Notificaciones', subtitle: 'Envío y historial de notificaciones' },
    '/admin/disputes': { title: 'Disputas', subtitle: 'Resolución de incidencias y reembolsos' },
    '/admin/hangfire': { title: 'Hangfire', subtitle: 'Trabajos en segundo plano' },
  };

  const activeKey = Object.keys(sectionMeta)
    .filter((k) => (k === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(k)))
    .sort((a, b) => b.length - a.length)[0] ?? '/admin';
  const meta = sectionMeta[activeKey];

  return (
    <div className="relative min-h-screen">
      <Background />
      <div className="admin-shell relative z-10">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-brand">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-[hsl(var(--ap-sidebar-muted))] hover:text-[hsl(var(--ap-sidebar-ink))] transition-colors text-[12.5px] font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Volver al sitio
            </button>
            <span className="mt-2 text-sm font-extrabold text-[hsl(var(--ap-sidebar-ink))]">Admin · Inspecciono</span>
          </div>

          <nav className="admin-sidebar-nav">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`admin-nav-item ${active ? 'admin-nav-item--active' : ''}`}
                >
                  <Icon className="w-[18px] h-[18px]" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="admin-sidebar-footer">Panel interno · acceso restringido</div>
        </aside>

        <div className="admin-main">
          <div className="admin-topbar">
            <div>
              <div className="admin-topbar-title">{meta.title}</div>
              <div className="admin-topbar-subtitle">{meta.subtitle}</div>
            </div>
          </div>
          <div className="admin-workspace">{children || <Outlet />}</div>
        </div>
      </div>
    </div>
  );
};

