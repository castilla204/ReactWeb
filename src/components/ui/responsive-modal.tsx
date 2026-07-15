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
  /** Oculta la cabecera sticky del drawer en móvil (título + asa). El contenido lleva su propia cabecera. */
  hideDrawerHeader?: boolean
  /** Clases extra para la cabecera del drawer en móvil. */
  drawerHeaderClassName?: string
  /** En desktop, renderiza un panel lateral derecho (drawer) en vez del popup centrado. */
  desktopSidePanel?: boolean
  /**
   * Vaul escala y redondea la página real detrás del drawer (no hay
   * `[data-vaul-drawer-wrapper]` en el proyecto, así que escala `body`
   * entero). Por defecto asoma un borde de esa página real arriba del
   * drawer — útil casi siempre, pero si lo que asoma repite el mensaje del
   * propio drawer (p. ej. el picker "elige qué revisar" sobre su propia
   * tarjeta hero) lee como una cabecera duplicada. Pon `false` para volver
   * al overlay oscuro plano sin el asomo de página.
   */
  scaleBackground?: boolean
}

// Papel plano: sin gradiente decorativo (DESIGN.md — el azul de marca solo donde paga).
const AUTH_SURFACE_BG = 'hsl(var(--surface))'

// Panel lateral derecho a pantalla completa (desktop). Doble override con `!`
// para anular el centrado por defecto de DialogContent y respetar el deslizado.
const DESKTOP_SIDE_PANEL_CLASS =
  'fixed right-0 top-0 z-50 flex h-full max-h-[100dvh] w-full max-w-[min(440px,100vw)] flex-col gap-0 overflow-hidden border-0 border-l border-line bg-white p-0 shadow-[-16px_0_48px_rgba(15,23,42,0.12)] duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-[440px] !left-auto !right-0 !top-0 !h-full !max-h-[100dvh] !w-full !translate-x-0 !translate-y-0 !rounded-none'

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
  hideDrawerHeader = false,
  drawerHeaderClassName,
  desktopSidePanel = false,
  scaleBackground = true,
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
        shouldScaleBackground={scaleBackground} // ✅ Efecto de escalado del fondo como Airbnb (opt-out: scaleBackground={false})
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
          // DrawerContent trae su propio asa genérica; ResponsiveModal ya
          // pinta la suya dentro de la cabecera sticky (línea ~184, más abajo
          // en este archivo). Sin este `true` ambas se renderizaban a la vez
          // — dos líneas grises apiladas en todo drawer con título.
          noHandle={true}
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
            {!hideDrawerHeader && (!noHandle || title) && (
              <div
                className={cn(
                  "sticky top-0 z-10 shrink-0 overflow-hidden rounded-t-[24px] border-b border-line",
                  drawerHeaderClassName,
                )}
                style={{ background: AUTH_SURFACE_BG }}
              >
                {!noHandle && (
                  // pb-1.5 (6px) + el pt-0.5 (2px) del bloque de título de abajo = 8px,
                  // el paso "micro" del sistema para asa/imagen → texto (vs. los ~2px de antes).
                  <div className="flex justify-center pb-1.5 pt-2">
                    <DrawerHandle className="!mt-0 !mb-0 h-1 w-10 rounded-full bg-line" />
                  </div>
                )}
                {title && (
                  <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-0.5 md:px-6">
                    <div className="min-w-0 pr-1">
                      <h2 className="font-display text-subtitle font-semibold leading-tight text-ink">
                        {title}
                      </h2>
                      {description && (
                        <p className="mt-0.5 font-display text-caption font-normal leading-snug text-ink-muted">
                          {description}
                        </p>
                      )}
                    </div>
                    <DrawerClose asChild>
                      <button
                        type="button"
                        className="-mr-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black/[0.05] text-ink-muted transition-colors hover:bg-black/[0.1] hover:text-ink-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        aria-label="Cerrar"
                      >
                        <X className="h-[18px] w-[18px]" />
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
          'flex-shrink-0 border-b border-line px-6 pb-3 pt-4 text-left md:px-7',
          dialogHeaderClassName
        )}
        style={{ background: AUTH_SURFACE_BG }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 pr-2">
            <DialogTitle className="font-display text-title font-semibold leading-tight tracking-[-0.015em] text-ink">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="mt-0.5 font-display text-caption font-normal leading-snug text-ink-muted">
                {description}
              </DialogDescription>
            )}
          </div>
          <DialogClose asChild>
            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/[0.05] text-ink-muted ring-offset-background transition-colors hover:bg-black/[0.1] hover:text-ink-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Cerrar"
            >
              <X className="h-[18px] w-[18px]" />
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
        >
          {title && hideDialogHeader ? (
            <DialogHeader className="sr-only">
              <DialogTitle>{title}</DialogTitle>
              {description ? <DialogDescription>{description}</DialogDescription> : null}
            </DialogHeader>
          ) : (
            desktopHeader
          )}
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
        onOpenAutoFocus={(e) => {
          if (hideDialogHeader && title) {
            e.preventDefault();
            const root = e.currentTarget as HTMLElement;
            const tab = root.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
            tab?.focus();
          }
        }}
      >
        {title && hideDialogHeader && (
          <DialogHeader className="sr-only">
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
        )}
        {title && !hideDialogHeader && (
          <DialogHeader
            className={cn(
              'flex-shrink-0 border-b border-line px-6 pb-3 pt-4 text-left md:px-7',
              dialogHeaderClassName
            )}
            style={{ background: AUTH_SURFACE_BG }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 pr-2">
                <DialogTitle className="font-display text-title font-semibold leading-tight tracking-[-0.015em] text-ink">
                  {title}
                </DialogTitle>
                {description && (
                  <DialogDescription className="mt-0.5 font-display text-caption font-normal leading-snug text-ink-muted">
                    {description}
                  </DialogDescription>
                )}
              </div>
              <DialogClose asChild>
                <button
                  type="button"
                  className="shrink-0 rounded-full p-2 text-ink-muted ring-offset-background transition-colors hover:bg-line-soft hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
