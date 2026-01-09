import * as React from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "./drawer"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "./dialog"
import { useWindowSize } from "../../hooks/useWindowSize"
import { X } from "lucide-react"
import { Button } from "./button"
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
  activeSnapPoint?: number | string
  setActiveSnapPoint?: (snapPoint: number | string) => void
  modal?: boolean
  dismissible?: boolean
  drawerHeight?: string // Altura personalizada del drawer (ej: '60vh', '400px')
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
}) => {
  const { width } = useWindowSize()
  
  // ✅ FORZAR detección en cada render usando window.innerWidth directamente
  // Esto asegura que siempre use el valor actual, no un valor en caché
  const isMobile = React.useMemo(() => {
    if (typeof window !== 'undefined') {
      const currentWidth = window.innerWidth
      const isMobileValue = currentWidth < mobileBreakpoint
      console.log('🖥️ ResponsiveModal - Render check:', {
        open,
        windowWidth: currentWidth,
        hookWidth: width,
        mobileBreakpoint,
        isMobile: isMobileValue,
        willShow: isMobileValue ? 'Drawer ✅' : 'Dialog ✅',
        snapPoints,
        activeSnapPoint
      })
      return isMobileValue
    }
    // Si no hay window, usar el hook como respaldo
    if (width > 0) {
      return width < mobileBreakpoint
    }
    // Por defecto, asumir desktop (no móvil)
    return false
  }, [width, mobileBreakpoint, open, snapPoints, activeSnapPoint])

  if (isMobile) {
    // Usar Drawer en móvil - Con altura controlada por CSS
    const height = drawerHeight || (snapPoints ? '100vh' : '350px');
    
    return (
      <Drawer 
        open={open} 
        onOpenChange={onOpenChange}
        snapPoints={snapPoints}
        activeSnapPoint={activeSnapPoint}
        setActiveSnapPoint={setActiveSnapPoint}
        modal={modal}
        dismissible={dismissible}
      >
        <DrawerContent
          className={cn("rounded-t-2xl w-full !max-w-full shadow-lg border-t border-gray-200 bg-white transition-all duration-300", className, drawerClassName)}
          style={{ 
            ...style, 
            ...drawerStyle,
            width: '100%',
            maxWidth: '100%',
            height: height,
            maxHeight: height,
            // Asegurar que el drawer tenga un z-index alto cuando no hay overlay
            zIndex: noOverlay ? (drawerStyle?.zIndex || style?.zIndex || 10000) : (drawerStyle?.zIndex || style?.zIndex || 9998)
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
              display: 'flex', 
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  // Usar Dialog (popup) en PC - Mismo estilo que AccountSettingsModal
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

