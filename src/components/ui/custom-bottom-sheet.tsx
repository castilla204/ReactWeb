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
  const calculatedInitialHeight = initialHeight || viewportHeight * 0.7; // 70% por defecto (estado de reposo más alto)
  const calculatedMaxHeight = maxHeight || viewportHeight - headerHeight; // 100vh menos header
  
  // Motion values
  const sheetHeight = useMotionValue(calculatedInitialHeight);
  const y = useMotionValue(0);
  
  // Scroll tracking del contenido
  const { scrollY } = useScroll({ container: contentRef });
  
  // Transformar scroll a altura adicional (expansión proporcional)
  // Cuando scrollY va de 0 a 300px, la altura adicional va de 0 a (maxHeight - initialHeight)
  const scrollRange = 300; // Rango de scroll para expansión completa
  const heightRange = calculatedMaxHeight - calculatedInitialHeight;
  
  // Vincular scroll a altura - expansión proporcional
  const expandedHeight = useTransform(
    scrollY,
    [0, scrollRange],
    [calculatedInitialHeight, calculatedMaxHeight],
    { clamp: true }
  );
  
  // Snap points
  const snapPoints = [
    0, // cerrado
    calculatedInitialHeight, // reposo (50%)
    calculatedMaxHeight, // máximo
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
    
    // Si la velocidad es alta, cerrar o abrir completamente
    if (Math.abs(velocity) > 500) {
      if (velocity > 0) {
        // Arrastrando hacia abajo - cerrar
        sheetHeight.set(0);
        y.set(0);
        onOpenChange(false);
        return;
      } else {
        // Arrastrando hacia arriba - abrir al máximo
        sheetHeight.set(calculatedMaxHeight);
        y.set(0);
        return;
      }
    }
    
    // Snap al punto más cercano
    const closestSnap = getClosestSnapPoint(currentY, currentHeight);
    sheetHeight.set(closestSnap);
    y.set(0);
    
    // Si está en 0, cerrar
    if (closestSnap === 0) {
      onOpenChange(false);
    }
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
        dragConstraints={{ top: -(calculatedMaxHeight - calculatedInitialHeight), bottom: calculatedInitialHeight }}
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
          }}
        >
          {children}
        </motion.div>
      </motion.div>
    </>
  );
};
