/** Recorte circular de foto de perfil (canvas, sin dependencias externas). */

export const PROFILE_PHOTO_OUTPUT_SIZE = 512;
export const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

export type ProfilePhotoCropState = {
    scale: number;
    offsetX: number;
    offsetY: number;
};

export function getBaseCoverScale(
    imageWidth: number,
    imageHeight: number,
    viewportSize: number,
): number {
    return Math.max(viewportSize / imageWidth, viewportSize / imageHeight);
}

export async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
    const url = URL.createObjectURL(file);
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('No se pudo cargar la imagen'));
        };
        img.src = url;
    });
    return img;
}

export async function cropProfilePhotoToBlob(
    image: HTMLImageElement,
    viewportSize: number,
    state: ProfilePhotoCropState,
    outputSize = PROFILE_PHOTO_OUTPUT_SIZE,
    mimeType: 'image/jpeg' | 'image/png' = 'image/jpeg',
    quality = 0.92,
): Promise<Blob> {
    const baseScale = getBaseCoverScale(image.naturalWidth, image.naturalHeight, viewportSize);
    const effectiveScale = baseScale * state.scale;
    const displayedW = image.naturalWidth * effectiveScale;
    const displayedH = image.naturalHeight * effectiveScale;

    const centerX = viewportSize / 2 + state.offsetX;
    const centerY = viewportSize / 2 + state.offsetY;
    const imgLeft = centerX - displayedW / 2;
    const imgTop = centerY - displayedH / 2;

    const sx = (0 - imgLeft) / effectiveScale;
    const sy = (0 - imgTop) / effectiveScale;
    const sSize = viewportSize / effectiveScale;

    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas no disponible');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outputSize, outputSize);
    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const drawScale = outputSize / viewportSize;
    ctx.drawImage(
        image,
        sx,
        sy,
        sSize,
        sSize,
        0,
        0,
        outputSize,
        outputSize,
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('Error al exportar la imagen'))),
            mimeType,
            quality,
        );
    });
}

export function blobToFile(blob: Blob, fileName: string): File {
    return new File([blob], fileName, { type: blob.type, lastModified: Date.now() });
}
