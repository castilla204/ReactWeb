import { useEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
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
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.4 }}
            onDragEnd={handleDragEnd}
          >
            <div
              className="flex shrink-0 cursor-grab flex-col items-center border-b border-gray-100 px-4 pb-3 pt-2 active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="mb-2 h-1 w-10 rounded-full bg-gray-300" aria-hidden />
              <div className="flex w-full items-start justify-between gap-3">
                <div className="min-w-0 flex-1 text-left">
                  <h2
                    id="mobile-details-sheet-title"
                    className="text-base font-semibold text-gray-900"
                  >
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 flex items-center gap-1 text-[11px] text-gray-400">
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

type DetailsPeekBarProps = {
  onOpen: () => void;
  title: string;
  statusLabel?: string;
  className?: string;
};

/** Barra superior: invita a deslizar / pulsar para ver detalles */
export function DetailsPeekBar({ onOpen, title, statusLabel, className }: DetailsPeekBarProps) {
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      className={cn(
        'lg:hidden flex w-full shrink-0 items-center gap-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-4 py-2.5 text-left transition-colors hover:from-gray-100/80',
        className
      )}
      whileTap={{ scale: 0.99 }}
      aria-label="Ver detalles del servicio"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <motion.span
          animate={{ y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          className="text-primary"
          aria-hidden
        >
          <ChevronDown className="h-5 w-5 rotate-180" />
        </motion.span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">Desliza o pulsa para ver detalles</p>
      </div>
      {statusLabel && (
        <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-medium text-gray-600">
          {statusLabel}
        </span>
      )}
    </motion.button>
  );
}
