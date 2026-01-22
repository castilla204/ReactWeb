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
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const lastScrollTopRef = React.useRef(0);
  const scrollThresholdRef = React.useRef(0);
  
  // Snap points: 0.7 = reposo (70%), 0.95 = casi arriba
  const snapPoints: (number | string)[] = [0.7, 0.95];
  
  // ✅ Detectar scroll y cambiar snap point suavemente con umbral reducido
  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !open) return;
    
    let rafId: number | null = null;
    
    const handleScroll = () => {
      if (rafId !== null) return; // Evitar múltiples llamadas
      
      rafId = requestAnimationFrame(() => {
        const scrollTop = container.scrollTop;
        const scrollDelta = scrollTop - lastScrollTopRef.current;
        lastScrollTopRef.current = scrollTop;
        
        // ✅ Umbral MUY reducido: solo 20px de scroll acumulado para cambiar snap point
        const threshold = 20;
        scrollThresholdRef.current += scrollDelta;
        
        // ✅ Si el usuario hace scroll hacia arriba (positivo) y supera el umbral
        if (scrollThresholdRef.current > threshold && activeSnapPoint !== 0.95) {
          setActiveSnapPoint(0.95); // Ir al snap point superior
          scrollThresholdRef.current = 0; // Resetear contador
        }
        // ✅ Si el usuario hace scroll hacia abajo (negativo) y está en el top
        else if (scrollTop <= 5 && scrollThresholdRef.current < -threshold && activeSnapPoint !== 0.7) {
          setActiveSnapPoint(0.7); // Volver al snap point de reposo
          scrollThresholdRef.current = 0; // Resetear contador
        }
        // ✅ Si está en el top y hace scroll hacia abajo, acumular para cerrar
        else if (scrollTop <= 5 && scrollDelta < 0) {
          // Mantener el acumulador negativo para detectar cuando supere el umbral
        }
        // ✅ Si hace scroll hacia arriba pero no está en el top, resetear acumulador negativo
        else if (scrollTop > 5 && scrollDelta > 0) {
          scrollThresholdRef.current = Math.max(0, scrollThresholdRef.current);
        }
        
        rafId = null;
      });
    };
    
    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [activeSnapPoint, open]);
  
  // ✅ Resetear contador cuando cambia el snap point o se abre/cierra
  React.useEffect(() => {
    scrollThresholdRef.current = 0;
    if (scrollContainerRef.current) {
      lastScrollTopRef.current = scrollContainerRef.current.scrollTop;
    }
  }, [activeSnapPoint, open]);

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
        className={cn(
          "rounded-t-[20px] w-full !max-w-full shadow-[0_-8px_32px_rgba(0,0,0,0.15)] border-0 bg-white",
          "focus:outline-none focus-visible:outline-none",
          className
        )}
        style={{
          width: '100%',
          maxWidth: '100%',
          maxHeight: '100vh',
          zIndex: 10000,
          willChange: 'transform',
        }}
        noOverlay={true} // ✅ Sin overlay
        noHandle={true} // ✅ Ocultar handle
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
          ref={scrollContainerRef}
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
