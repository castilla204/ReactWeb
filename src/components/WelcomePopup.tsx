import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { X } from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile';

const WELCOME_POPUP_KEY = 'welcome-popup-shown';

export const WelcomePopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [popupImage, setPopupImage] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const hasShownPopup = localStorage.getItem(WELCOME_POPUP_KEY);
    if (hasShownPopup) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    const loadImage = async () => {
      const mod = isMobile
        ? await import('../media/popupmovil.png')
        : await import('../media/popupdesktop.png');
      if (!cancelled) {
        setPopupImage(mod.default);
      }
    };

    void loadImage();
    return () => {
      cancelled = true;
    };
  }, [isOpen, isMobile]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(WELCOME_POPUP_KEY, 'true');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={`p-0 overflow-hidden border-0 shadow-2xl bg-transparent ${
          isMobile ? 'max-w-[85vw] max-h-[80vh]' : 'max-w-[750px] max-h-[85vh]'
        }`}
        style={{
          zIndex: 10000,
          borderRadius: '16px',
          backgroundColor: 'transparent',
        }}
        hideCloseButton
        overlayClassName="bg-black/60 backdrop-blur-sm"
      >
        <div className="relative w-full rounded-2xl overflow-hidden bg-transparent">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 hover:bg-white transition-colors shadow-lg"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
          {popupImage ? (
            <img
              src={popupImage}
              alt="Bienvenido"
              className="w-full h-auto object-contain rounded-2xl"
              style={{
                maxHeight: isMobile ? '80vh' : '85vh',
                display: 'block',
              }}
              decoding="async"
              loading="eager"
            />
          ) : (
            <div
              className="w-full rounded-2xl bg-[#f0f0f0] animate-pulse"
              style={{ minHeight: isMobile ? '50vh' : '60vh' }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
