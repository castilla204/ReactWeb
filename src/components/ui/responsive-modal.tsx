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
  /** Clases extra para la cabecera del drawer en móvil. */
  drawerHeaderClassName?: string
  /** En desktop, renderiza un panel lateral derecho (drawer) en vez del popup centrado. */
  desktopSidePanel?: boolean
}

const AUTH_SURFACE_GRADIENT =
  'linear-gradient(to right, rgba(0,102,204,0.10) 0%, rgba(245,158,11,0.10) 100%), #ffffff'

// Panel lateral derecho a pantalla completa (desktop). Doble override con `!`
// para anular el centrado por defecto de DialogContent y respetar el deslizado.
const DESKTOP_SIDE_PANEL_CLASS =
  'fixed right-0 top-0 z-50 flex h-full max-h-[100dvh] w-full max-w-[min(440px,100vw)] flex-col gap-0 overflow-hidden border-0 border-l border-[#ebebeb] bg-white p-0 shadow-[-16px_0_48px_rgba(15,23,42,0.12)] duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-[440px] !left-auto !right-0 !top-0 !h-full !max-h-[100dvh] !w-full !translate-x-0 !translate-y-0 !rounded-none'

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
  drawerHeaderClassName,
  desktopSidePanel = false,
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
              "flex min-h-0 flex-col overflow-hidden rounded-t-[24px] w-full !max-w-full border-0 bg-white",
              "shadow-[0_-12px_40px_rgba(15,23,42,0.12)]",
              "focus:outline-none focus-visible:outline-none",
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
          noHandle
          title={title}
          description={description}
        >
          <div
            className={cn(
              "flex h-auto min-h-0 flex-col overflow-y-auto overscroll-y-contain bg-white [-webkit-overflow-scrolling:touch]",
              drawerScrollClassName,
            )}
            style={{
              maxHeight: bodyMaxHeight,
              paddingTop: drawerStyle?.marginTop ? '0' : undefined,
            }}
          >
            {(!noHandle || title) && (
              <div
                className={cn(
                  "sticky top-0 z-10 shrink-0 overflow-hidden rounded-t-[24px] border-b border-[#ebebeb]",
                  drawerHeaderClassName,
                )}
                style={{ background: AUTH_SURFACE_GRADIENT }}
              >
                {!noHandle && (
                  <div className="flex justify-center pb-0 pt-2">
                    <DrawerHandle className="!mt-0 !mb-0 h-1 w-10 rounded-full bg-[#c4c4c4]" />
                  </div>
                )}
                {title && (
                  <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-0.5 md:px-6">
                    <div className="min-w-0 pr-1">
                      <h2 className="font-display text-[16px] font-semibold leading-tight tracking-[-0.015em] text-[#222222]">
                        {title}
                      </h2>
                      {description && (
                        <p className="mt-0.5 font-display text-[12px] font-normal leading-snug text-[#8a8a8a]">
                          {description}
                        </p>
                      )}
                    </div>
                    <DrawerClose asChild>
                      <button
                        type="button"
                        className="-mr-1 shrink-0 rounded-full p-1.5 text-[#717171] transition-colors hover:bg-black/[0.04] hover:text-[#222222] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        aria-label="Cerrar"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </DrawerClose>
                  </div>
                )}
              </div>
            )}
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  const desktopHeader =
    title && !hideDialogHeader ? (
      <DialogHeader
        className={cn(
          'flex-shrink-0 border-b border-[#ebebeb] px-6 pb-3 pt-4 text-left md:px-7',
          dialogHeaderClassName
        )}
        style={{ background: AUTH_SURFACE_GRADIENT }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 pr-2">
            <DialogTitle className="font-display text-[17px] font-semibold leading-tight tracking-[-0.015em] text-[#222222]">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="mt-0.5 font-display text-[12px] font-normal leading-snug text-[#8a8a8a]">
                {description}
              </DialogDescription>
            )}
          </div>
          <DialogClose asChild>
            <button
              type="button"
              className="shrink-0 rounded-full p-2 text-[#717171] ring-offset-background transition-colors hover:bg-[#f0f0f0] hover:text-[#222222] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </DialogClose>
        </div>
      </DialogHeader>
    ) : null

  // Panel lateral derecho (drawer) en PC
  if (desktopSidePanel) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(DESKTOP_SIDE_PANEL_CLASS, className, dialogClassName)}
          style={{ ...style, ...dialogStyle }}
          hideCloseButton={true}
          overlayClassName="bg-black/40"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {desktopHeader}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {children}
          </div>
        </DialogContent>
      </Dialog>
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
              'flex-shrink-0 border-b border-[#ebebeb] px-6 pb-3 pt-4 text-left md:px-7',
              dialogHeaderClassName
            )}
            style={{ background: AUTH_SURFACE_GRADIENT }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 pr-2">
                <DialogTitle className="font-display text-[17px] font-semibold leading-tight tracking-[-0.015em] text-[#222222]">
                  {title}
                </DialogTitle>
                {description && (
                  <DialogDescription className="mt-0.5 font-display text-[12px] font-normal leading-snug text-[#8a8a8a]">
                    {description}
                  </DialogDescription>
                )}
              </div>
              <DialogClose asChild>
                <button
                  type="button"
                  className="shrink-0 rounded-full p-2 text-[#717171] ring-offset-background transition-colors hover:bg-[#f0f0f0] hover:text-[#222222] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
