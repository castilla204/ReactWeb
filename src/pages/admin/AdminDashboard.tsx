import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Settings, Bell, AlertTriangle, Activity, ChevronRight } from 'lucide-react';
import { AdminCard, AdminPageHeader } from '../../components/admin/ui';

const cards = [
  { to: '/admin/users', icon: Users, title: 'Usuarios', desc: 'Administra usuarios, bloqueos y permisos', tone: 'text-[hsl(var(--ap-info))]' },
  { to: '/admin/config', icon: Settings, title: 'Configuración', desc: 'Porcentajes, estados y mapeos', tone: 'text-[hsl(var(--ap-brand))]' },
  { to: '/admin/notifications', icon: Bell, title: 'Notificaciones', desc: 'Gestiona notificaciones del sistema', tone: 'text-[hsl(var(--ap-warning))]' },
  { to: '/admin/disputes', icon: AlertTriangle, title: 'Disputas', desc: 'Revisa y resuelve disputas', tone: 'text-[hsl(var(--ap-error))]' },
  { to: '/admin/hangfire', icon: Activity, title: 'Hangfire', desc: 'Monitoreo de trabajos en segundo plano', tone: 'text-[hsl(var(--ap-success))]' },
];

const AdminDashboard: React.FC = () => {
  return (
    <>
      <AdminPageHeader title="Panel de administración" subtitle="Accesos rápidos a las áreas de gestión" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ to, icon: Icon, title, desc, tone }) => (
          <Link key={to} to={to} className="group">
            <AdminCard className="h-full transition-shadow hover:shadow-md">
              <div className="admin-card-body flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(220_16%_96%)]">
                  <Icon className={`h-5 w-5 ${tone}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[hsl(var(--ap-ink))]">{title}</span>
                    <ChevronRight className="h-4 w-4 text-[hsl(var(--ap-muted))] transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="mt-1 text-[13px] text-[hsl(var(--ap-muted))]">{desc}</p>
                </div>
              </div>
            </AdminCard>
          </Link>
        ))}
      </div>
    </>
  );
};

export default AdminDashboard;
