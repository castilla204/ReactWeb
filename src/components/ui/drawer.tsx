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

const Drawer = ({
  shouldScaleBackground = false,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />
)
Drawer.displayName = "Drawer"

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerPortal = DrawerPrimitive.Portal

const DrawerClose = DrawerPrimitive.Close

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, style, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/50", className)}
    style={{ zIndex: 9997, ...style }}
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
  // ✅ BEST PRACTICE: Prevenir warnings de accesibilidad
  // Vaul maneja aria-hidden automáticamente, pero podemos asegurarnos de que
  // cuando el drawer está abierto, los elementos puedan recibir focus correctamente
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
  
  React.useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    
    // Función para verificar y corregir aria-hidden cuando el drawer está abierto
    const checkAriaHidden = () => {
      const content = contentRef.current;
      // Verificar que el elemento existe y está en el DOM antes de manipularlo
      if (!content || !content.parentNode) return;
      
      const isOpen = content.getAttribute('data-state') === 'open';
      
      // Si el drawer está abierto, eliminar aria-hidden de todos los ancestros y del drawer mismo
      if (isOpen) {
        // Eliminar aria-hidden del drawer mismo
        content.removeAttribute('aria-hidden');
        content.removeAttribute('data-aria-hidden');
        
        // Verificar si hay un elemento con foco dentro del drawer
        const focusedElement = document.activeElement;
        if (focusedElement && content.contains(focusedElement)) {
          // Eliminar aria-hidden de todos los ancestros del elemento con foco hasta el drawer
          let parent = focusedElement.parentElement;
          while (parent && parent !== content) {
            // Verificar que el parent existe antes de manipularlo
            if (parent && parent.parentNode) {
              if (parent.getAttribute('aria-hidden') === 'true') {
                parent.removeAttribute('aria-hidden');
              }
              if (parent.getAttribute('data-aria-hidden') === 'true') {
                parent.removeAttribute('data-aria-hidden');
              }
            }
            parent = parent.parentElement;
          }
        }
      }
    };
    
    // Observar cambios en data-state y aria-hidden
    const observer = new MutationObserver(() => {
      checkAriaHidden();
    });
    
    observer.observe(content, {
      attributes: true,
      attributeFilter: ['data-state', 'aria-hidden', 'data-aria-hidden'],
      subtree: true // ✅ Observar también los descendientes
    });
    
    // Verificar inicialmente y periódicamente
    checkAriaHidden();
    const intervalId = setInterval(checkAriaHidden, 100);
    
    // ✅ Escuchar eventos de foco para corregir inmediatamente
    const handleFocusIn = (e: FocusEvent) => {
      const currentContent = contentRef.current;
      const target = e.target as HTMLElement;
      // Verificar que content existe y contiene el target antes de procesar
      if (currentContent && currentContent.parentNode && currentContent.contains(target)) {
        checkAriaHidden();
      }
    };
    
    // ✅ Escuchar cuando el drawer se abre
    const handleStateChange = () => {
      // Verificar que content existe antes de procesar usando la referencia actual
      const currentContent = contentRef.current;
      if (currentContent && currentContent.parentNode) {
        checkAriaHidden();
      }
    };
    
    document.addEventListener('focusin', handleFocusIn);
    // Solo agregar el listener si el elemento existe
    if (content) {
      content.addEventListener('transitionend', handleStateChange);
    }
    
    return () => {
      observer.disconnect();
      clearInterval(intervalId);
      document.removeEventListener('focusin', handleFocusIn);
      // Verificar que el elemento existe antes de remover el listener
      // Usar contentRef.current para obtener la referencia más reciente
      const currentContent = contentRef.current;
      if (currentContent && currentContent.parentNode) {
        currentContent.removeEventListener('transitionend', handleStateChange);
      }
    };
  }, []);
  
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
          "fixed inset-x-0 bottom-0 z-50 flex h-auto flex-col rounded-t-[10px] border bg-background sm:inset-x-0 sm:top-auto sm:bottom-0 sm:rounded-t-lg sm:shadow-xl",
          className,
          // Si se proporciona un estilo con 'top', sobrescribir bottom-0
          props.style?.top && "!bottom-auto"
        )}
        style={{
          ...props.style,
          // Asegurar que el z-index del drawer sea mayor que el overlay cuando no hay overlay
          zIndex: showOverlay ? (props.style?.zIndex || 9998) : (props.style?.zIndex || 10000),
          // Forzar bordes superiores redondeados siempre si se especifican en style
          ...(props.style?.borderTopLeftRadius && {
            borderTopLeftRadius: props.style.borderTopLeftRadius + ' !important' as any
          }),
          ...(props.style?.borderTopRightRadius && {
            borderTopRightRadius: props.style.borderTopRightRadius + ' !important' as any
          }),
          // Asegurar que los bordes inferiores no estén redondeados si se especifica
          ...(props.style?.borderBottomLeftRadius !== undefined && {
            borderBottomLeftRadius: props.style.borderBottomLeftRadius
          }),
          ...(props.style?.borderBottomRightRadius !== undefined && {
            borderBottomRightRadius: props.style.borderBottomRightRadius
          })
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
        {/* Handle - ocultar si se especifica noHandle */}
        {!noHandle && (
          <div className="mx-auto mt-3 mb-2 h-1.5 w-12 rounded-full bg-muted md:hidden" />
        )}
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
}

