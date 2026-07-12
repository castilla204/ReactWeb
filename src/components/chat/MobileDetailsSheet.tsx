import { useEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence, useDragControls, useReducedMotion, PanInfo } from 'framer-motion';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '../../lib/utils';

const SNAP_CLOSE = 0.35;
const SHEET_MAX_VH = 92;

type MobileDetailsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

export function MobileDetailsSheet({
  open,
  onOpenChange,
  title = 'Detalles del servicio',
  subtitle,
  children,
  className,
}: MobileDetailsSheetProps) {
  const dragControls = useDragControls();
  const sheetRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const sheetHeight = sheetRef.current?.offsetHeight ?? window.innerHeight;
    const shouldClose =
      info.velocity.y > 400 || info.offset.y > sheetHeight * SNAP_CLOSE;
    if (shouldClose) onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Cerrar detalles"
            className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-[2px] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => onOpenChange(false)}
          />

          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-details-sheet-title"
            className={cn(
              'fixed inset-x-0 bottom-0 z-[60] flex flex-col rounded-t-[1.25rem] bg-white shadow-[0_-8px_40px_rgba(0,0,0,0.12)] lg:hidden',
              className
            )}
            style={{ maxHeight: `${SHEET_MAX_VH}vh` }}
            initial={prefersReducedMotion ? { opacity: 0 } : { y: '100%' }}
            animate={prefersReducedMotion ? { opacity: 1 } : { y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { y: '100%' }}
            transition={prefersReducedMotion ? { duration: 0.15 } : { type: 'spring', damping: 32, stiffness: 340 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.4 }}
            onDragEnd={handleDragEnd}
          >
            <div
              className="flex shrink-0 cursor-grab flex-col items-center border-b border-line-soft px-4 pb-3 pt-2 active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="mb-2 h-1 w-10 rounded-full bg-line" aria-hidden />
              <div className="flex w-full items-start justify-between gap-3">
                <div className="min-w-0 flex-1 text-left">
                  <h2
                    id="mobile-details-sheet-title"
                    className="text-lead font-semibold tracking-[-0.01em] text-ink-strong"
                  >
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="mt-0.5 text-caption text-ink-muted">{subtitle}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-line-soft text-ink-muted transition-colors hover:bg-line-soft hover:text-ink-strong"
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 flex items-center gap-1 text-kicker text-ink-soft">
                <ChevronDown className="h-3.5 w-3.5 rotate-180" aria-hidden />
                Desliza hacia abajo para volver al chat
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 pb-8">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

