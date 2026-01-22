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
}: DrawerProps) => {
  // ✅ Añadir estilos CSS específicos SOLO para el drawer (no afectar al mapa)
  React.useEffect(() => {
    const style = document.createElement('style');
    style.id = 'vaul-drawer-sensitivity';
    style.textContent = `
      /* ✅ Asegurar que el mapa de Google Maps NO se vea afectado - PRIORIDAD ALTA */
      .gm-style,
      .gm-style > div,
      [class*="LocationMap"],
      [id*="map"],
      div[style*="map"],
      /* Contenedores del mapa de Google */
      div[role="button"][aria-label*="Map"],
      /* Asegurar que todos los elementos del mapa mantengan touch-action: auto */
      .gm-style * {
        touch-action: auto !important;
        pointer-events: auto !important;
      }
      /* ✅ Aumentar sensibilidad del drag SOLO en el drawer - selectores muy específicos */
      [data-vaul-drawer][class*="rounded-t"] {
        touch-action: pan-y !important;
        -webkit-overflow-scrolling: touch !important;
        /* ✅ Reducir resistencia del drag para mayor sensibilidad */
        -webkit-tap-highlight-color: transparent;
      }
      /* ✅ Mejorar respuesta del handle - solo en drawer */
      [data-vaul-drawer][class*="rounded-t"] [data-vaul-drawer-handle] {
        touch-action: none !important;
        cursor: grab !important;
        /* ✅ Aumentar área táctil del handle */
        padding: 8px 0 !important;
        margin: -8px 0 !important;
      }
      [data-vaul-drawer][class*="rounded-t"] [data-vaul-drawer-handle]:active {
        cursor: grabbing !important;
      }
      /* ✅ Reducir umbral de distancia para cambiar snap point - solo drawer */
      [data-vaul-drawer][class*="rounded-t"] > * {
        will-change: transform !important;
      }
      /* ✅ Asegurar que el contenido scrolleable del drawer no bloquee el mapa */
      [data-vaul-drawer][class*="rounded-t"] > div[class*="overflow-y-auto"] {
        touch-action: pan-y !important;
      }
      /* ✅ ELIMINAR CUALQUIER FONDO GRIS - Asegurar que no haya overlay visible */
      [data-vaul-overlay],
      [data-vaul-overlay-wrapper],
      [class*="vaul-overlay"],
      /* Overlay de vaul */
      [data-radix-portal] > div[class*="bg-black"],
      [data-radix-portal] > div[style*="background"] {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
        background: transparent !important;
      }
      /* ✅ Asegurar que el drawer NO tenga fondo gris */
      [data-vaul-drawer] {
        background: transparent !important;
      }
      [data-vaul-drawer][class*="bg-white"] {
        background: white !important; /* Solo el drawer debe ser blanco */
      }
    `;
    // Solo añadir si no existe
    if (!document.getElementById('vaul-drawer-sensitivity')) {
      document.head.appendChild(style);
    }
    return () => {
      const existingStyle = document.getElementById('vaul-drawer-sensitivity');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);

  return (
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
  );
}
Drawer.displayName = "Drawer"

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerPortal = DrawerPrimitive.Portal

const DrawerClose = DrawerPrimitive.Close

// Handle component optimizado para drag fluido y más sensible
const DrawerHandle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "mx-auto mt-3 mb-3 h-1 w-12 flex-shrink-0 rounded-full bg-gray-300 cursor-grab active:cursor-grabbing touch-none transition-opacity duration-200",
      "hover:bg-gray-400 active:bg-gray-500",
      className
    )}
    style={{
      userSelect: 'none',
      WebkitUserSelect: 'none',
      willChange: 'opacity',
      // ✅ Aumentar área táctil del handle para mayor sensibilidad (manteniendo centrado)
      padding: '12px 0',
      margin: '-12px auto', // ✅ Centrado horizontal con margin auto
      touchAction: 'none', // ✅ Permitir drag sin interferir con scroll
      display: 'block', // ✅ Asegurar que margin auto funcione
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
      {/* ✅ NO renderizar overlay si noOverlay es true */}
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
          // ✅ Vaul maneja las transiciones nativamente - no sobrescribir
          // Mejorar rendimiento de animaciones
          willChange: 'transform',
          contain: 'layout style',
          // ✅ Asegurar que Vaul controle completamente el transform durante el drag
          transition: 'none', // Vaul maneja las transiciones internamente
          // ✅ Aumentar sensibilidad del drag: reducir resistencia táctil
          // Solo pan-y en el drawer, no afecta al mapa que está debajo
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
