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
  dialogHeaderClassName?: string
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
  /** Altura máxima del cuerpo del drawer (p. ej. "96dvh"). Imprescindible si hay pie fijo/sticky. */
  drawerMaxHeight?: string
  /** Clases del contenedor scroll interno del drawer (p. ej. fondo oscuro). */
  drawerScrollClassName?: string
  /** Oculta la cabecera blanca del diálogo en desktop (el contenido lleva su propia cabecera). */
  hideDialogHeader?: boolean
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
  dialogHeaderClassName,
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
  drawerMaxHeight,
  drawerScrollClassName,
  hideDialogHeader = false,
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
    const maxHeightVh = `${maxSnapPoint * 100}dvh`;
    const bodyMaxHeight =
      drawerMaxHeight ??
      (snapPoints ? `min(${maxHeightVh}, calc(100dvh - env(safe-area-inset-bottom, 0px)))` : 'min(90dvh, calc(100dvh - env(safe-area-inset-bottom, 0px)))');

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
        snapToSequentialPoint={snapToSequentialPoint !== undefined ? snapToSequentialPoint : true} // ✅ true por defecto para fluidez
        shouldScaleBackground={true} // ✅ Efecto de escalado del fondo como Airbnb
      >
        <DrawerContent
            className={cn(
              "flex min-h-0 flex-col rounded-t-[20px] w-full !max-w-full shadow-[0_-8px_32px_rgba(0,0,0,0.15)] border-0 bg-white",
              "focus:outline-none focus-visible:outline-none",
              "[&_[data-vaul-drawer-handle]]:bg-white/35",
              className, 
              drawerClassName
            )}
          style={{ 
            ...style, 
            ...drawerStyle,
            width: '100%',
            maxWidth: '100%',
            // ✅ Sin límite de altura - permitir que suba hasta 100vh
            maxHeight: '100vh',
            // ✅ Aplicar margen superior si se especifica en drawerStyle
            marginTop: drawerStyle?.marginTop || style?.marginTop || undefined,
            zIndex: noOverlay ? (drawerStyle?.zIndex || style?.zIndex || 10000) : (drawerStyle?.zIndex || style?.zIndex || 9998),
            // Mejorar rendimiento de animaciones
            willChange: 'transform',
            // ✅ Vaul maneja las transiciones nativamente - no sobrescribir
          }}
          noOverlay={noOverlay}
          noHandle={noHandle}
          title={title}
          description={description}
        >
          <div
            className={cn(
              "h-auto min-h-0 overflow-y-auto overscroll-y-contain bg-white [-webkit-overflow-scrolling:touch]",
              drawerScrollClassName,
            )}
            style={{
              maxHeight: bodyMaxHeight,
              paddingTop: drawerStyle?.marginTop ? '0' : undefined,
            }}
          >
            {title && (
              <div className="flex shrink-0 items-center justify-between border-b border-[#ebebeb] px-4 pb-2.5 pt-3">
                <h2 className="text-base font-semibold leading-snug text-[#1c1c1c]">{title}</h2>
                <DrawerClose asChild>
                  <button
                    type="button"
                    className="rounded-md p-1.5 text-[#717171] opacity-80 transition-opacity hover:bg-[#f5f5f5] hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label="Cerrar"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </DrawerClose>
              </div>
            )}
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
          "!flex !flex-col !gap-0 overflow-hidden p-0 md:max-h-[min(90vh,640px)] md:max-w-[700px] lg:max-w-[800px] [&>button]:hidden",
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
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {title && !hideDialogHeader && (
          <DialogHeader
            className={cn(
              'flex-shrink-0 border-b border-[#ebebeb] bg-white px-4 pb-3.5 pt-4 text-left',
              dialogHeaderClassName
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 pr-2">
                <DialogTitle className="text-base font-semibold leading-snug text-[#1c1c1c]">{title}</DialogTitle>
                {description && (
                  <DialogDescription className="mt-0.5 text-sm text-[#717171]">
                    {description}
                  </DialogDescription>
                )}
              </div>
              <DialogClose asChild>
                <button
                  type="button"
                  className="shrink-0 rounded-md p-1.5 text-[#717171] opacity-80 ring-offset-background transition-opacity hover:bg-[#f5f5f5] hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5" />
                </button>
              </DialogClose>
            </div>
          </DialogHeader>
        )}
        <div className="flex flex-col overflow-y-auto" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, maxHeight: 'calc(80vh - 80px)' }}>
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}
