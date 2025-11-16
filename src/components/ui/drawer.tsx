import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "../../lib/utils"

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
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/50", className)}
    {...props}
  />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  // ✅ BEST PRACTICE: Prevenir warnings de accesibilidad
  // Vaul maneja aria-hidden automáticamente, pero podemos asegurarnos de que
  // cuando el drawer está abierto, los elementos puedan recibir focus correctamente
  const contentRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    
    // Función para verificar y corregir aria-hidden cuando el drawer está abierto
    const checkAriaHidden = () => {
      const isOpen = content.getAttribute('data-state') === 'open';
      const hasAriaHidden = content.getAttribute('aria-hidden') === 'true';
      
      // Si el drawer está abierto pero tiene aria-hidden, removerlo
      // Esto previene warnings de accesibilidad
      if (isOpen && hasAriaHidden) {
        // Usar requestAnimationFrame para evitar conflictos con vaul
        requestAnimationFrame(() => {
          if (content.getAttribute('data-state') === 'open') {
            content.removeAttribute('aria-hidden');
          }
        });
      }
    };
    
    // Observar cambios en data-state
    const observer = new MutationObserver(checkAriaHidden);
    
    observer.observe(content, {
      attributes: true,
      attributeFilter: ['data-state', 'aria-hidden']
    });
    
    // Verificar inicialmente
    checkAriaHidden();
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <DrawerPortal>
      <DrawerOverlay />
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
          className
        )}
        {...props}
      >
        <div className="mx-auto mt-3 mb-2 h-1.5 w-12 rounded-full bg-muted md:hidden" />
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

