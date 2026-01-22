import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "../../lib/utils"

// Componente simple para ocultar visualmente pero mantener accesibilidad
const VisuallyHidden: React.FC<{ asChild?: boolean; children: React.ReactNode }> = ({ asChild, children }) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: cn("sr-only", (children.props as any)?.className),
    } as any);
  }
  return <span className="sr-only">{children}</span>;
};

interface DrawerProps extends React.ComponentProps<typeof DrawerPrimitive.Root> {
  snapPoints?: (number | string)[];
  activeSnapPoint?: number | string | null;
  setActiveSnapPoint?: (snapPoint: number | string | null) => void;
  dismissible?: boolean;
  fadeFromIndex?: number;
  handleOnly?: boolean;
  snapToSequentialPoint?: boolean;
}

const Drawer = ({
  shouldScaleBackground = true, // ✅ Efecto de escalado del fondo como Airbnb
  snapPoints,
  activeSnapPoint,
  setActiveSnapPoint,
  modal = true,
  dismissible = true,
  fadeFromIndex,
  handleOnly = false,
  snapToSequentialPoint = true, // ✅ true para mejor fluidez y snap points secuenciales
  ...props
}: DrawerProps) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    snapPoints={snapPoints}
    activeSnapPoint={activeSnapPoint}
    setActiveSnapPoint={setActiveSnapPoint}
    modal={modal}
    dismissible={dismissible}
    fadeFromIndex={fadeFromIndex}
    handleOnly={handleOnly}
    snapToSequentialPoint={snapToSequentialPoint}
    {...props}
  />
)
Drawer.displayName = "Drawer"

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerPortal = DrawerPrimitive.Portal

const DrawerClose = DrawerPrimitive.Close

// Handle component optimizado para drag ULTRA FLUIDO - MÁXIMA SENSIBILIDAD
const DrawerHandle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "mx-auto mt-3 mb-3 h-1.5 w-16 flex-shrink-0 rounded-full bg-gray-300 cursor-grab active:cursor-grabbing touch-none transition-opacity duration-200",
      "hover:bg-gray-400 active:bg-gray-500",
      className
    )}
    style={{
      userSelect: 'none',
      WebkitUserSelect: 'none',
      // ✅ Optimizaciones máximas para fluidez
      willChange: 'opacity, transform',
      // ✅ Área táctil MÁS GRANDE para mejor detección (más fácil de arrastrar)
      padding: '12px 0',
      margin: '-12px 0',
      // ✅ Solo drag, no scroll - máxima sensibilidad
      touchAction: 'none',
      // ✅ Aceleración de hardware
      transform: 'translateZ(0)',
      backfaceVisibility: 'hidden',
      ...props.style,
    }}
    {...props}
  />
))
DrawerHandle.displayName = "DrawerHandle"

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, style, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/40", className)}
    style={{ 
      zIndex: 9997, 
      // ✅ Vaul maneja las transiciones del overlay nativamente
      ...style 
    }}
    {...props}
  />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> & {
    title?: string;
    description?: string;
    noOverlay?: boolean;
    noHandle?: boolean;
  }
>(({ className, children, title, description, noOverlay, noHandle, ...props }, ref) => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  
  // Verificar si los children ya incluyen DrawerTitle o DrawerDescription
  const hasTitle = React.Children.toArray(children).some((child: any) => 
    child?.type?.displayName === DrawerPrimitive.Title.displayName || 
    child?.props?.children?.type?.displayName === DrawerPrimitive.Title.displayName
  );
  const hasDescription = React.Children.toArray(children).some((child: any) => 
    child?.type?.displayName === DrawerPrimitive.Description.displayName ||
    child?.props?.children?.type?.displayName === DrawerPrimitive.Description.displayName
  );
  
  // Verificar si se debe mostrar el overlay (por defecto sí, a menos que se especifique noOverlay)
  const showOverlay = !noOverlay;
  
  return (
    <DrawerPortal>
      {showOverlay && <DrawerOverlay />}
      <DrawerPrimitive.Content
        ref={(node) => {
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }
          contentRef.current = node;
        }}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex h-auto flex-col rounded-t-[16px] border-0 bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.12)]",
          "focus:outline-none",
          // Animaciones suaves nativas de vaul
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          className
        )}
        style={{
          ...props.style,
          zIndex: showOverlay ? (props.style?.zIndex || 9998) : (props.style?.zIndex || 10000),
          // ✅ OPTIMIZACIONES MÁXIMAS PARA FLUIDEZ
          willChange: 'transform',
          contain: 'layout style paint',
          // ✅ Asegurar que Vaul controle completamente el transform durante el drag
          transition: 'none', // Vaul maneja las transiciones internamente
          // ✅ Mejorar fluidez del drag con aceleración de hardware
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          // ✅ Permitir drag vertical sin interferencias
          touchAction: 'pan-y',
        }}
        {...props}
      >
        {/* ✅ Accesibilidad: Agregar DrawerTitle y DrawerDescription si no están presentes */}
        {!hasTitle && (
          <VisuallyHidden asChild>
            <DrawerPrimitive.Title>
              {title || "Drawer"}
            </DrawerPrimitive.Title>
          </VisuallyHidden>
        )}
        {!hasDescription && (
          <VisuallyHidden asChild>
            <DrawerPrimitive.Description>
              {description || "Drawer content"}
            </DrawerPrimitive.Description>
          </VisuallyHidden>
        )}
        {/* Handle nativo de vaul - más fluido */}
        {!noHandle && <DrawerHandle />}
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
})
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
    {...props}
  />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  />
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerHandle,
}
