import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, type PanInfo } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

interface MapResultsSheetProps {
    expanded: boolean;
    onExpandedChange: (value: boolean) => void;
    count: number;
    summary: string;
    thumbnails: string[];
    children: React.ReactNode;
}

export function MapResultsSheet({
    expanded,
    onExpandedChange,
    count,
    summary,
    thumbnails,
    children,
}: MapResultsSheetProps) {
    const reduceMotion = useReducedMotion();

    // Altura del cuerpo medida con ResizeObserver: animamos `height` a px exactos en lugar de
    // `grid-template-rows: 1fr`, que en este layout (contenedor de altura indefinida) resolvía a 0.
    const contentRef = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = useState(0);
    useEffect(() => {
        const el = contentRef.current;
        if (!el) return;
        const update = () => setContentHeight(el.scrollHeight);
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const handleDragEnd = (_: unknown, info: PanInfo) => {
        if (info.offset.y < -40 || info.velocity.y < -300) {
            onExpandedChange(true);
        } else if (info.offset.y > 40 || info.velocity.y > 300) {
            onExpandedChange(false);
        }
    };

    return (
        <div className="pointer-events-none">
            <motion.button
                type="button"
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.18}
                onDragEnd={handleDragEnd}
                onClick={() => onExpandedChange(!expanded)}
                aria-expanded={expanded}
                aria-label={expanded ? 'Plegar lista de resultados' : 'Desplegar lista de resultados'}
                style={{
                    paddingBottom: expanded
                        ? undefined
                        : 'calc(env(safe-area-inset-bottom, 0px) + 0.625rem)',
                }}
                className="pointer-events-auto flex w-full touch-none items-center gap-2.5 rounded-t-2xl bg-white px-3.5 pt-2.5 pb-2.5 text-left shadow-[0_-4px_20px_rgba(0,0,0,0.10)]"
            >
                {thumbnails.length > 0 && (
                    <span className="flex shrink-0 items-center">
                        {thumbnails.map((src, i) => (
                            <img
                                key={i}
                                src={src}
                                alt=""
                                aria-hidden
                                className="h-6 w-6 rounded-full border-2 border-white object-cover"
                                style={{ marginLeft: i === 0 ? 0 : -9 }}
                            />
                        ))}
                    </span>
                )}
                <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-semibold leading-tight text-[#222222]">
                        {count} {count === 1 ? 'resultado' : 'resultados'}
                    </span>
                    {summary && (
                        <span className="block truncate text-[12px] leading-tight text-[#717171]">
                            {summary}
                        </span>
                    )}
                </span>
                <ChevronUp
                    className="h-5 w-5 shrink-0 text-[#717171]"
                    style={{
                        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: reduceMotion ? 'none' : 'transform 0.3s ease',
                    }}
                    aria-hidden
                />
            </motion.button>

            <div
                style={{
                    height: expanded ? contentHeight : 0,
                    overflow: 'hidden',
                    opacity: expanded ? 1 : 0,
                    transition: reduceMotion
                        ? 'none'
                        : 'height 0.34s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease',
                }}
            >
                <div ref={contentRef}>{children}</div>
            </div>
        </div>
    );
}
