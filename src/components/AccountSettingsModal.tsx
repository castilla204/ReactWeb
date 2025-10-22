import React, { useState } from 'react';
import { X, User, Lock, Shield, Bell, Globe, Trash2, AlertTriangle } from 'lucide-react';
import { AccountDeletionModal } from './AccountDeletionModal';
import { useAuth } from '../contexts/AuthContext';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'privacy' | 'delete'>('profile');
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [showDeleteButton, setShowDeleteButton] = useState(false);

  const handleDeleteSuccess = () => {
    onClose();
    // Redirigir al login
    window.location.href = '/login';
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
        <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[80vh] overflow-hidden mx-2 sm:mx-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h2 className="text-base font-medium text-gray-900">Configuración de Cuenta</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col lg:flex-row h-[calc(80vh-60px)]">
            {/* Sidebar Navigation */}
            <div className="w-full lg:w-52 bg-gray-50 border-b lg:border-b-0 lg:border-r border-gray-200 p-3">
              <nav className="flex flex-wrap lg:flex-col lg:space-y-1 space-x-1 lg:space-x-0">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <User className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3" />
                  <span className="hidden sm:inline">Perfil</span>
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`flex items-center px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                    activeTab === 'security'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <Shield className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3" />
                  <span className="hidden sm:inline">Seguridad</span>
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`flex items-center px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                    activeTab === 'notifications'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <Bell className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3" />
                  <span className="hidden sm:inline">Notificaciones</span>
                </button>
                <button
                  onClick={() => setActiveTab('privacy')}
                  className={`flex items-center px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                    activeTab === 'privacy'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <Globe className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3" />
                  <span className="hidden sm:inline">Privacidad</span>
                </button>
                <button
                  onClick={() => setActiveTab('delete')}
                  className={`flex items-center px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                    activeTab === 'delete'
                      ? 'bg-red-600 text-white'
                      : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                  }`}
                >
                  <Trash2 className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3" />
                  <span className="hidden sm:inline">Eliminar Cuenta</span>
                </button>
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Información del Perfil</h3>
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{user?.name || 'Usuario'}</h4>
                          <p className="text-xs text-gray-500">{user?.email || 'usuario@email.com'}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            Nombre
                          </label>
                          <input
                            type="text"
                            value={user?.name || ''}
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md text-gray-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            Email
                          </label>
                          <input
                            type="email"
                            value={user?.email || ''}
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md text-gray-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Configuración de Seguridad</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center">
                            <Lock className="w-5 h-5 text-gray-600 mr-3" />
                            <div>
                              <h4 className="text-xs font-medium text-gray-900">Cambiar Contraseña</h4>
                              <p className="text-xs text-gray-600">Actualiza tu contraseña para mantener tu cuenta segura</p>
                            </div>
                          </div>
                          <button className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                            Cambiar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Preferencias de Notificaciones</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center">
                            <Bell className="w-5 h-5 text-gray-600 mr-3" />
                            <div>
                              <h4 className="text-xs font-medium text-gray-900">Notificaciones por Email</h4>
                              <p className="text-xs text-gray-600">Recibe notificaciones por correo electrónico</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Privacy Tab */}
                {activeTab === 'privacy' && (
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Configuración de Privacidad</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center">
                            <Globe className="w-5 h-5 text-gray-600 mr-3" />
                            <div>
                              <h4 className="text-xs font-medium text-gray-900">Visibilidad del Perfil</h4>
                              <p className="text-xs text-gray-600">Controla quién puede ver tu perfil</p>
                            </div>
                          </div>
                          <select className="px-3 py-1 bg-white border border-gray-300 rounded text-gray-900 text-sm">
                            <option>Público</option>
                            <option>Privado</option>
                            <option>Solo Amigos</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delete Account Tab */}
                {activeTab === 'delete' && (
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Eliminar Cuenta</h3>
                      
                      {/* Delete Account Section */}
                      <div className="space-y-3">
                        <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl">
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <Trash2 className="w-5 h-5 text-red-600" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-base font-semibold text-gray-900 mb-2">Eliminar Cuenta Permanentemente</h4>
                              <p className="text-xs text-gray-700 mb-3 leading-relaxed">
                                Esta acción eliminará tu cuenta y todos los datos asociados de forma irreversible. 
                                Se crearán disputas automáticas para proteger cualquier contratación activa.
                              </p>
                              
                              <div className="flex flex-col sm:flex-row gap-3">
                                {!showDeleteButton ? (
                                  <button
                                    onClick={() => setShowDeleteButton(true)}
                                    className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 hover:border-red-400 rounded-lg transition-all duration-200 hover:bg-red-50"
                                  >
                                    Proceder con la Eliminación
                                  </button>
                                ) : (
                                  <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                      onClick={() => setShowDeleteButton(false)}
                                      className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-700 border border-gray-300 hover:border-gray-400 rounded-lg transition-all duration-200 hover:bg-gray-50"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      onClick={() => setShowDeletionModal(true)}
                                      className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                                    >
                                      Confirmar Eliminación
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Warning Info - Only show when button is revealed */}
                        {showDeleteButton && (
                          <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                                </div>
                              </div>
                              <div className="flex-1">
                                <h5 className="font-semibold text-amber-900 mb-3">Información Importante</h5>
                                <div className="space-y-2">
                                  <div className="flex items-start space-x-2">
                                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <span className="text-sm text-amber-800">Se verificarán tus contrataciones activas</span>
                                  </div>
                                  <div className="flex items-start space-x-2">
                                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <span className="text-sm text-amber-800">Se crearán disputas automáticas si es necesario</span>
                                  </div>
                                  <div className="flex items-start space-x-2">
                                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <span className="text-sm text-amber-800">Todos tus datos personales serán eliminados permanentemente</span>
                                  </div>
                                  <div className="flex items-start space-x-2">
                                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <span className="text-sm text-amber-800">No podrás recuperar tu cuenta después de la eliminación</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Deletion Modal */}
      <AccountDeletionModal
        isOpen={showDeletionModal}
        onClose={() => setShowDeletionModal(false)}
        onSuccess={handleDeleteSuccess}
      />
    </>
  );
};
