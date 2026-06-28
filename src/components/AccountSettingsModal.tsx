import React, { useState, useEffect } from 'react';
import { User, Lock, Shield, Bell, Globe, Trash2, AlertTriangle, X, ChevronRight, ChevronLeft, CheckCircle, Mail, Plane, MapPin, MessageCircle } from 'lucide-react';
import { SileoLoader } from './ui/sileo-loader';
import { useAuth } from '../contexts/AuthContext';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useAccountDeletion } from '../hooks/useAccountDeletion';
import { useUserSettings } from '../hooks/useUserSettings';
import { AccountDeletionStatus, ActiveContract } from '../types/accountDeletion';
import { mfaService } from '../services/mfaService';
import { MFASetup } from './MFASetup';
import { DisableMFAModal } from './DisableMFAModal';
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
  // 📱 Navegación móvil maestro-detalle (estilo ajustes nativo): 'list' muestra
  //    el índice de secciones; 'detail' muestra el contenido del tab activo.
  //    Sustituye al antiguo drawer anidado con hamburguesa (3 toques → 1 toque).
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const isDesktop = useMediaQuery('(min-width: 768px)');
  // 🔐 Modal para deshabilitar MFA (sustituye a los prompt() nativos).
  const [showDisableMFA, setShowDisableMFA] = useState(false);
  // 🔔 Ajustes de notificaciones reales (email / WhatsApp) desde el backend.
  const { settings, isLoadingSettings, toggleEmail, toggleWhatsApp, isUpdating: isUpdatingSettings } = useUserSettings();
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
  // 🛡️ SEC-1: reautenticación. usesOtp=null mientras se determina el método;
  // true para cuentas OAuth (OTP step-up por email), false para cuentas con contraseña.
  const [deletionUsesOtp, setDeletionUsesOtp] = useState<boolean | null>(null);
  const [deletionToken, setDeletionToken] = useState('');
  const [deletionCode, setDeletionCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const {
    loading: deletionLoading,
    error: deletionError,
    checkDeletionStatus,
    requestDeletionOtp,
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

  // 🔐 Tras deshabilitar MFA desde el modal: limpiar caché y refrescar estado.
  const handleDisableMFASuccess = () => {
    mfaService.clearCache();
    setTimeout(() => {
      loadMFAStatus();
    }, 500);
  };

  const checkStatus = async () => {
    const status = await checkDeletionStatus();
    if (status) {
      setDeletionStatus(status);
      setDeletionStep('confirm');
      // 🛡️ SEC-1: NO determinamos el método ni enviamos el OTP automáticamente. El correo de
      // verificación se envía SOLO cuando el usuario pulsa "Verificar identidad"
      // (requestDeletionReauth), para no mandar emails sin que los pida.
      setDeletionUsesOtp(null);
    } else {
      setDeletionStep('initial');
    }
  };

  // 🛡️ SEC-1: dispara la reautenticación BAJO DEMANDA (al pulsar el botón). Para cuentas OAuth
  // esto envía el código OTP por email; para cuentas con contraseña solo revela el campo de
  // contraseña (en ese caso el backend no envía ningún correo).
  const requestDeletionReauth = async () => {
    const otp = await requestDeletionOtp();
    if (otp) {
      setDeletionUsesOtp(otp.requiresOtp);
      if (otp.requiresOtp && otp.verificationToken) {
        setDeletionToken(otp.verificationToken);
        setOtpSent(otp.success !== false);
      }
    } else {
      // Fallback conservador: si no se pudo determinar, asumimos OTP (cuenta OAuth).
      setDeletionUsesOtp(true);
    }
  };

  // 🛡️ SEC-1: reenviar el código OTP.
  const resendDeletionOtp = async () => {
    const otp = await requestDeletionOtp();
    if (otp?.requiresOtp && otp.verificationToken) {
      setDeletionToken(otp.verificationToken);
      setOtpSent(otp.success !== false);
      setDeletionCode('');
    }
  };

  const handleDelete = async () => {
    setDeletionStep('processing');
    clearError();

    // 🛡️ SEC-1: el backend exige reautenticación. Enviamos contraseña (cuentas con
    // password) u OTP step-up (verificationToken + code) para cuentas OAuth.
    const request: any = {};
    if (deletionReason.trim()) request.reason = deletionReason.trim();
    if (deletionUsesOtp) {
      request.verificationToken = deletionToken;
      request.code = deletionCode.trim();
    } else {
      request.password = deletionPassword;
    }

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
    setDeletionPassword('');
    setDeletionUsesOtp(null);
    setDeletionToken('');
    setDeletionCode('');
    setOtpSent(false);
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
        <div className="space-y-6">
          {/* ── Foto de perfil ── */}
          <div className="flex items-center gap-4">
            {/* 🖼️ Avatar: foto si existe, si no iniciales (registro por email sin foto) */}
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Foto de perfil"
                className="h-16 w-16 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span
                aria-hidden
                className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-semibold"
              >
                {avatarInitials || <User className="h-7 w-7" />}
              </span>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
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
              <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-300">
                JPG o PNG, máximo 5 MB.{isExpert ? ' Es también tu foto pública como experto.' : ''}
              </p>
            </div>
          </div>

          {/* 🖼️ Recorte de la foto antes de subir (reutiliza el flujo del experto) */}
          <ProfilePhotoCropModal
            open={cropOpen}
            onOpenChange={setCropOpen}
            file={cropFile}
            onConfirm={handleAvatarCropped}
          />

          <Separator />

          {/* ── Datos de la cuenta ── */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="account-name">Nombre</Label>
              <input
                id="account-name"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={100}
                disabled={isSavingName}
                placeholder="Tu nombre"
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-gray-600 dark:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-email">Email</Label>
              <input
                id="account-email"
                type="email"
                value={user?.email || ''}
                readOnly
                className="flex h-10 w-full cursor-not-allowed rounded-xl border border-input bg-muted/40 px-3 py-2 text-sm text-muted-foreground ring-offset-background focus-visible:outline-none"
              />
              <p className="text-xs text-gray-600 dark:text-gray-300">El email no se puede cambiar.</p>
            </div>
          </div>

          {/* Botón único de guardado al pie del formulario */}
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              disabled={isSavingName || !nameChanged || !trimmedName}
              onClick={handleSaveName}
            >
              {isSavingName ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-5">
          {showMFASetup ? (
            <MFASetup 
              onComplete={handleMFASetupComplete} 
              onCancel={() => setShowMFASetup(false)} 
            />
          ) : (
            <>
              <div className="space-y-5">
                <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <div>
                      <h4 className="text-sm font-medium">Cambiar Contraseña</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Actualiza tu contraseña para mantener tu cuenta segura</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Cambiar
                  </Button>
                </div>

                {/* MFA Section */}
                <div className="p-4 border border-border rounded-xl space-y-5">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <h4 className="text-sm font-medium">Autenticación de Dos Factores (MFA)</h4>
                  </div>

                  {loadingMFAStatus ? (
                    <p className="text-sm text-gray-600 dark:text-gray-300">Cargando estado de MFA...</p>
                  ) : mfaStatus?.isEnabled ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">MFA Habilitado</span>
                      </div>
                      {mfaStatus.enabledAt && (
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          Habilitado el: {new Date(mfaStatus.enabledAt).toLocaleDateString('es-ES')}
                        </p>
                      )}
                      {mfaStatus.lastVerifiedAt && (
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          Última verificación: {new Date(mfaStatus.lastVerifiedAt).toLocaleDateString('es-ES')}
                        </p>
                      )}
                      {mfaStatus.remainingRecoveryCodes !== undefined && (
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          Códigos de recuperación restantes: {mfaStatus.remainingRecoveryCodes}
                        </p>
                      )}
                      {mfaStatus.remainingRecoveryCodes !== undefined && mfaStatus.remainingRecoveryCodes <= 3 && (
                        <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-600 dark:text-yellow-400">
                          ⚠️ Quedan pocos códigos de recuperación. Considera regenerarlos.
                        </div>
                      )}
                      <Button
                        onClick={() => setShowDisableMFA(true)}
                        variant="destructive"
                        size="sm"
                        className="h-10"
                      >
                        Deshabilitar MFA
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <X className="w-4 h-4" />
                        <span className="text-sm">MFA No habilitado</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
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
        <div className="space-y-5">
          {isLoadingSettings ? (
            <SileoLoader size="sm" message="Cargando preferencias…" color="muted" />
          ) : (
            <div className="space-y-2">
              {/* Email */}
              <label className="flex items-center justify-between gap-3 p-4 border border-border rounded-xl cursor-pointer active:bg-muted/40 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <Mail className="w-5 h-5 text-gray-600 dark:text-gray-300 shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-sm font-medium">Notificaciones por Email</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Recibe avisos por correo electrónico</p>
                  </div>
                </div>
                <span className="relative inline-flex items-center shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={!!settings?.isEmailEnabled}
                    disabled={isUpdatingSettings}
                    onChange={() => toggleEmail()}
                  />
                  <span className="w-11 h-6 bg-muted peer-focus-visible:ring-2 peer-focus-visible:ring-red-500 peer-focus-visible:ring-offset-2 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:bg-primary peer-disabled:opacity-50"></span>
                </span>
              </label>

              {/* WhatsApp */}
              <label className="flex items-center justify-between gap-3 p-4 border border-border rounded-xl cursor-pointer active:bg-muted/40 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-300 shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-sm font-medium">Notificaciones por WhatsApp</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Recibe avisos importantes por WhatsApp</p>
                  </div>
                </div>
                <span className="relative inline-flex items-center shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={!!settings?.isWhatsAppEnabled}
                    disabled={isUpdatingSettings}
                    onChange={() => toggleWhatsApp()}
                  />
                  <span className="w-11 h-6 bg-muted peer-focus-visible:ring-2 peer-focus-visible:ring-red-500 peer-focus-visible:ring-offset-2 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:bg-primary peer-disabled:opacity-50"></span>
                </span>
              </label>
            </div>
          )}
        </div>
      )}

      {/* Privacy Tab */}
      {activeTab === 'privacy' && (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 p-4 border border-border rounded-xl sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-gray-600 dark:text-gray-300 shrink-0" />
              <div>
                <h4 className="text-sm font-medium">Visibilidad del Perfil</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">Controla quién puede ver tu perfil</p>
              </div>
            </div>
            <select className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 sm:h-10 sm:w-[150px]">
              <option>Público</option>
              <option>Privado</option>
              <option>Solo Amigos</option>
            </select>
          </div>
        </div>
      )}

      {/* 🛡️ Round 28 MUD-F: Tab Mudarme (solo expertos) */}
      {activeTab === 'relocate' && isExpert && (
        <div className="space-y-5">
          <div className="p-6 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                  <Plane className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-base font-semibold text-blue-900 dark:text-blue-100">¿Te has mudado a otro país?</h4>
                <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                  Stripe Connect no permite cambiar el país de tu cuenta de cobros. Si te has mudado, este asistente cierra tu cuenta Stripe actual y te prepara para hacer un onboarding nuevo en tu país de residencia.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 border border-border rounded-xl p-4">
            <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Qué pasa al ejecutar el asistente
            </h5>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1.5 pl-5 list-disc">
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

          <p className="text-xs text-gray-600 dark:text-gray-300 text-center">
            Esta acción cierra tu cuenta Stripe Connect actual. La acción es irreversible.
          </p>
        </div>
      )}

      {/* Delete Account Tab */}
      {activeTab === 'delete' && (
        <div className="space-y-5">
          {/* Step 1: Checking Status */}
          {deletionStep === 'check' && (
            <div className="py-10">
              <SileoLoader size="lg" layout="center" message="Verificando estado de tu cuenta…" color="muted" />
            </div>
          )}

          {/* Step 2: Confirmation */}
          {deletionStep === 'confirm' && deletionStatus && (
            <div className="space-y-6">
              {/* Intro: sin caja, tono sobrio */}
              <div className="flex flex-col items-center gap-3 pt-1 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                  <Trash2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Eliminar cuenta permanentemente</h3>
                  <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    Esta acción elimina o anonimiza tu cuenta y tus datos personales de forma irreversible.
                  </p>
                </div>
              </div>

              {/* Contrataciones activas: aviso sobrio + lista compacta (sin caja de color) */}
              {deletionStatus.hasActiveContracts && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-500" />
                    Tienes {deletionStatus.activeContractsCount} contratación(es) activa(s)
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Si alguna tiene un pago en curso, no podrás eliminar la cuenta hasta que se complete o se cancele.
                    El dinero se liquida automáticamente (al experto, reembolso al cliente o anulación); no se abren
                    disputas.
                  </p>
                  {deletionStatus.activeContracts.length > 0 && (
                    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                      {deletionStatus.activeContracts.map((contract) => (
                        <ActiveContractCard key={contract.searchHireId} contract={contract} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Error Display */}
              {deletionError && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
                    <p className="text-sm text-destructive">{deletionError}</p>
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
                  className="w-full px-4 py-3 border border-input rounded-xl bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                  rows={3}
                />
              </div>


              {/* 🛡️ SEC-1: reautenticación obligatoria */}
              {deletionUsesOtp === null && (
                <div className="space-y-2">
                  <Label>Verificación de seguridad</Label>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Para confirmar debes verificar tu identidad. Si accedes con Google, te enviaremos un código de un
                    solo uso a tu correo al pulsar el botón.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={requestDeletionReauth}
                    disabled={deletionLoading}
                    className="w-full sm:w-auto"
                  >
                    {deletionLoading ? 'Comprobando…' : 'Verificar identidad'}
                  </Button>
                </div>
              )}

              {deletionUsesOtp === false && (
                <div>
                  <Label>Confirma tu contraseña para continuar</Label>
                  <input
                    type="password"
                    value={deletionPassword}
                    onChange={(e) => setDeletionPassword(e.target.value)}
                    placeholder="Tu contraseña"
                    autoComplete="current-password"
                    className="w-full px-4 py-3 border border-input rounded-xl bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                  />
                </div>
              )}

              {deletionUsesOtp === true && (
                <div>
                  <Label>Introduce el código de verificación</Label>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 mb-2">
                    {otpSent
                      ? 'Te hemos enviado un código de 6 dígitos a tu correo electrónico. Caduca en 10 minutos.'
                      : 'No pudimos enviar el código. Pulsa "Reenviar código" para intentarlo de nuevo.'}
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={deletionCode}
                    onChange={(e) => setDeletionCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    autoComplete="one-time-code"
                    className="w-full p-3 border border-input rounded-xl bg-background text-sm tracking-widest text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                  />
                  <button
                    type="button"
                    onClick={resendDeletionOtp}
                    disabled={deletionLoading}
                    className="mt-2 text-xs text-primary hover:underline disabled:opacity-50"
                  >
                    Reenviar código
                  </button>
                </div>
              )}

              {/* Nota legal de retención (letra pequeña, secundaria) */}
              <p className="text-xs leading-relaxed text-muted-foreground/80">
                Por obligación legal, las facturas y pagos se conservan anonimizados hasta 6 años; no se eliminan de
                inmediato.
              </p>

              {/* Action buttons */}
              <div className="flex gap-3 border-t border-border pt-4">
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
                  disabled={
                    deletionLoading ||
                    deletionUsesOtp === null ||
                    (deletionUsesOtp
                      ? deletionCode.trim().length < 6
                      : deletionPassword.trim().length === 0)
                  }
                  className="flex-1"
                >
                  {deletionLoading ? 'Eliminando…' : 'Eliminar Cuenta'}
                </Button>
                      </div>
                    </div>
          )}

          {/* Step 3: Processing */}
          {deletionStep === 'processing' && (
            <div className="py-10">
              <SileoLoader size="lg" layout="center" message="Eliminando tu cuenta…" color="muted" />
            </div>
          )}

          {/* Step 4: Result */}
          {deletionStep === 'result' && deletionResult && (
            <div className="space-y-4">
              <div className="py-2 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
                  <CheckCircle className="h-7 w-7 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Cuenta eliminada</h3>
                {deletionResult.message && (
                  <p className="mt-1 text-sm text-muted-foreground">{deletionResult.message}</p>
                )}
              </div>

              {/* Contrataciones cerradas: reparto directo de dinero, NO disputas. */}
              {deletionResult.disputesCreated && deletionResult.disputesCreated.length > 0 && (
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <h4 className="mb-2 text-sm font-semibold text-foreground">
                    Contrataciones cerradas ({deletionResult.disputesCreated.length})
                  </h4>
                  <ul className="space-y-1.5">
                    {deletionResult.disputesCreated.map((item: any) => (
                      <li key={item.searchHireId} className="text-sm text-muted-foreground">
                        {item.reason}
                        {item.affectedPartyName ? ` · ${item.affectedPartyName}` : ''}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    El dinero se liquidó automáticamente (transferencia al experto o reembolso al cliente, según el
                    caso). No se abrieron disputas.
                  </p>
                </div>
              )}

              <Button onClick={handleDeleteSuccess} className="w-full">
                Continuar
              </Button>
            </div>
          )}

          {/* Initial state */}
          {deletionStep === 'initial' && (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Eliminar cuenta permanentemente</h3>
                <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Elimina o anonimiza tu cuenta y todos tus datos de forma irreversible. Si tienes contrataciones con
                  pagos en curso, tendrás que esperar a que se completen o se cancelen antes de poder eliminarla.
                </p>
              </div>

              <Button
                variant="destructive"
                onClick={() => {
                  setDeletionStep('check');
                  checkStatus();
                }}
                className="w-full sm:w-auto"
              >
                Iniciar eliminación
              </Button>
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

  // ✅ Al cerrar el drawer principal, volver al índice de secciones (vista lista)
  React.useEffect(() => {
    if (!isOpen) {
      setMobileView('list');
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

      // Volver a la vista lista para la próxima apertura
      setMobileView('list');

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

  // 📱 Selección de sección en móvil: fija el tab y pasa a la vista detalle.
  const handleSelectTab = React.useCallback((tab: TabType) => {
    setActiveTab(tab);
    setMobileView('detail');
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
                    <span className="text-sm text-gray-600 dark:text-gray-300">Configuración</span>
                    <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
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

        {/* 🔐 Modal para deshabilitar MFA (dialog en desktop). */}
        <DisableMFAModal
          isOpen={showDisableMFA}
          onClose={() => setShowDisableMFA(false)}
          onSuccess={handleDisableMFASuccess}
        />
      </>
    );
  }

  // ✅ Solo renderizar el Drawer móvil si está abierto para evitar overlays huérfanos
  if (!isOpen) {
    return null;
  }

  const activeTabMeta = tabs.find(t => t.id === activeTab);

  return (
    <>
      <Drawer open={isOpen} onOpenChange={handleDrawerOpenChange}>
        <DrawerContent className="max-h-[92vh] bg-background">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Configuración de Cuenta</DrawerTitle>
            <DrawerDescription>Gestiona tu perfil, seguridad, notificaciones y privacidad</DrawerDescription>
          </DrawerHeader>
          <div className="mx-auto flex w-full max-w-lg flex-col max-h-[92vh]">
            {mobileView === 'list' ? (
              /* ── Vista índice: lista de secciones (estilo ajustes nativo) ── */
              <>
                <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
                  <h2 className="text-lg font-semibold">Configuración</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    aria-label="Cerrar"
                    onClick={() => handleDrawerOpenChange(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <nav className="overflow-y-auto px-4 pb-6">
                  {/* Usuario → atajo al perfil (fila plana, sin caja) */}
                  <button
                    type="button"
                    onClick={() => handleSelectTab('profile')}
                    className="flex w-full items-center gap-3 border-b border-border py-4 text-left transition-colors active:bg-muted/40"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span aria-hidden className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-gray-600 dark:text-gray-300">
                        {avatarInitials || <User className="h-5 w-5" />}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium leading-tight">{user?.name || 'Usuario'}</p>
                      <p className="truncate text-xs text-gray-600 dark:text-gray-300">{user?.email || ''}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-600 dark:text-gray-300/50" />
                  </button>

                  {/* Lista de secciones: iconos desnudos + separadores hairline */}
                  <div>
                    {tabs.map((tab, i) => {
                      const Icon = tab.icon;
                      const next = tabs[i + 1];
                      const showDivider = !!next && next.id !== 'delete';
                      return (
                        <React.Fragment key={tab.id}>
                          {tab.id === 'delete' && <div className="h-3" />}
                          <button
                            type="button"
                            onClick={() => handleSelectTab(tab.id)}
                            className={`flex w-full items-center gap-3.5 py-3.5 text-left transition-colors active:bg-muted/40 ${
                              tab.destructive ? 'text-red-600 dark:text-red-400 dark:text-red-400' : ''
                            } ${showDivider ? 'border-b border-border/60' : ''}`}
                          >
                            <Icon
                              className={`h-[18px] w-[18px] shrink-0 ${tab.destructive ? '' : 'text-gray-600 dark:text-gray-300'}`}
                              strokeWidth={1.75}
                            />
                            <span className="flex-1 text-[15px]">{tab.label}</span>
                            <ChevronRight className="h-4 w-4 shrink-0 text-gray-600 dark:text-gray-300/40" />
                          </button>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </nav>
              </>
            ) : (
              /* ── Vista detalle: contenido del tab activo con botón atrás ── */
              <>
                <div className="flex h-14 shrink-0 items-center gap-1 border-b border-border px-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    aria-label="Volver"
                    onClick={() => setMobileView('list')}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <span className={`flex-1 truncate text-base font-semibold ${activeTabMeta?.destructive ? 'text-red-600 dark:text-red-400 dark:text-red-400' : ''}`}>
                    {activeTabMeta?.label}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    aria-label="Cerrar"
                    onClick={() => handleDrawerOpenChange(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="overflow-y-auto overscroll-contain p-4">
                  {renderContent()}
                </div>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* 🔐 Modal para deshabilitar MFA (drawer en móvil, dialog en desktop). Se
          renderiza fuera del drawer principal pero monta su propio portal. */}
      <DisableMFAModal
        isOpen={showDisableMFA}
        onClose={() => setShowDisableMFA(false)}
        onSuccess={handleDisableMFASuccess}
      />

      {/* 🛡️ Round 28 MUD-U: wizard NO se monta aquí — ExpertPanelPage lo monta y
          escucha el evento global 'openExpertRelocationWizard' (necesario porque este
          modal aplica inert al wizard portal cuando está abierto). */}
    </>
  );
};

// Componente para mostrar información de contratación activa
// Los StatusValue del backend son identificadores de máquina; aquí los mostramos legibles.
const CONTRACT_STATUS_LABELS: Record<string, string> = {
  pending: 'Reserva pendiente',
  awaiting_client_decision: 'Esperando tu decisión',
};

const ActiveContractCard: React.FC<{ contract: ActiveContract }> = ({ contract }) => {
  const statusLabel = CONTRACT_STATUS_LABELS[contract.status] ?? 'En curso';
  const amount = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    // 🛡️ Round 28 — Sprint 3: el backend emite Currency en ActiveContractInfo.
    currency: ((contract.currency || (contract as any).chargeCurrency || 'EUR') as string).toUpperCase(),
  }).format(contract.amount);

  const appointmentDate =
    contract.hasAppointment && contract.appointmentDate
      ? new Date(contract.appointmentDate).toLocaleDateString('es-ES')
      : null;

  // Fila compacta: el contenedor padre aporta el borde y los divisores.
  return (
    <div className="flex items-start justify-between gap-3 p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{contract.serviceName}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {contract.otherPartyName}
          {appointmentDate ? ` · ${appointmentDate}` : ''}
        </p>
      </div>
      <div className="flex flex-shrink-0 flex-col items-end">
        <span className="text-sm font-semibold text-foreground">{amount}</span>
        <span className="mt-0.5 text-[11px] text-muted-foreground">{statusLabel}</span>
      </div>
    </div>
  );
};

































