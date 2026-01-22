import * as React from "react";
import { Drawer, DrawerContent } from "./drawer";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

interface CustomBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export const CustomBottomSheet: React.FC<CustomBottomSheetProps> = ({
  open,
  onOpenChange,
  children,
  title,
  className,
}) => {
  const [activeSnapPoint, setActiveSnapPoint] = React.useState<number | string | null>(0.7);
  const drawerContentRef = React.useRef<HTMLDivElement>(null);
  const lastYRef = React.useRef<number | null>(null);
  const isDraggingRef = React.useRef(false);
  
  // Snap points: 0.7 = reposo (70%), 0.85 = casi arriba (deja espacio para el header)
  const snapPoints: (number | string)[] = [0.7, 0.85];
  
  // ✅ Detectar movimiento del drawer para cambiar snap point más rápido
  React.useEffect(() => {
    if (!open) return;
    
    let cleanup: (() => void) | null = null;
    
    // ✅ Esperar a que el drawer se monte completamente
    const timeoutId = setTimeout(() => {
      const drawerElement = drawerContentRef.current;
      if (!drawerElement) return;
      
      const viewportHeight = window.innerHeight;
      const threshold = viewportHeight * 0.03; // ✅ 3% de la pantalla = umbral ultra sensible
      
      const handleTouchStart = (e: TouchEvent) => {
        isDraggingRef.current = true;
        lastYRef.current = e.touches[0].clientY;
      };
      
      const handleTouchMove = (e: TouchEvent) => {
        if (!isDraggingRef.current || lastYRef.current === null) return;
        
        const currentY = e.touches[0].clientY;
        const deltaY = lastYRef.current - currentY; // Positivo = arrastra arriba, negativo = abajo
        
        // ✅ Si el movimiento es significativo (más de 3% de la pantalla), cambiar snap point
        if (Math.abs(deltaY) > threshold) {
          const currentIndex = snapPoints.findIndex(sp => sp === activeSnapPoint);
          
          if (deltaY > 0 && currentIndex < snapPoints.length - 1) {
            // ✅ Arrastra hacia arriba → siguiente snap point
            setActiveSnapPoint(snapPoints[currentIndex + 1]);
            lastYRef.current = currentY; // Reset para evitar cambios múltiples
          } else if (deltaY < 0 && currentIndex > 0) {
            // ✅ Arrastra hacia abajo → snap point anterior
            setActiveSnapPoint(snapPoints[currentIndex - 1]);
            lastYRef.current = currentY; // Reset para evitar cambios múltiples
          }
        }
      };
      
      const handleTouchEnd = () => {
        isDraggingRef.current = false;
        lastYRef.current = null;
      };
      
      // ✅ También detectar mouse para desktop
      const handleMouseDown = (e: MouseEvent) => {
        isDraggingRef.current = true;
        lastYRef.current = e.clientY;
      };
      
      const handleMouseMove = (e: MouseEvent) => {
        if (!isDraggingRef.current || lastYRef.current === null) return;
        
        const currentY = e.clientY;
        const deltaY = lastYRef.current - currentY;
        
        if (Math.abs(deltaY) > threshold) {
          const currentIndex = snapPoints.findIndex(sp => sp === activeSnapPoint);
          
          if (deltaY > 0 && currentIndex < snapPoints.length - 1) {
            setActiveSnapPoint(snapPoints[currentIndex + 1]);
            lastYRef.current = currentY;
          } else if (deltaY < 0 && currentIndex > 0) {
            setActiveSnapPoint(snapPoints[currentIndex - 1]);
            lastYRef.current = currentY;
          }
        }
      };
      
      const handleMouseUp = () => {
        isDraggingRef.current = false;
        lastYRef.current = null;
      };
      
      drawerElement.addEventListener('touchstart', handleTouchStart, { passive: true });
      drawerElement.addEventListener('touchmove', handleTouchMove, { passive: true });
      drawerElement.addEventListener('touchend', handleTouchEnd, { passive: true });
      drawerElement.addEventListener('mousedown', handleMouseDown);
      drawerElement.addEventListener('mousemove', handleMouseMove);
      drawerElement.addEventListener('mouseup', handleMouseUp);
      drawerElement.addEventListener('mouseleave', handleMouseUp);
      
      cleanup = () => {
        drawerElement.removeEventListener('touchstart', handleTouchStart);
        drawerElement.removeEventListener('touchmove', handleTouchMove);
        drawerElement.removeEventListener('touchend', handleTouchEnd);
        drawerElement.removeEventListener('mousedown', handleMouseDown);
        drawerElement.removeEventListener('mousemove', handleMouseMove);
        drawerElement.removeEventListener('mouseup', handleMouseUp);
        drawerElement.removeEventListener('mouseleave', handleMouseUp);
      };
    }, 100); // ✅ Pequeño delay para asegurar que el drawer esté montado
    
    return () => {
      clearTimeout(timeoutId);
      if (cleanup) cleanup();
    };
  }, [open, activeSnapPoint, snapPoints]);

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={snapPoints}
      activeSnapPoint={activeSnapPoint}
      setActiveSnapPoint={setActiveSnapPoint}
      modal={false} // ✅ Sin overlay para permitir interacción con el mapa
      dismissible={true}
      snapToSequentialPoint={true}
      shouldScaleBackground={false} // ✅ Sin escalado del fondo
      {...({} as any)} // ✅ Type assertion para children (DrawerPrimitive.Root acepta children en runtime)
    >
      <DrawerContent
        ref={drawerContentRef}
        className={cn(
          "rounded-t-[20px] w-full !max-w-full shadow-[0_-8px_32px_rgba(0,0,0,0.15)] border-0 bg-white",
          "focus:outline-none focus-visible:outline-none",
          className
        )}
        style={{
          width: '100%',
          maxWidth: '100%',
          maxHeight: '100vh',
          zIndex: 9998, // ✅ Menor que el header (z-[9999]) para que no tape los botones
          willChange: 'transform',
        }}
        noOverlay={true} // ✅ Sin overlay
        noHandle={false} // ✅ Mostrar handle para drag
        title={title}
      >
        {/* Header con título y botón cerrar */}
        {title && (
          <div className="flex-shrink-0 px-6 py-1.5 flex items-center justify-between border-b border-gray-100">
            <div className="flex-1" />
            <div className="flex flex-col items-center flex-1">
              <h2
                style={{
                  fontFamily: '"Airbnb Cereal VF", Circular, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
                  fontSize: '15px',
                  fontWeight: 500,
                  lineHeight: '19px',
                  color: 'rgb(34, 34, 34)',
                  margin: 0,
                  padding: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {title}
              </h2>
            </div>
            <div className="flex-1 flex justify-end">
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 -mr-2 text-gray-600 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100 flex-shrink-0"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Contenido scrolleable */}
        <div
          className="flex-1 overflow-y-auto bg-white px-0"
          style={{
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
          onTouchStart={(e) => {
            // Prevenir que el mapa se mueva cuando se toca el drawer
            e.stopPropagation();
          }}
        >
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
