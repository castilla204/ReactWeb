import * as React from "react";
import { AnimatePresence, motion, useMotionValue, animate } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Bottom-sheet móvil con drag 1:1 y handoff drag↔scroll dentro del MISMO gesto.
 * Solo `transform: translate3d` para animar; refs/motionValue para 0 re-renders en drag.
 */

interface CustomBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  headerContent?: React.ReactNode;
  className?: string;
  /** Fracciones del viewport (0..1). Default [0.30, 0.92]. */
  snapPoints?: (number | string)[];
  activeSnapPoint?: number | string | null;
  onActiveSnapPointChange?: (point: number | string | null) => void;
  dismissible?: boolean;
  snapToSequentialPoint?: boolean;
  scrollLockTimeout?: number;
  onCloseRequest?: () => void;
  /** Si true y headerContent está presente, NO renderiza el X automático.
   *  Útil cuando el headerContent ya incluye su propio botón de minimizar
   *  (evita el solape entre el X absolute y el contenido del header). */
  hideCloseButton?: boolean;
}

const SPRING = { type: "spring" as const, stiffness: 380, damping: 38, mass: 0.9 };
const DELIBERATE_PX = 30;     // delta acumulado para considerar push deliberado
const DELIBERATE_VEL = 0.6;   // px/ms instantáneo (umbral alternativo)

const toFraction = (p: number | string): number => {
  if (typeof p === "number") return p;
  const s = p.trim();
  if (s.endsWith("%")) return parseFloat(s) / 100;
  const n = parseFloat(s);
  return Number.isFinite(n) ? (n > 1 ? n / 100 : n) : 0;
};

