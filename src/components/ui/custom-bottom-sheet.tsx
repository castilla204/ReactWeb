import * as React from "react";
import { motion, useScroll, useTransform, useMotionValue, useDragControls, PanInfo } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

interface CustomBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  headerHeight?: number;
  initialHeight?: number; // Altura inicial en píxeles (50% de pantalla)
  maxHeight?: number; // Altura máxima en píxeles (100vh)
}

export const CustomBottomSheet: React.FC<CustomBottomSheetProps> = ({
  open,
  onOpenChange,
  children,
  title,
  className,
  style,
  headerHeight = 81,
  initialHeight,
  maxHeight,
}) => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  
  // Calcular alturas basadas en viewport
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const calculatedInitialHeight = initialHeight || viewportHeight * 0.5; // 50% por defecto (posición más baja)
  const calculatedMaxHeight = maxHeight || viewportHeight - headerHeight; // 100vh menos header
  
  // Motion values
  const sheetHeight = useMotionValue(calculatedInitialHeight);
  const y = useMotionValue(0);
  
  // Scroll tracking del contenido
  const { scrollY } = useScroll({ container: contentRef });
  
  // Vincular scroll a altura - relación 1:1 sin límite
  // Cada píxel de scroll aumenta la altura del drawer en 1 píxel
  const expandedHeight = useTransform(
    scrollY,
    (latest) => calculatedInitialHeight + latest
  );
  
  // Snap points
  const snapPoints = [
    0, // cerrado
    calculatedInitialHeight, // reposo (50%)
  ];
  
  // Calcular snap point más cercano
  const getClosestSnapPoint = (currentY: number, currentHeight: number): number => {
    const currentBottom = viewportHeight - currentHeight + currentY;
    const distances = snapPoints.map(snap => Math.abs(viewportHeight - snap - currentBottom));
    const minDistance = Math.min(...distances);
    const closestIndex = distances.indexOf(minDistance);
    return snapPoints[closestIndex];
  };
  
  // Manejar drag end
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const currentHeight = sheetHeight.get();
    const currentY = y.get();
    const velocity = info.velocity.y;
    
    // Si la velocidad es alta hacia abajo, cerrar
    if (velocity > 500) {
      // Arrastrando hacia abajo - cerrar
      sheetHeight.set(0);
      y.set(0);
      onOpenChange(false);
      return;
    }
    
    // Si la altura actual es menor que la inicial, hacer snap a la inicial
    if (currentHeight < calculatedInitialHeight) {
      sheetHeight.set(calculatedInitialHeight);
      y.set(0);
      return;
    }
    
    // Mantener la altura actual (sin snap, permite altura ilimitada)
    y.set(0);
  };
  
  // Sincronizar altura con scroll cuando hay scroll - usar useTransform directamente
  React.useEffect(() => {
    if (!open) return;
    
    const unsubscribe = expandedHeight.on("change", (latest) => {
      sheetHeight.set(latest);
    });
    
    return () => unsubscribe();
  }, [open, expandedHeight, sheetHeight]);
  
  // Reset cuando se cierra
  React.useEffect(() => {
    if (!open) {
      sheetHeight.set(calculatedInitialHeight);
      y.set(0);
    }
  }, [open, calculatedInitialHeight, sheetHeight, y]);
  
  if (!open) return null;
  
  return (
    <>
      {/* Sin overlay - permite interacción con el mapa */}
      
      {/* Bottom Sheet */}
      <motion.div
        ref={sheetRef}
        drag="y"
        dragConstraints={{ top: -Infinity, bottom: calculatedInitialHeight }}
        dragElastic={0.2}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        dragControls={dragControls}
        initial={{ y: calculatedInitialHeight, height: calculatedInitialHeight }}
        animate={{ 
          height: expandedHeight,
          y: y,
        }}
        style={{
          ...style,
          willChange: 'transform, height',
          touchAction: 'none', // Prevenir interacción con el mapa cuando se arrastra el drawer
        }}
        transition={{
          type: "spring",
          damping: 30,
          stiffness: 300,
        }}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[10000] bg-white rounded-t-[20px] shadow-[0_-8px_32px_rgba(0,0,0,0.15)]",
          "flex flex-col",
          className
        )}
        onTouchStart={(e) => {
          // Prevenir que el mapa se mueva cuando se toca el drawer
          e.stopPropagation();
        }}
      >
        {/* Handle */}
        <div className="flex-shrink-0 px-6 py-1.5 cursor-grab active:cursor-grabbing touch-none">
          <div className="mx-auto w-12 h-1 bg-gray-300 rounded-full" />
        </div>
        
        {/* Header */}
        {title && (
          <div className="flex-shrink-0 px-6 py-1.5 flex items-center justify-between">
            <div className="flex-1"></div>
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
        
        {/* Contenido con scroll */}
        <motion.div
          ref={contentRef}
          className="flex-1 overflow-y-auto bg-white px-0"
          style={{
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            willChange: 'scroll-position',
            touchAction: 'pan-y', // Solo permitir scroll vertical, prevenir pan del mapa
          }}
          onTouchStart={(e) => {
            // Prevenir que el mapa se mueva cuando se toca el drawer
            e.stopPropagation();
          }}
          onTouchMove={(e) => {
            // Prevenir propagación durante el scroll
            e.stopPropagation();
          }}
          onTouchEnd={(e) => {
            // Prevenir propagación al soltar
            e.stopPropagation();
          }}
          onWheel={(e) => {
            // Prevenir que el scroll del mouse se propague al mapa
            e.stopPropagation();
          }}
        >
          {children}
        </motion.div>
      </motion.div>
    </>
  );
};
