import React, { useState } from 'react';
import { User, Lock, Shield, Bell, Globe, Trash2, AlertTriangle, X, ChevronRight, Menu } from 'lucide-react';
import { AccountDeletionModal } from './AccountDeletionModal';
import { useAuth } from '../contexts/AuthContext';
import { useMediaQuery } from '../hooks/useMediaQuery';
import {
    Dialog,
    DialogContent,
} from './ui/dialog';
import {
    Drawer,
    DrawerContent,
    DrawerClose,
    DrawerTrigger,
} from './ui/drawer';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Label } from './ui/label';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'profile' | 'security' | 'notifications' | 'privacy' | 'delete';

const tabs = [
  { id: 'profile' as TabType, label: 'Perfil', icon: User },
  { id: 'security' as TabType, label: 'Seguridad', icon: Shield },
  { id: 'notifications' as TabType, label: 'Notificaciones', icon: Bell },
  { id: 'privacy' as TabType, label: 'Privacidad', icon: Globe },
  { id: 'delete' as TabType, label: 'Eliminar Cuenta', icon: Trash2, destructive: true },
];

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const handleDeleteSuccess = () => {
    onClose();
    window.location.href = '/login';
  };

  const renderContent = () => (
    <>
      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="text-base font-medium">{user?.name || 'Usuario'}</h4>
                <p className="text-sm text-muted-foreground">{user?.email || 'usuario@email.com'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <input
                  type="text"
                  value={user?.name || ''}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <input
                  type="email"
                  value={user?.email || ''}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <h4 className="text-sm font-medium">Cambiar Contraseña</h4>
                    <p className="text-sm text-muted-foreground">Actualiza tu contraseña para mantener tu cuenta segura</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Cambiar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <h4 className="text-sm font-medium">Notificaciones por Email</h4>
                    <p className="text-sm text-muted-foreground">Recibe notificaciones por correo electrónico</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring peer-focus:ring-offset-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Tab */}
      {activeTab === 'privacy' && (
        <div className="space-y-4">
          <div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <h4 className="text-sm font-medium">Visibilidad del Perfil</h4>
                    <p className="text-sm text-muted-foreground">Controla quién puede ver tu perfil</p>
                  </div>
                </div>
                <select className="flex h-10 w-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
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
        <div className="space-y-4">
          <div>
            <div className="space-y-4">
              <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-destructive/20 rounded-full flex items-center justify-center">
                      <Trash2 className="w-5 h-5 text-destructive" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold mb-2">Eliminar Cuenta Permanentemente</h4>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      Esta acción eliminará tu cuenta y todos los datos asociados de forma irreversible. 
                      Se crearán disputas automáticas para proteger cualquier contratación activa.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      {!showDeleteButton ? (
                        <Button
                          variant="outline"
                          onClick={() => setShowDeleteButton(true)}
                          className="border-destructive text-destructive hover:bg-destructive/10"
                        >
                          Proceder con la Eliminación
                        </Button>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button
                            variant="outline"
                            onClick={() => setShowDeleteButton(false)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => setShowDeletionModal(true)}
                          >
                            Confirmar Eliminación
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {showDeleteButton && (
                <div className="p-5 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-amber-900 dark:text-amber-100 mb-3">Información Importante</h5>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-amber-800 dark:text-amber-200">Se verificarán tus contrataciones activas</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-amber-800 dark:text-amber-200">Se crearán disputas automáticas si es necesario</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-amber-800 dark:text-amber-200">Todos tus datos personales serán eliminados permanentemente</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-amber-800 dark:text-amber-200">No podrás recuperar tu cuenta después de la eliminación</span>
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
    </>
  );

  if (isDesktop) {
    return (
      <>
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px] [&>button]:hidden">
            <div className="flex overflow-hidden">
              {/* Sidebar Navigation */}
              <aside className="w-52 border-r border-border bg-muted flex flex-col flex-shrink-0">
                <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <React.Fragment key={tab.id}>
                        {tab.id === 'delete' && <Separator className="my-1" />}
                        <Button
                          variant={isActive ? (tab.destructive ? 'destructive' : 'secondary') : 'ghost'}
                          className="w-full justify-start h-9"
                          onClick={() => setActiveTab(tab.id)}
                        >
                          <Icon className="w-4 h-4 mr-2" />
                          <span>{tab.label}</span>
                        </Button>
                      </React.Fragment>
                    );
                  })}
                </nav>
              </aside>

              {/* Main Content */}
              <main className="flex h-[480px] flex-1 flex-col overflow-hidden bg-background">
                <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Configuración</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {tabs.find(t => t.id === activeTab)?.label}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto h-8 w-8"
                    onClick={onClose}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </header>
                <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
                  {renderContent()}
                </div>
              </main>
            </div>
          </DialogContent>
        </Dialog>

        <AccountDeletionModal
          isOpen={showDeletionModal}
          onClose={() => setShowDeletionModal(false)}
          onSuccess={handleDeleteSuccess}
        />
      </>
    );
  }

  // Mobile version
  return (
    <>
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[96vh]">
          <div className="mx-auto w-full max-w-4xl">
            {/* Mobile Header */}
            <div className="flex h-14 items-center gap-2 border-b border-border px-4">
              <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <DrawerTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="max-h-[96vh]">
                  <div className="p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-lg font-semibold">Configuración</h2>
                      <DrawerClose asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <X className="h-4 w-4" />
                        </Button>
                      </DrawerClose>
                    </div>
                    <nav className="space-y-1">
                      {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                          <React.Fragment key={tab.id}>
                            {tab.id === 'delete' && <Separator className="my-2" />}
                            <Button
                              variant={isActive ? (tab.destructive ? 'destructive' : 'secondary') : 'ghost'}
                              className="w-full justify-start h-11"
                              onClick={() => {
                                setActiveTab(tab.id);
                                setMobileMenuOpen(false);
                              }}
                            >
                              <Icon className="w-5 h-5 mr-3" />
                              <span>{tab.label}</span>
                            </Button>
                          </React.Fragment>
                        );
                      })}
                    </nav>
                  </div>
                </DrawerContent>
              </Drawer>

              <div className="flex-1">
                <span className="text-sm font-medium">
                  {tabs.find(t => t.id === activeTab)?.label}
                </span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Mobile Content */}
            <div className="overflow-y-auto p-4 max-h-[calc(96vh-56px)]">
              {renderContent()}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <AccountDeletionModal
        isOpen={showDeletionModal}
        onClose={() => setShowDeletionModal(false)}
        onSuccess={handleDeleteSuccess}
      />
    </>
  );
};
