import React, { useState, useEffect } from 'react';
import { User, Lock, Shield, Bell, Globe, Trash2, AlertTriangle, X, ChevronRight, Menu, CheckCircle, Mail, Calendar, DollarSign } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useAccountDeletion } from '../hooks/useAccountDeletion';
import { AccountDeletionStatus, ActiveContract } from '../types/accountDeletion';
import { mfaService } from '../services/mfaService';
import { MFASetup } from './MFASetup';
import { showToast } from '../lib/toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from './ui/dialog';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  // ✅ Ref para rastrear si el componente está montado y limpiar timeouts
  const isMountedRef = React.useRef(true);
  const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Estados para eliminación de cuenta
  const [deletionStep, setDeletionStep] = useState<'initial' | 'check' | 'confirm' | 'processing' | 'result'>('initial');
  const [deletionStatus, setDeletionStatus] = useState<AccountDeletionStatus | null>(null);
  
  // Estados para MFA
  const [mfaStatus, setMfaStatus] = useState<any>(null);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [loadingMFAStatus, setLoadingMFAStatus] = useState(false);
  
  const [deletionReason, setDeletionReason] = useState('');
  const [deletionPassword, setDeletionPassword] = useState('');
  const [deletionResult, setDeletionResult] = useState<any>(null);
  
  const { 
    loading: deletionLoading, 
    error: deletionError, 
    checkDeletionStatus, 
    deleteAccount, 
    clearError 
  } = useAccountDeletion();

  useEffect(() => {
    if (activeTab === 'delete' && deletionStep === 'initial') {
      setDeletionStep('check');
      checkStatus();
    }
  }, [activeTab]);

  // Cargar estado MFA cuando se abre la pestaña de seguridad (con debounce)
  useEffect(() => {
    if (activeTab === 'security' && !mfaStatus && !loadingMFAStatus) {
      // Agregar un pequeño delay para evitar múltiples llamadas
      const timer = setTimeout(() => {
        loadMFAStatus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  const loadMFAStatus = async () => {
    // Evitar múltiples llamadas simultáneas
    if (loadingMFAStatus) return;
    
    setLoadingMFAStatus(true);
    try {
      const status = await mfaService.getMFAStatus();
      setMfaStatus(status);
    } catch (error: any) {
      console.error('Error loading MFA status:', error);
      // Si el error es 404, 429 o similar, MFA no está habilitado o hay rate limiting
      if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
        // Para rate limiting, mostrar estado por defecto sin alarmar
        setMfaStatus({ isEnabled: false });
      } else if (error.message?.includes('404') || error.response?.status === 404) {
        setMfaStatus({ isEnabled: false });
      } else {
        // Otros errores - mantener estado anterior o mostrar por defecto
        setMfaStatus({ isEnabled: false });
      }
    } finally {
      setLoadingMFAStatus(false);
    }
  };

  const handleMFASetupComplete = () => {
    setShowMFASetup(false);
    // Limpiar caché y forzar refresh
    console.log('[AccountSettings] MFA setup complete, clearing cache');
    mfaService.clearCache();
    // Limpiar banners dismissed
    localStorage.removeItem('mfa-banner-dismissed');
    localStorage.removeItem('mfa-recommendation-banner-dismissed');
    setTimeout(() => {
      loadMFAStatus();
    }, 500);
    showToast('success', 'MFA configurado exitosamente. La próxima vez que inicies sesión, se te pedirá el código MFA.');
  };

  const handleDisableMFA = async () => {
    const password = prompt('Ingresa tu contraseña:');
    const totpCode = prompt('Ingresa el código de tu app:');

    if (!password || !totpCode) return;

    try {
      await mfaService.disableMFA(password, totpCode);
      // Limpiar caché y forzar refresh
      mfaService.clearCache();
      setTimeout(() => {
        loadMFAStatus();
      }, 500);
      showToast('success', 'MFA deshabilitado');
    } catch (error: any) {
      showToast('error', error.response?.data?.message || error.message || 'Error al deshabilitar MFA');
    }
  };

  const checkStatus = async () => {
    const status = await checkDeletionStatus();
    if (status) {
      setDeletionStatus(status);
      setDeletionStep('confirm');
    } else {
      setDeletionStep('initial');
    }
  };

  const handleDelete = async () => {
    setDeletionStep('processing');
    clearError();
    
    // ✅ El backend ya no requiere contraseña, solo razón opcional
    const request: any = deletionReason.trim() ? { reason: deletionReason.trim() } : {};
    
    const response = await deleteAccount(request);
    
    if (response) {
      setDeletionResult(response);
      setDeletionStep('result');
    } else {
      setDeletionStep('confirm');
    }
  };

  const handleDeleteSuccess = () => {
    onClose();
    window.location.href = '/login';
  };

  const resetDeletionState = () => {
    setDeletionStep('initial');
    setDeletionStatus(null);
    setDeletionReason('');
    setDeletionResult(null);
    clearError();
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
          {showMFASetup ? (
            <MFASetup 
              onComplete={handleMFASetupComplete} 
              onCancel={() => setShowMFASetup(false)} 
            />
          ) : (
            <>
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

                {/* MFA Section */}
                <div className="p-4 border border-border rounded-lg space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    <h4 className="text-sm font-medium">Autenticación de Dos Factores (MFA)</h4>
                  </div>

                  {loadingMFAStatus ? (
                    <p className="text-sm text-muted-foreground">Cargando estado de MFA...</p>
                  ) : mfaStatus?.isEnabled ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">MFA Habilitado</span>
                      </div>
                      {mfaStatus.enabledAt && (
                        <p className="text-xs text-muted-foreground">
                          Habilitado el: {new Date(mfaStatus.enabledAt).toLocaleDateString('es-ES')}
                        </p>
                      )}
                      {mfaStatus.lastVerifiedAt && (
                        <p className="text-xs text-muted-foreground">
                          Última verificación: {new Date(mfaStatus.lastVerifiedAt).toLocaleDateString('es-ES')}
                        </p>
                      )}
                      {mfaStatus.remainingRecoveryCodes !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          Códigos de recuperación restantes: {mfaStatus.remainingRecoveryCodes}
                        </p>
                      )}
                      {mfaStatus.remainingRecoveryCodes !== undefined && mfaStatus.remainingRecoveryCodes <= 3 && (
                        <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-600 dark:text-yellow-400">
                          ⚠️ Quedan pocos códigos de recuperación. Considera regenerarlos.
                        </div>
                      )}
                      <Button 
                        onClick={handleDisableMFA} 
                        variant="destructive" 
                        size="sm"
                      >
                        Deshabilitar MFA
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <X className="w-4 h-4" />
                        <span className="text-sm">MFA No habilitado</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Recomendamos habilitar MFA para mayor seguridad.
                      </p>
                      <Button 
                        onClick={() => setShowMFASetup(true)} 
                        variant="default" 
                        size="sm"
                      >
                        Habilitar MFA
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
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
          {/* Step 1: Checking Status */}
          {deletionStep === 'check' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-destructive mx-auto mb-4"></div>
              <p className="text-muted-foreground">Verificando estado de tu cuenta...</p>
            </div>
          )}

          {/* Step 2: Confirmation */}
          {deletionStep === 'confirm' && deletionStatus && (
            <div className="space-y-6">
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
                    </p>
                  </div>
                </div>
              </div>

              {/* Warning about active contracts */}
              {deletionStatus.hasActiveContracts && (
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                        Contrataciones Activas Detectadas
                      </h3>
                      <p className="text-sm text-orange-800 dark:text-orange-200 mb-3">
                        Tienes {deletionStatus.activeContractsCount} contratación(es) activa(s). 
                        Al eliminar tu cuenta, estas se cancelarán automáticamente a favor de la parte contraria 
                        y se crearán disputas automáticas para proteger a las partes afectadas.
                      </p>
                      
                      {/* Active Contracts List */}
                      {deletionStatus.activeContracts.length > 0 && (
                        <div className="space-y-3 mt-3">
                          {deletionStatus.activeContracts.map((contract) => (
                            <ActiveContractCard key={contract.searchHireId} contract={contract} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {deletionError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                    <p className="text-red-700 dark:text-red-300 text-sm">{deletionError}</p>
                  </div>
                </div>
              )}

              {/* Deletion reason */}
              <div>
                <Label>Razón para eliminar la cuenta (opcional)</Label>
                <textarea
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  placeholder="Ej: Ya no necesito el servicio, problemas técnicos, etc."
                  className="mt-2 w-full p-3 border border-input rounded-md bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  rows={3}
                />
              </div>


              {/* Action buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={resetDeletionState}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deletionLoading}
                  className="flex-1"
                >
                  {deletionLoading ? 'Eliminando...' : 'Eliminar Cuenta'}
                </Button>
                      </div>
                    </div>
          )}

          {/* Step 3: Processing */}
          {deletionStep === 'processing' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-destructive mx-auto mb-4"></div>
              <p className="text-muted-foreground">Eliminando tu cuenta y procesando contrataciones activas...</p>
                        </div>
          )}

          {/* Step 4: Result */}
          {deletionStep === 'result' && deletionResult && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Cuenta Eliminada Exitosamente
                </h3>
                <p className="text-muted-foreground">{deletionResult.message}</p>
                        </div>

              {/* Disputes created */}
              {deletionResult.disputesCreated && deletionResult.disputesCreated.length > 0 && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">
                    Disputas Creadas Automáticamente
                  </h4>
                  <div className="space-y-2">
                    {deletionResult.disputesCreated.map((dispute: any) => (
                      <div key={dispute.disputeId} className="text-sm text-blue-700 dark:text-blue-300">
                        <p><strong>Disputa #{dispute.disputeId}:</strong> {dispute.reason}</p>
                        <p>Usuario afectado: {dispute.affectedPartyName} ({dispute.affectedPartyEmail})</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-3">
                    Los usuarios afectados han sido notificados y tienen 48 horas para responder.
                  </p>
                </div>
              )}

              <Button
                onClick={handleDeleteSuccess}
                className="w-full"
              >
                Continuar
              </Button>
            </div>
          )}

          {/* Initial state */}
          {deletionStep === 'initial' && (
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
                    Si tienes contrataciones activas, estas se cancelarán automáticamente a favor de la parte contraria.
                  </p>
                  
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setDeletionStep('check');
                      checkStatus();
                    }}
                    className="w-full sm:w-auto"
                  >
                    Iniciar Eliminación
                  </Button>
                </div>
            </div>
          </div>
          )}
        </div>
      )}
    </>
  );

  // ✅ TODOS LOS HOOKS DEBEN ESTAR ANTES DE CUALQUIER RETURN CONDICIONAL
  // ✅ Cleanup effect para limpiar timeouts cuando el componente se desmonta
  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Limpiar timeout si existe
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    };
  }, []);

  // ✅ Cerrar drawer anidado cuando el drawer principal se cierra
  React.useEffect(() => {
    if (!isOpen) {
      setMobileMenuOpen(false);
      // Limpiar timeout si existe
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    }
  }, [isOpen]);

  // ✅ Mobile version handlers
  const handleDrawerOpenChange = React.useCallback((open: boolean) => {
    if (!open) {
      // Limpiar timeout anterior si existe
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      
      // Cerrar el drawer anidado primero para evitar conflictos de DOM
      setMobileMenuOpen(false);
      
      // Pequeño delay para asegurar que el drawer anidado se cierre antes
      // Solo llamar onClose si el componente sigue montado
      closeTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          onClose();
        }
        closeTimeoutRef.current = null;
      }, 150);
    }
    // Si open es true, no hacemos nada - el drawer se abre automáticamente
  }, [onClose]);

  const handleNestedDrawerOpenChange = React.useCallback((open: boolean) => {
    setMobileMenuOpen(open);
  }, []);

  // ✅ Handler para el Dialog de desktop - debe manejar correctamente el estado
  const handleDialogOpenChange = React.useCallback((open: boolean) => {
    if (!open && isMountedRef.current) {
      // Limpiar timeout si existe
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      // Cerrar inmediatamente - Radix UI maneja el overlay automáticamente
      onClose();
    }
  }, [onClose]);

  if (isDesktop) {
    // ✅ Solo renderizar el Dialog si está abierto para evitar overlays huérfanos
    if (!isOpen) {
      return null;
    }
    
    return (
      <>
        <Dialog open={isOpen} onOpenChange={handleDialogOpenChange} modal={true}>
          <DialogContent 
            className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px] [&>button]:hidden"
            onEscapeKeyDown={(e) => {
              // Permitir cerrar con ESC
              e.preventDefault();
              handleDialogOpenChange(false);
            }}
            onPointerDownOutside={(e) => {
              // Permitir cerrar haciendo clic fuera
              e.preventDefault();
              handleDialogOpenChange(false);
            }}
          >
            <DialogHeader className="sr-only">
              <DialogTitle>Configuración de Cuenta</DialogTitle>
              <DialogDescription>Gestiona tu perfil, seguridad, notificaciones y privacidad</DialogDescription>
            </DialogHeader>
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
                    onClick={() => handleDialogOpenChange(false)}
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

      </>
    );
  }

  // ✅ Solo renderizar el Drawer móvil si está abierto para evitar overlays huérfanos
  if (!isOpen) {
    return null;
  }

  return (
    <>
      <Drawer open={isOpen} onOpenChange={handleDrawerOpenChange}>
        <DrawerContent className="max-h-[96vh]">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Configuración de Cuenta</DrawerTitle>
            <DrawerDescription>Gestiona tu perfil, seguridad, notificaciones y privacidad</DrawerDescription>
          </DrawerHeader>
          <div className="mx-auto w-full max-w-4xl">
            {/* Mobile Header */}
            <div className="flex h-14 items-center gap-2 border-b border-border px-4">
              {/* ✅ Solo renderizar el drawer anidado si el drawer principal está abierto */}
              {isOpen && (
                <Drawer open={mobileMenuOpen && isOpen} onOpenChange={handleNestedDrawerOpenChange}>
                  <DrawerTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="max-h-[96vh]">
                  <DrawerHeader className="sr-only">
                    <DrawerTitle>Menú de Configuración</DrawerTitle>
                    <DrawerDescription>Navega entre las opciones de configuración</DrawerDescription>
                  </DrawerHeader>
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
              )}

              <div className="flex-1">
                <span className="text-sm font-medium">
                  {tabs.find(t => t.id === activeTab)?.label}
                </span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => handleDrawerOpenChange(false)}
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
    </>
  );
};

// Componente para mostrar información de contratación activa
const ActiveContractCard: React.FC<{ contract: ActiveContract }> = ({ contract }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <User className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" />
            <span className="font-medium text-gray-900 dark:text-gray-100">{contract.serviceName}</span>
            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
              contract.status === 'pending' ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' :
              contract.status === 'awaiting_client_decision' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
              'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
            }`}>
              {contract.status}
            </span>
          </div>
          
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              <span>€{contract.amount.toFixed(2)}</span>
            </div>
            
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              <span>{contract.otherPartyName}</span>
            </div>
            
            <div className="flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              <span>{contract.otherPartyEmail}</span>
            </div>
            
            {contract.hasAppointment && contract.appointmentDate && (
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Cita: {new Date(contract.appointmentDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
