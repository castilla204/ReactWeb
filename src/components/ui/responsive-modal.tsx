import * as React from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose, DrawerHandle } from "./drawer"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "./dialog"
import { useWindowSize } from "../../hooks/useWindowSize"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"

interface ResponsiveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  drawerClassName?: string
  dialogClassName?: string
  style?: React.CSSProperties
  drawerStyle?: React.CSSProperties
  dialogStyle?: React.CSSProperties
  noOverlay?: boolean
  noHandle?: boolean
  mobileBreakpoint?: number
  snapPoints?: (number | string)[]
  activeSnapPoint?: number | string | null
  setActiveSnapPoint?: (snapPoint: number | string | null) => void
  modal?: boolean
  dismissible?: boolean
  drawerHeight?: string
  fadeFromIndex?: number
  handleOnly?: boolean
  snapToSequentialPoint?: boolean
}

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  drawerClassName,
  dialogClassName,
  style,
  drawerStyle,
  dialogStyle,
  noOverlay = false,
  noHandle = false,
  mobileBreakpoint = 1024,
  snapPoints,
  activeSnapPoint,
  setActiveSnapPoint,
  modal = true,
  dismissible = true,
  drawerHeight,
  fadeFromIndex,
  handleOnly = false,
  snapToSequentialPoint = true,
}) => {
  const { width } = useWindowSize()
  
  // Detectar si es móvil
  const isMobile = React.useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < mobileBreakpoint
    }
    if (width > 0) {
      return width < mobileBreakpoint
    }
    return false
  }, [width, mobileBreakpoint])

  if (isMobile) {
    // Calcular la altura máxima basada en el último snapPoint
    // Si hay snapPoints, el último define la altura máxima (ej: 0.85 = 85vh)
    // Los snapPoints en vaul son fracciones de la altura disponible desde bottom
    const maxSnapPoint = snapPoints && snapPoints.length > 0 
      ? Math.max(...snapPoints.map(sp => typeof sp === 'number' ? sp : parseFloat(sp as string) || 0))
      : 1;
    const maxHeightVh = `${maxSnapPoint * 100}vh`;
    const height = drawerHeight || (snapPoints ? maxHeightVh : '350px');
    
    return (
      <Drawer 
        open={open} 
        onOpenChange={onOpenChange}
        snapPoints={snapPoints}
        activeSnapPoint={activeSnapPoint}
        setActiveSnapPoint={setActiveSnapPoint}
        modal={modal}
        dismissible={dismissible}
        fadeFromIndex={fadeFromIndex}
        handleOnly={handleOnly}
        snapToSequentialPoint={snapToSequentialPoint}
      >
        <DrawerContent
          className={cn(
            "rounded-t-[20px] w-full !max-w-full shadow-[0_-8px_32px_rgba(0,0,0,0.15)] border-0 bg-white",
            "focus:outline-none focus-visible:outline-none",
            className, 
            drawerClassName
          )}
          style={{ 
            ...style, 
            ...drawerStyle,
            width: '100%',
            maxWidth: '100%',
            // Limitar la altura máxima al último snapPoint para evitar que suba más
            maxHeight: maxHeightVh,
            // ✅ Aplicar margen superior si se especifica en drawerStyle
            marginTop: drawerStyle?.marginTop || style?.marginTop || undefined,
            zIndex: noOverlay ? (drawerStyle?.zIndex || style?.zIndex || 10000) : (drawerStyle?.zIndex || style?.zIndex || 9998),
            // Mejorar rendimiento de animaciones
            willChange: 'transform',
            // Transición más fluida y rápida
            transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          noOverlay={noOverlay}
          noHandle={noHandle}
          title={title}
          description={description}
        >
          <div 
            className="flex flex-col bg-white" 
            style={{ 
              height: '100%', 
              maxHeight: '100%',
              display: 'flex', 
              flexDirection: 'column',
              overflow: 'hidden',
              // ✅ Aplicar padding-top si hay margen superior para compensar
              paddingTop: drawerStyle?.marginTop ? '0' : undefined,
              // ✅ Asegurar que los hijos puedan hacer scroll
              position: 'relative',
            }}
          >
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  // Usar Dialog (popup) en PC
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px] [&>button]:hidden",
          className, 
          dialogClassName
        )}
        style={{ 
          ...style, 
          ...dialogStyle,
          display: 'flex',
          flexDirection: 'column',
          gap: 0
        }}
        hideCloseButton={true}
      >
        {title && (
          <DialogHeader className="px-4 pt-4 pb-3.5 border-b border-border flex-shrink-0 bg-muted">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
              <DialogClose asChild>
                <button className="p-1.5 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <X className="h-5 w-5" />
                </button>
              </DialogClose>
            </div>
            {description && <DialogDescription className="mt-0.5 text-sm text-muted-foreground">{description}</DialogDescription>}
          </DialogHeader>
        )}
        <div className="flex flex-col" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}
