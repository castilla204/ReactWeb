import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Loader2, Minus, Plus } from 'lucide-react';
import { ResponsiveModal } from '../ui/responsive-modal';
import { Slider } from '../ui/slider';
import { SD_MOBILE_GUTTER_CLASS } from '../../constants/homepageTypography';
import { MAP_LITERAL } from '../../constants/designTokens';
import { useWindowSize } from '../../hooks/useWindowSize';
import {
    cropProfilePhotoToBlob,
    getBaseCoverScale,
    loadImageFromFile,
    PROFILE_PHOTO_MAX_BYTES,
    type ProfilePhotoCropState,
} from '../../utils/profilePhotoCrop';
import { showToast } from '../../lib/toast';

const MIN_SCALE = 1;
const MAX_SCALE = 3;
const DESKTOP_STAGE_PX = 236;
const MOBILE_STAGE_MAX_PX = 272;
const DESKTOP_BREAKPOINT = 1024;

function CropViewportChrome({ size }: { size: number }) {
    const uid = useId().replace(/:/g, '');
    const maskId = `crop-mask-${uid}`;
    const clipId = `crop-clip-${uid}`;
    const c = size / 2;
    const r = Math.max(1, c - 2);
    const t = size / 3;

    return (
        <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox={`0 0 ${size} ${size}`}
            aria-hidden
        >
            <defs>
                <mask id={maskId}>
                    <rect width={size} height={size} fill="white" />
                    <circle cx={c} cy={c} r={r} fill="black" />
                </mask>
                <clipPath id={clipId}>
                    <circle cx={c} cy={c} r={r} />
                </clipPath>
            </defs>
            <rect width={size} height={size} fill="rgba(0, 0, 0, 0.45)" mask={`url(#${maskId})`} />
            <g clipPath={`url(#${clipId})`} stroke={MAP_LITERAL.coastHalo} strokeOpacity={0.55} strokeWidth={0.65}>
                <line x1={t} y1={0} x2={t} y2={size} />
                <line x1={t * 2} y1={0} x2={t * 2} y2={size} />
                <line x1={0} y1={t} x2={size} y2={t} />
                <line x1={0} y1={t * 2} x2={size} y2={t * 2} />
            </g>
            <circle cx={c} cy={c} r={r} fill="none" stroke={MAP_LITERAL.coastHalo} strokeWidth={1} strokeOpacity={0.85} />
        </svg>
    );
}

type ProfilePhotoCropModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    file: File | null;
    onConfirm: (file: File, previewUrl: string) => void;
};