export const CustomBottomSheet: React.FC<CustomBottomSheetProps> = ({
  open,
  onOpenChange,
  children,
  title,
  headerContent,
  className,
  snapPoints: snapPointsProp,
  activeSnapPoint: controlledSnap,
  onActiveSnapPointChange,
  dismissible = false,
  onCloseRequest,
  hideCloseButton = false,
  // snapToSequentialPoint y scrollLockTimeout aceptados por compat — el handoff
  // físico ya emula "un snap por gesto" y la ventana de bloqueo es implícita.
}) => {
  const snapPoints = snapPointsProp ?? [0.30, 0.50, 0.92];
  const fractions = React.useMemo(() => snapPoints.map(toFraction), [snapPoints]);
  const peekFrac = fractions[0] ?? 0.30;
  const fullFrac = fractions[fractions.length - 1] ?? 0.92;
  // ✅ Con 3+ snaps abre en el intermedio (mitad de pantalla). Con 2, abre full.
  const defaultSnap =
    snapPoints.length >= 3
      ? snapPoints[snapPoints.length - 2]
      : snapPoints[snapPoints.length - 1];

  const [internalSnap, setInternalSnap] = React.useState<number | string | null>(defaultSnap);
  const activeSnap = controlledSnap !== undefined ? controlledSnap : internalSnap;
  const setActiveSnap = onActiveSnapPointChange ?? setInternalSnap;

  // Viewport en ref — no re-render storm en resize
  const vhRef = React.useRef<number>(typeof window !== "undefined" ? window.innerHeight : 800);
  const [, bumpVh] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => {
    const onResize = () => { vhRef.current = window.innerHeight; bumpVh(); };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  const yForFrac = React.useCallback((f: number) => vhRef.current * (1 - f), []);
  const peekY = yForFrac(peekFrac);
  const fullY = yForFrac(fullFrac);
  const closedY = vhRef.current;

  const y = useMotionValue(closedY);
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Animar a snap cuando cambia open o activeSnap (controlado)
  React.useEffect(() => {
    if (!open) { animate(y, closedY, SPRING); return; }
    const frac = activeSnap == null ? fullFrac : toFraction(activeSnap as number | string);
    animate(y, yForFrac(frac), SPRING);
  }, [open, activeSnap, fullFrac, yForFrac, closedY, y]);

  // Reset scrollTop al colapsar a peek
  React.useEffect(() => {
    if (activeSnap == null) return;
    if (toFraction(activeSnap as number | string) <= peekFrac + 0.001 && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activeSnap, peekFrac]);

  // Estado del gesto en refs — cero re-renders durante el drag
  const g = React.useRef({
    active: false,
    startY: 0, startSheetY: 0,
    lastY: 0, lastT: 0,
    velocity: 0,                // px/ms, signo: + = abajo
    handedToScroll: false,      // gesto cedido al scroll interno
    pushDownDelta: 0,           // acumulado intentando bajar con scrollTop=0
    pointerId: -1,
  }).current;

  const handleDismiss = React.useCallback(() => {
    if (onCloseRequest) onCloseRequest(); else onOpenChange(false);
  }, [onCloseRequest, onOpenChange]);

  const snapToNearest = React.useCallback(() => {
    const current = y.get();
    const projected = current + g.velocity * 120;  // proyección de inercia ~120ms
    let bestFrac = fractions[0];
    let bestDist = Infinity;
    for (const f of fractions) {
      const d = Math.abs(projected - yForFrac(f));
      if (d < bestDist) { bestDist = d; bestFrac = f; }
    }
    // Cerrar si dismissible + flick fuerte hacia abajo desde peek
    if (dismissible && g.velocity > 1.2 && bestFrac === fractions[0]
        && current > yForFrac(fractions[0]) - 20) {
      animate(y, closedY, SPRING).then(() => onOpenChange(false));
      return;
    }
    animate(y, yForFrac(bestFrac), { ...SPRING, velocity: g.velocity * 1000 });
    const idx = fractions.indexOf(bestFrac);
    setActiveSnap(snapPoints[idx] ?? bestFrac);
  }, [y, g, fractions, yForFrac, snapPoints, setActiveSnap, dismissible, closedY, onOpenChange]);

  // Listeners táctiles con passive:false para poder preventDefault selectivo.
  // Pointer events de React no aceptan passive:false; por eso ref + addEventListener.
  React.useEffect(() => {
    const el = sheetRef.current;
    if (!el || !open) return;

    const getY = (e: TouchEvent | PointerEvent) =>
      "touches" in e ? (e.touches[0]?.clientY ?? e.changedTouches[0]?.clientY ?? 0) : e.clientY;

    const onDown = (e: TouchEvent) => {
      if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
      const t = e.touches[0]; if (!t) return;
      g.active = true;
      g.startY = t.clientY;
      g.startSheetY = y.get();
      g.lastY = t.clientY;
      g.lastT = e.timeStamp;
      g.velocity = 0;
      g.handedToScroll = false;
      g.pushDownDelta = 0;
    };

    const onMove = (e: TouchEvent) => {
      if (!g.active) return;
      const ny = getY(e);
      const dy = ny - g.lastY;
      const dt = Math.max(1, e.timeStamp - g.lastT);
      g.velocity = dy / dt;
      g.lastY = ny;
      g.lastT = e.timeStamp;

      const scrollEl = scrollRef.current;
      const atTop = !scrollEl || scrollEl.scrollTop <= 0;
      const sheetY = y.get();
      const atFull = Math.abs(sheetY - fullY) < 1;
      const atPeek = Math.abs(sheetY - peekY) < 1;

      // ¿Ya cedimos al scroll? Comprobamos si el usuario quiere recuperar el drawer.
      if (g.handedToScroll) {
        if (atTop && dy > 0) {
          g.pushDownDelta += dy;
          if (g.pushDownDelta > DELIBERATE_PX || g.velocity > DELIBERATE_VEL) {
            g.handedToScroll = false;
            g.startY = ny; g.startSheetY = y.get();  // re-ancla, no hay salto
          }
        } else {
          g.pushDownDelta = 0;
        }
        return;  // sin preventDefault → el scroll nativo del hijo procede
      }

      // En full + dedo arriba → el contenido scrollea
      if (atFull && dy < 0) { g.handedToScroll = true; return; }
      // En full + dedo abajo + contenido scrolleado → el contenido scrollea
      if (atFull && dy > 0 && !atTop) { g.handedToScroll = true; return; }
      // En full + dedo abajo + scrollTop=0 → SOLO colapsa si push deliberado
      if (atFull && dy > 0 && atTop) {
        g.pushDownDelta += dy;
        const deliberate = g.pushDownDelta > DELIBERATE_PX || g.velocity > DELIBERATE_VEL;
        if (!deliberate) { g.handedToScroll = true; return; }
        g.startY = ny; g.startSheetY = y.get();  // re-ancla post-decisión
      }
      // En peek + dedo arriba → expande inmediato (no hay scroll que disputar)
      // (sin reglas extra: cae al drag 1:1 abajo)
      void atPeek;

      // Drag 1:1 — secuestramos el gesto, preventDefault impide scroll nativo.
      if (e.cancelable) e.preventDefault();
      const delta = ny - g.startY;
      let next = g.startSheetY + delta;
      // Resistencia suave en bordes
      if (next < fullY) next = fullY - (fullY - next) * 0.35;
      const lower = dismissible ? closedY : peekY;
      if (next > lower) next = lower + (next - lower) * 0.35;
      y.set(next);
    };

    const onUp = () => {
      if (!g.active) return;
      g.active = false;
      if (g.handedToScroll) return;  // el scroll se llevó el gesto
      snapToNearest();
    };

    el.addEventListener("touchstart", onDown, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onUp, { passive: true });
    el.addEventListener("touchcancel", onUp, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onDown);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onUp);
      el.removeEventListener("touchcancel", onUp);
    };
  }, [open, y, g, fullY, peekY, closedY, dismissible, snapToNearest]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={sheetRef}
          key="sheet"
          role="dialog"
          aria-modal="false"
          className={cn(
            "fixed inset-x-0 top-0 z-[9998] flex flex-col overflow-hidden rounded-t-2xl bg-white shadow-[0_-8px_32px_rgba(0,0,0,0.12)]",
            className,
          )}
          style={{
            height: "100dvh",
            y,
            // pan-y → el navegador permite scroll vertical del hijo; nosotros hacemos
            // preventDefault() en touchmove cuando queremos secuestrar para drag.
            touchAction: "pan-y",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
            willChange: "transform",
          }}
          initial={{ y: closedY }}
          exit={{ y: closedY, transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] } }}
        >
          {headerContent ? (
            <div className="relative shrink-0 border-b border-[#e8e8e8]">
              {headerContent}
              {/* X minimizar — solo si hideCloseButton=false. Cuando el headerContent
                  ya integra su propio botón de minimizar (caso MapMobileDrawerHeader),
                  pasar hideCloseButton=true para evitar el solape con los chips. */}
              {!hideCloseButton && (
                <button
                  type="button"
                  data-no-drag
                  onClick={handleDismiss}
                  className="absolute right-1.5 top-0.5 flex h-8 w-8 items-center justify-center rounded-full text-[#888] active:bg-[#f4f4f4] transition-colors"
                  aria-label="Minimizar lista"
                >
                  <X className="h-4 w-4" strokeWidth={2.2} />
                </button>
              )}
            </div>
          ) : title ? (
            <div className="flex shrink-0 items-center justify-between border-b border-[#e8e8e8] px-4 py-2">
              <h2 className="font-display text-base font-semibold text-[#1c1c1c]">{title}</h2>
              <button
                type="button"
                data-no-drag
                onClick={handleDismiss}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#666] hover:bg-[#f5f5f5]"
                aria-label="Minimizar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex shrink-0 justify-center py-2" aria-hidden>
              <div className="h-1 w-10 rounded-full bg-[#d8d8d8]" />
            </div>
          )}

          <div
            ref={scrollRef}
            className={`map-panel-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white font-display text-[#1c1c1c]`}
            style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
          >
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
