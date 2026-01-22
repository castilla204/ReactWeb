import * as React from "react";
import { motion, useMotionValue, useDragControls, PanInfo } from "framer-motion";
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
  initialHeight?: number;
  maxHeight?: number;
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
  const dragControls = useDragControls();
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Calcular basado en viewport
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const calculatedInitialHeight = initialHeight || viewportHeight * 0.7; // 70% por defecto - NUNCA se cierra

  // Height como motion value - crece infinitamente con el scroll
  const height = useMotionValue(calculatedInitialHeight);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isContentAtTop, setIsContentAtTop] = React.useState(true);

  // ✅ VINCULAR SCROLL CON ALTURA: el drawer crece infinitamente mientras scrolleas
  // El scrollTop es la fuente de verdad - el drawer crece basado en él
  const lastScrollTopRef = React.useRef(0);
  
  React.useEffect(() => {
    if (!contentRef.current || !open) return;

    const handleScroll = () => {
      if (!contentRef.current) return;
      
      const scrollTop = contentRef.current.scrollTop;
      setIsContentAtTop(scrollTop <= 1);

      // ✅ El drawer crece proporcionalmente con el scroll
      // Cada píxel de scroll = 1 píxel más de altura del drawer
      const baseHeight = calculatedInitialHeight;
      const scrollHeight = scrollTop;
      const newHeight = baseHeight + scrollHeight; // ✅ CRECIMIENTO INFINITO

      // ✅ Actualizar altura
      const currentHeight = height.get();
      height.set(newHeight);
      
      // ✅ Si el drawer creció, ajustar el scrollTop para mantener la posición visual
      // Esto asegura que el contenido no se mueva cuando el drawer crece
      const heightDiff = newHeight - currentHeight;
      if (heightDiff > 0 && scrollTop > 0) {
        // El scrollTop ya aumentó (es la causa del crecimiento), pero necesitamos
        // asegurarnos de que la posición visual se mantenga
        // No hacemos nada aquí porque el scrollTop ya es correcto
      }
      
      lastScrollTopRef.current = scrollTop;
    };

    const content = contentRef.current;
    content.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => content.removeEventListener('scroll', handleScroll);
  }, [open, calculatedInitialHeight, height]);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!contentRef.current) return;
    
    const currentH = height.get();
    const scrollTop = contentRef.current.scrollTop;

    // ✅ Si está en el tope del scroll, permitir arrastrar el drawer
    if (isContentAtTop) {
      // Actualizar height: delta.y negativo (drag up) = + height
      const newHeight = currentH - info.delta.y;
      const minHeight = calculatedInitialHeight; // ✅ NUNCA menos que la altura inicial
      height.set(Math.max(minHeight, newHeight)); // ✅ SIN LÍMITE SUPERIOR - CRECIMIENTO INFINITO
      
      // Si el drawer crece, ajustar el scroll para mantener la posición visual
      if (newHeight > currentH) {
        const heightDiff = newHeight - currentH;
        contentRef.current.scrollTop = Math.max(0, scrollTop - heightDiff);
      }
    } else {
      // Si NO está en el tope, el scroll interno maneja el crecimiento
      // No hacer nada - el useEffect del scroll ya maneja el crecimiento
    }
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const currentH = height.get();

    // ✅ NUNCA cerrar completamente - solo volver a altura inicial si está muy bajo
    if (currentH < calculatedInitialHeight * 0.8) {
      height.set(calculatedInitialHeight);
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }
    // Si está por encima de la altura inicial, dejarlo donde está (sin snap)
  };

  // Inicializar/reset
  React.useEffect(() => {
    if (open) {
      height.set(calculatedInitialHeight);
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }
  }, [open, calculatedInitialHeight, height]);

  // ✅ Siempre se puede arrastrar si está en el tope del scroll
  const canDrag = isContentAtTop;

  if (!open) return null;

  return (
    <>
      {/* Sin overlay - permite interacción con el mapa */}

      <motion.div
        ref={containerRef}
        style={{
          ...style,
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height, // ✅ Height dinámica que crece infinitamente con el scroll
          zIndex: 10000,
          touchAction: isDragging ? 'none' : 'auto',
        }}
        animate={{ height: height.get() }}
        transition={{
          type: isDragging ? false : "spring",
          damping: 25,
          stiffness: 400,
        }}
        className={cn(
          "bg-white rounded-t-[20px] shadow-[0_-8px_32px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden",
          className
        )}
        onTouchStart={e => e.stopPropagation()}
      >
        {/* Handle con drag - FIJO, no scrolleable */}
        <motion.div
          className="flex-shrink-0 px-6 py-1.5 cursor-grab active:cursor-grabbing touch-none bg-white"
          onPointerDown={(e) => {
            if (canDrag) dragControls.start(e);
          }}
          drag={canDrag ? "y" : false}
          dragControls={dragControls}
          dragElastic={0}
          dragMomentum={false}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
        >
          <div className="mx-auto w-12 h-1 bg-gray-300 rounded-full" />
        </motion.div>

        {/* Header - FIJO, no scrolleable */}
        {title && (
          <div className="flex-shrink-0 px-6 py-1.5 flex items-center justify-between bg-white">
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

        {/* ✅ Contenido: SOLO el contenido es scrolleable - el scroll hace crecer el drawer infinitamente */}
        <div
          ref={contentRef}
          className="flex-1 bg-white px-0 overflow-y-auto"
          style={{
            // ✅ flex-1 para que ocupe todo el espacio disponible
            // La altura se calcula automáticamente: drawer height - header height
            minHeight: 0, // Importante para que flex-1 funcione correctamente
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            pointerEvents: isDragging ? 'none' : 'auto',
            // ✅ Sin padding-top - el contenido empieza inmediatamente, la primera card se ve completa
            paddingTop: 0,
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
          }}
          onTouchMove={e => e.stopPropagation()}
          onTouchEnd={e => e.stopPropagation()}
          onWheel={e => e.stopPropagation()}
        >
          {children}
        </div>
      </motion.div>
    </>
  );
};