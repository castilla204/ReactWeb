import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Settings, Percent, Link2, FolderTree, CreditCard, Search } from 'lucide-react';
import AdminPanel from '../../components/AdminPanel';

const AdminConfigPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Si estamos en /admin/config, mostrar el AdminPanel completo
  // Si estamos en una subruta, mostrar el Outlet
  if (location.pathname !== '/admin/config') {
    return <Outlet />;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h2>
        <p className="text-gray-600 mt-1">Gestiona porcentajes, estados y mapeos</p>
      </div>
      <AdminPanel />
    </div>
  );
};

export default AdminConfigPage;

