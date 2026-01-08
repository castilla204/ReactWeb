import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Settings, Bell, AlertTriangle, Activity, LayoutDashboard } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const cards = [
    {
      title: 'Gestión de Usuarios',
      description: 'Administra usuarios, bloqueos y permisos',
      icon: Users,
      path: '/admin/users',
      color: 'bg-blue-500',
    },
    {
      title: 'Configuración',
      description: 'Porcentajes, estados y mapeos',
      icon: Settings,
      path: '/admin/config',
      color: 'bg-green-500',
    },
    {
      title: 'Notificaciones',
      description: 'Gestiona notificaciones del sistema',
      icon: Bell,
      path: '/admin/notifications',
      color: 'bg-yellow-500',
    },
    {
      title: 'Disputas',
      description: 'Revisa y resuelve disputas',
      icon: AlertTriangle,
      path: '/admin/disputes',
      color: 'bg-red-500',
    },
    {
      title: 'Hangfire',
      description: 'Monitoreo de trabajos en segundo plano',
      icon: Activity,
      path: '/admin/hangfire',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard de Administración</h2>
        <p className="text-gray-600 mt-2">Gestiona todas las áreas del sistema desde aquí</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.path}
              onClick={() => navigate(card.path)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left group"
            >
              <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{card.title}</h3>
              <p className="text-sm text-gray-600">{card.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AdminDashboard;






