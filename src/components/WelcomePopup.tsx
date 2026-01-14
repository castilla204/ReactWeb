import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { X } from 'lucide-react';
import { useWindowSize } from '../hooks/useWindowSize';
import popupMovil from '../media/popupmovil.png';
import popupDesktop from '../media/popupdesktop.png';

const WELCOME_POPUP_KEY = 'welcome-popup-shown';

export const WelcomePopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { width } = useWindowSize();
  const isMobile = width < 768;

  useEffect(() => {
    // Verificar si ya se mostró el popup
    const hasShownPopup = localStorage.getItem(WELCOME_POPUP_KEY);
    
    if (!hasShownPopup) {
      // Pequeño delay para que la página cargue primero
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Guardar en localStorage que ya se mostró
    localStorage.setItem(WELCOME_POPUP_KEY, 'true');
  };

  // Determinar qué imagen mostrar
  const popupImage = isMobile ? popupMovil : popupDesktop;

  // Usar Dialog tanto en móvil como en desktop
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className={`p-0 overflow-hidden border-0 shadow-2xl bg-transparent ${
          isMobile 
            ? 'max-w-[85vw] max-h-[80vh]' 
            : 'max-w-[750px] max-h-[85vh]'
        }`}
        style={{ 
          zIndex: 10000,
          borderRadius: '16px',
          backgroundColor: 'transparent',
        }}
        hideCloseButton={true}
        overlayClassName="bg-black/60 backdrop-blur-sm"
      >
        <div className="relative w-full rounded-2xl overflow-hidden bg-transparent">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 hover:bg-white transition-colors shadow-lg"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
          <img
            src={popupImage}
            alt="Bienvenido"
            className="w-full h-auto object-contain rounded-2xl"
            style={{ 
              maxHeight: isMobile ? '80vh' : '85vh',
              display: 'block'
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
