import React, { useState, useEffect } from 'react';
import { User, Lock, Shield, Bell, Globe, Trash2, AlertTriangle, X, ChevronRight, Menu, CheckCircle, Mail, Calendar, DollarSign, Plane, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useAccountDeletion } from '../hooks/useAccountDeletion';
import { AccountDeletionStatus, ActiveContract } from '../types/accountDeletion';
import { mfaService } from '../services/mfaService';
import { MFASetup } from './MFASetup';
// 🛡️ Round 28 MUD-F: wizard de mudanza self-service del experto.
// 🛡️ Round 28 MUD-U: import retirado — el wizard ya no se monta aquí. Lo monta
// ExpertPanelPage tras recibir el evento global dispatchado al cerrar este modal.
import { showToast } from '../lib/toast';
import { ProfilePhotoCropModal } from './becomeExpert/ProfilePhotoCropModal';
import { API_CONFIG } from '../config/api';
import { getAuthToken } from '../lib/auth';
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

type TabType = 'profile' | 'security' | 'notifications' | 'privacy' | 'relocate' | 'delete';

// 🛡️ Round 28 MUD-F: el tab 'relocate' solo se muestra a expertos (filtrado más abajo
// según user.Role === 'Expert'). El hook React no permite condicionales en `const tabs`
// por estar en module scope, así que el filtrado se hace al renderizar.
const allTabs = [
  { id: 'profile' as TabType, label: 'Perfil', icon: User, expertOnly: false },
  { id: 'security' as TabType, label: 'Seguridad', icon: Shield, expertOnly: false },
  { id: 'notifications' as TabType, label: 'Notificaciones', icon: Bell, expertOnly: false },
  { id: 'privacy' as TabType, label: 'Privacidad', icon: Globe, expertOnly: false },
  { id: 'relocate' as TabType, label: 'Mudarme a otro país', icon: Plane, expertOnly: true },
  { id: 'delete' as TabType, label: 'Eliminar Cuenta', icon: Trash2, destructive: true, expertOnly: false },
];

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user, setUser, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  // 🖼️ Avatar de cuenta: selección de fichero → recorte → subida.
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  // ✏️ Edición del nombre de la cuenta (el email no es editable).
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [isSavingName, setIsSavingName] = useState(false);
  // 🛡️ Round 28 MUD-F: detección rol experto + estado del wizard de mudanza.
  const userRole = (user as any)?.Role || (user as any)?.role;
  const isExpert = userRole === 'Expert';
  const tabs = allTabs.filter(t => !t.expertOnly || isExpert);
  // 🛡️ MUD-U: state retirado — el wizard vive en ExpertPanelPage.
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

  // ✏️ Mantener el input de nombre en sync con el usuario (al abrir el modal o tras refresh).
  useEffect(() => {
    setNameInput(user?.name || '');
  }, [user?.name]);

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
      // 🛡️ FIX: Desloguear INMEDIATAMENTE al confirmar la eliminación.
      //    Antes, el signOut solo se ejecutaba si el usuario pulsaba "Continuar";
      //    si cerraba el modal con ESC/X o abría otra pestaña, el JWT seguía
      //    en localStorage y el AuthContext seguía creyendo que estaba logueado.
      //    Llamamos a signOut() en background — el AuthContext ya es defensivo
      //    ante un /logout backend caído (la cuenta acaba de borrarse).
      void signOut();
    } else {
      setDeletionStep('confirm');
    }
  };

  const handleDeleteSuccess = () => {
    // El signOut() ya se disparó en handleDelete; aquí solo cerramos y redirigimos.
    onClose();
    // Hard redirect para garantizar que cualquier estado en memoria (React Query,
    // contextos, etc.) se descarte por completo.
    window.location.href = '/login';
  };

  const resetDeletionState = () => {
    setDeletionStep('initial');
    setDeletionStatus(null);
    setDeletionReason('');
    setDeletionResult(null);
    clearError();
  };

  // 🖼️ ───────────────────────── Avatar de cuenta ─────────────────────────
  const avatarUrl =
    (user as { ProfilePictureUrl?: string } | null)?.ProfilePictureUrl ??
    user?.profilePictureUrl ??
    '';

  const avatarInitials = (() => {
    const src = user?.name || user?.email || '';
    const parts = src.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  })();

  // Refleja el avatar nuevo en el contexto y en localStorage (sobrevive a recargas).
  const persistAvatar = (url: string | null) => {
    setUser(prev => (prev ? { ...prev, profilePictureUrl: url ?? undefined } : prev));
    try {
      for (const key of ['user', 'userData']) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const obj = JSON.parse(raw);
        obj.profilePictureUrl = url ?? undefined;
        obj.ProfilePictureUrl = url ?? undefined;
        localStorage.setItem(key, JSON.stringify(obj));
      }
    } catch { /* localStorage no disponible: el estado en memoria ya está actualizado */ }
  };

  // ✏️ Refleja el nombre nuevo en el contexto y en localStorage (sobrevive a recargas).
  const persistName = (newName: string) => {
    setUser(prev => (prev ? { ...prev, name: newName } : prev));
    try {
      for (const key of ['user', 'userData']) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const obj = JSON.parse(raw);
        obj.name = newName;
        obj.Name = newName;
        localStorage.setItem(key, JSON.stringify(obj));
      }
    } catch { /* localStorage no disponible: el estado en memoria ya está actualizado */ }
  };

  const trimmedName = nameInput.trim();
  const nameChanged = trimmedName !== (user?.name || '').trim();

  const handleSaveName = async () => {
    if (!trimmedName) {
      showToast('error', 'El nombre no puede estar vacío');
      return;
    }
    setIsSavingName(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.account.profile}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: trimmedName }),
      });
      if (!res.ok) {
        let msg = 'No se pudo actualizar el nombre';
        try { msg = (await res.json()).message || msg; } catch { /* sin cuerpo JSON */ }
        throw new Error(msg);
      }
      const data = await res.json();
      const saved = data.name ?? trimmedName;
      persistName(saved);
      setNameInput(saved);
      showToast('success', 'Nombre actualizado');
    } catch (err: any) {
      showToast('error', err?.message || 'No se pudo actualizar el nombre');
    } finally {
      if (isMountedRef.current) setIsSavingName(false);
    }
  };

  const handleAvatarFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Permitir volver a elegir el mismo fichero más tarde.
    if (e.target) e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'La imagen no puede superar los 5MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      showToast('error', 'Solo se permiten imágenes JPG o PNG');
      return;
    }
    setCropFile(file);
    setCropOpen(true);
  };

  const handleAvatarCropped = async (croppedFile: File) => {
    setCropOpen(false);
    setIsUploadingAvatar(true);
    try {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append('profilePicture', croppedFile);
      const res = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.account.avatar}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        let msg = 'No se pudo actualizar la foto de perfil';
        try { msg = (await res.json()).message || msg; } catch { /* sin cuerpo JSON */ }
        throw new Error(msg);
      }
      const data = await res.json();
      persistAvatar(data.profilePictureUrl ?? null);
      showToast('success', 'Foto de perfil actualizada');
    } catch (err: any) {
      showToast('error', err?.message || 'No se pudo actualizar la foto de perfil');
    } finally {
      if (isMountedRef.current) setIsUploadingAvatar(false);
      setCropFile(null);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.account.avatar}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        let msg = 'No se pudo quitar la foto de perfil';
        try { msg = (await res.json()).message || msg; } catch { /* sin cuerpo JSON */ }
        throw new Error(msg);
      }
      persistAvatar(null);
      showToast('success', 'Foto de perfil eliminada');
    } catch (err: any) {
      showToast('error', err?.message || 'No se pudo quitar la foto de perfil');
    } finally {
      if (isMountedRef.current) setIsUploadingAvatar(false);
    }
  };

  const renderContent = () => (
    <>
      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-4 mb-4">
              {/* 🖼️ Avatar: foto si existe, si no iniciales (registro por email sin foto) */}
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Foto de perfil"
                  className="w-16 h-16 rounded-full object-cover shrink-0"
                />
              ) : (
                <span
                  aria-hidden
                  className="inline-flex w-16 h-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-semibold"
                >
                  {avatarInitials || <User className="w-6 h-6" />}
                </span>
              )}
              <div className="min-w-0">
                <h4 className="text-base font-medium truncate">{user?.name || 'Usuario'}</h4>
                <p className="text-sm text-muted-foreground truncate">{user?.email || 'usuario@email.com'}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={handleAvatarFileSelected}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploadingAvatar}
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    {isUploadingAvatar ? 'Guardando…' : (avatarUrl ? 'Cambiar foto' : 'Añadir foto')}
                  </Button>
                  {/* El experto no puede quitar su foto (es pública y obligatoria) */}
                  {avatarUrl && !isExpert && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isUploadingAvatar}
                      onClick={handleRemoveAvatar}
                    >
                      Quitar
                    </Button>
                  )}
                </div>
                {isExpert && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Esta foto es también tu foto pública como experto.
                  </p>
                )}
              </div>
            </div>

            {/* 🖼️ Recorte de la foto antes de subir (reutiliza el flujo del experto) */}
            <ProfilePhotoCropModal
              open={cropOpen}
              onOpenChange={setCropOpen}
              file={cropFile}
              onConfirm={handleAvatarCropped}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={100}
                  disabled={isSavingName}
                  placeholder="Tu nombre"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    disabled={isSavingName || !nameChanged || !trimmedName}
                    onClick={handleSaveName}
                  >
                    {isSavingName ? 'Guardando…' : 'Guardar nombre'}
                  </Button>
                </div>
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

      {/* 🛡️ Round 28 MUD-F: Tab Mudarme (solo expertos) */}
      {activeTab === 'relocate' && isExpert && (
        <div className="space-y-4">
          <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Plane className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-base font-semibold text-blue-900">¿Te has mudado a otro país?</h4>
                <p className="text-sm text-blue-800 mt-1">
                  Stripe Connect no permite cambiar el país de tu cuenta de cobros. Si te has mudado, este asistente cierra tu cuenta Stripe actual y te prepara para hacer un onboarding nuevo en tu país de residencia.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Qué pasa al ejecutar el asistente
            </h5>
            <ul className="text-sm text-muted-foreground space-y-1.5 pl-5 list-disc">
              <li>Verificamos que no haya dinero en vuelo (disputas, refunds o servicios contratados activos).</li>
              <li>Cerramos tu cuenta Stripe Connect actual.</li>
              <li>Desactivamos tus servicios actuales (siguen visibles en historial, pero no aparecen en búsquedas).</li>
              <li>Tus reviews recibidas se preservan con badge "Servicio prestado en {`{país}`}".</li>
              <li>Te dirigimos a "Convertirse en experto" para registrar tu nuevo país y reanudar el onboarding.</li>
            </ul>
          </div>

          <Button
            onClick={() => {
              // 🛡️ Round 28 MUD-U: cerrar este modal ANTES de abrir el wizard.
              // Radix Dialog/Vaul aplica inert/aria-hidden a body cuando está abierto,
              // así que un wizard en portal queda inert (visible pero sin eventos).
              // Cerramos primero y dispatchamos evento que ExpertPanelPage recoge.
              onClose();
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('openExpertRelocationWizard'));
              }, 50);
            }}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Plane className="w-4 h-4 mr-2" />
            Iniciar asistente de mudanza
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Esta acción cierra tu cuenta Stripe Connect actual. La acción es irreversible.
          </p>
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

      // 🛡️ Si la cuenta ya se eliminó, cerrar el modal debe redirigir SIEMPRE
      //    al login para evitar dejar al usuario en una vista zombi.
      if (deletionStep === 'result') {
        closeTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            onClose();
            window.location.href = '/login';
          }
          closeTimeoutRef.current = null;
        }, 150);
        return;
      }

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
  }, [onClose, deletionStep]);

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
      // 🛡️ Si la cuenta ya se eliminó, cerrar el modal debe redirigir SIEMPRE
      //    al login para evitar dejar al usuario en una vista zombi.
      if (deletionStep === 'result') {
        onClose();
        window.location.href = '/login';
        return;
      }
      // Cerrar inmediatamente - Radix UI maneja el overlay automáticamente
      onClose();
    }
  }, [onClose, deletionStep]);

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
              // 🛡️ Round 28 MUD-T: dejar pasar clicks del wizard de mudanza (portal en body).
              const target = e.target as HTMLElement | null;
              if (target?.closest('[data-relocation-wizard]')) return;
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

      {/* 🛡️ Round 28 MUD-U: wizard NO se monta aquí — ExpertPanelPage lo monta y
          escucha el evento global 'openExpertRelocationWizard' (necesario porque este
          modal aplica inert al wizard portal cuando está abierto). */}
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
              {/* 🛡️ Round 28 — Sprint 3: el backend ahora emite Currency en ActiveContractInfo. */}
              <span>
                {new Intl.NumberFormat('es-ES', {
                  style: 'currency',
                  currency: ((contract.currency || (contract as any).chargeCurrency || 'EUR') as string).toUpperCase(),
                }).format(contract.amount)}
              </span>
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