export function ProfilePhotoCropModal({
    open,
    onOpenChange,
    file,
    onConfirm,
}: ProfilePhotoCropModalProps) {
    const { width: viewportWidth } = useWindowSize();
    const isDesktop = viewportWidth >= DESKTOP_BREAKPOINT;

    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [stageSize, setStageSize] = useState(DESKTOP_STAGE_PX);
    const stageRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
    const sourceUrlRef = useRef<string | null>(null);

    const revokeSourceUrl = () => {
        if (sourceUrlRef.current) {
            URL.revokeObjectURL(sourceUrlRef.current);
            sourceUrlRef.current = null;
        }
    };

    useEffect(() => {
        if (!open) return;

        if (isDesktop) {
            setStageSize(DESKTOP_STAGE_PX);
            return;
        }

        const el = stageRef.current;
        if (!el) return;

        const measure = () => {
            const w = Math.round(el.getBoundingClientRect().width);
            if (w > 0) setStageSize(w);
        };

        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, [open, isDesktop, loading]);

    useEffect(() => {
        if (!open || !file) {
            revokeSourceUrl();
            setImage(null);
            setScale(1);
            setOffset({ x: 0, y: 0 });
            return;
        }

        let cancelled = false;
        setLoading(true);
        loadImageFromFile(file)
            .then((img) => {
                if (cancelled) return;
                sourceUrlRef.current = img.src;
                setImage(img);
                setScale(1);
                setOffset({ x: 0, y: 0 });
            })
            .catch(() => {
                if (!cancelled) {
                    showToast('error', 'No se pudo cargar la imagen');
                    onOpenChange(false);
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
            revokeSourceUrl();
        };
    }, [open, file, onOpenChange]);

    const clampOffset = useCallback(
        (next: { x: number; y: number }, nextScale: number) => {
            if (!image) return next;
            const size = stageSize;
            const base = getBaseCoverScale(image.naturalWidth, image.naturalHeight, size);
            const effective = base * nextScale;
            const displayedW = image.naturalWidth * effective;
            const displayedH = image.naturalHeight * effective;
            const maxX = Math.max(0, (displayedW - size) / 2);
            const maxY = Math.max(0, (displayedH - size) / 2);
            return {
                x: Math.min(maxX, Math.max(-maxX, next.x)),
                y: Math.min(maxY, Math.max(-maxY, next.y)),
            };
        },
        [image, stageSize],
    );

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!image || loading) return;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            originX: offset.x,
            originY: offset.y,
        };
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!dragRef.current) return;
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        setOffset(clampOffset(
            { x: dragRef.current.originX + dx, y: dragRef.current.originY + dy },
            scale,
        ));
    };

    const handlePointerUp = () => {
        dragRef.current = null;
    };

    const handleScaleChange = (values: number[]) => {
        const next = values[0] ?? 1;
        setScale(next);
        setOffset((prev) => clampOffset(prev, next));
    };

    const nudgeScale = (delta: number) => {
        const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale + delta));
        setScale(next);
        setOffset((prev) => clampOffset(prev, next));
    };

    const handleConfirm = async () => {
        if (!image || !file) return;
        setSaving(true);
        try {
            const state: ProfilePhotoCropState = {
                scale,
                offsetX: offset.x,
                offsetY: offset.y,
            };
            const blob = await cropProfilePhotoToBlob(image, stageSize, state);
            if (blob.size > PROFILE_PHOTO_MAX_BYTES) {
                const smaller = await cropProfilePhotoToBlob(image, stageSize, state, 400, 'image/jpeg', 0.82);
                if (smaller.size > PROFILE_PHOTO_MAX_BYTES) {
                    throw new Error('La imagen sigue siendo demasiado grande');
                }
                applyResult(smaller, file.name);
                return;
            }
            applyResult(blob, file.name);
        } catch {
            showToast('error', 'No se pudo guardar la foto. Prueba con otra imagen.');
            setSaving(false);
        }
    };

    const applyResult = (blob: Blob, originalName: string) => {
        const ext = blob.type === 'image/png' ? 'png' : 'jpg';
        const base = originalName.replace(/\.[^.]+$/, '') || 'profile';
        const cropped = new File([blob], `${base}-profile.${ext}`, { type: blob.type, lastModified: Date.now() });
        const previewUrl = URL.createObjectURL(blob);
        onConfirm(cropped, previewUrl);
        setSaving(false);
        onOpenChange(false);
    };

    const displayScale = image
        ? getBaseCoverScale(image.naturalWidth, image.naturalHeight, stageSize) * scale
        : 1;
    const zoomPercent = Math.round(scale * 100);

    const cropStage = (
        <div
            ref={stageRef}
            className="relative shrink-0 touch-none select-none overflow-hidden rounded-full bg-line md:rounded-full"
            style={{ width: stageSize, height: stageSize }}
            aria-label="Arrastra para mover la foto"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            {loading && (
                <div className="absolute inset-0 z-[1] flex items-center justify-center bg-line">
                    <Loader2 className="h-7 w-7 animate-spin text-ink-soft" />
                </div>
            )}
            {image && !loading && (
                <img
                    src={image.src}
                    alt=""
                    draggable={false}
                    className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
                    style={{
                        width: image.naturalWidth * displayScale,
                        height: image.naturalHeight * displayScale,
                        transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                    }}
                />
            )}
            {stageSize > 0 && <CropViewportChrome size={stageSize} />}
        </div>
    );

    const zoomBlock = (
        <div className="w-full">
            <div className="mb-2 flex items-baseline justify-between text-sm">
                <span className="font-medium text-ink-strong">Zoom</span>
                <span className="tabular-nums text-ink-muted">{zoomPercent}%</span>
            </div>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => nudgeScale(-0.1)}
                    disabled={!image || loading || scale <= MIN_SCALE}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-strong hover:bg-surface-tinted disabled:opacity-35"
                    aria-label="Alejar"
                >
                    <Minus className="h-4 w-4" strokeWidth={2} />
                </button>
                <Slider
                    min={MIN_SCALE}
                    max={MAX_SCALE}
                    step={0.02}
                    value={[scale]}
                    onValueChange={handleScaleChange}
                    disabled={!image || loading}
                    className="flex-1 [&_.bg-secondary]:bg-line [&_.bg-primary]:bg-brand [&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                />
                <button
                    type="button"
                    onClick={() => nudgeScale(0.1)}
                    disabled={!image || loading || scale >= MAX_SCALE}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-strong hover:bg-surface-tinted disabled:opacity-35"
                    aria-label="Acercar"
                >
                    <Plus className="h-4 w-4" strokeWidth={2} />
                </button>
            </div>
        </div>
    );

    const actionsBlock = (
        <div className="flex flex-col gap-2 md:flex-row md:justify-end md:gap-3">
            <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="order-2 inline-flex h-11 items-center justify-center text-sm font-medium text-ink-muted hover:text-ink-strong md:order-1 md:h-12 md:px-4"
            >
                Cancelar
            </button>
            <button
                type="button"
                onClick={handleConfirm}
                disabled={!image || loading || saving}
                className="sd-btn-primary order-1 h-11 w-full min-w-0 md:order-2 md:w-auto md:min-w-[148px] disabled:cursor-wait"
            >
                {saving ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Guardando…
                    </>
                ) : (
                    'Aplicar recorte'
                )}
            </button>
        </div>
    );

    return (
        <ResponsiveModal
            open={open}
            onOpenChange={onOpenChange}
            title="Encuadrar foto de perfil"
            description="Arrastra la imagen y ajusta el zoom."
            drawerMaxHeight="92dvh"
            dialogClassName="max-w-[480px] !gap-0 !overflow-hidden !p-0 md:max-h-none"
            dialogStyle={{ maxHeight: 'none' }}
            hideDialogHeader
        >
            <div className="flex flex-col bg-white font-display text-ink-strong">
                <div className="md:flex md:min-h-0 md:items-stretch md:gap-6 md:px-5 md:pt-5 md:pb-5">
                    <div
                        className={`flex justify-center pt-5 pb-4 md:shrink-0 md:py-0 ${SD_MOBILE_GUTTER_CLASS} md:px-0`}
                    >
                        <div
                            className="mx-auto w-full max-w-[min(100%,272px)] md:mx-0 md:w-auto md:max-w-none"
                            style={isDesktop ? undefined : { maxWidth: MOBILE_STAGE_MAX_PX }}
                        >
                            {cropStage}
                        </div>
                    </div>

                    <div
                        className={`flex flex-1 flex-col md:min-w-[200px] md:justify-between md:py-0 ${SD_MOBILE_GUTTER_CLASS} pb-4 md:px-0 md:pb-0`}
                    >
                        <p className="mb-4 text-sm leading-relaxed text-ink-muted">
                            Arrastra la imagen para moverla y ajusta el zoom.
                        </p>
                        {zoomBlock}
                        <div className="mt-5 hidden md:mt-6 md:block">{actionsBlock}</div>
                    </div>
                </div>

                <footer
                    className={`border-t border-line pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden ${SD_MOBILE_GUTTER_CLASS} pt-3`}
                >
                    {actionsBlock}
                </footer>
            </div>
        </ResponsiveModal>
    );
}
