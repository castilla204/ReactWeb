/**
 * ⚡ Miniaturas vía Cloudflare Image Transformations (/cdn-cgi/image/).
 *
 * Las fotos de servicios se suben a Supabase Storage en tamaño original
 * (fotos de cámara de 1-4MB) y se pintaban tal cual en tarjetas de ~150-300px.
 * Cloudflare las redimensiona/recomprime al vuelo y sirve WebP/AVIF según el
 * navegador (`format=auto`), cacheado en su edge.
 *
 * REQUISITO (dashboard de Cloudflare, una vez):
 *   Images → Transformations → habilitar para la zona inspecciono.com
 *   y activar "Resize images from any origin" (las URLs origen son de Supabase).
 *   Plan gratuito: 5.000 transformaciones únicas/mes.
 *
 * Si la transformación no está habilitada o falla, el consumidor debe hacer
 * fallback a la URL original con onError (ver ServiceCard).
 */

/** Zona de Cloudflare que ejecuta la transformación. */
const CDN_ZONE = 'https://inspecciono.com';

/**
 * Devuelve la URL de miniatura para una imagen remota (Supabase u otra URL https).
 * Devuelve la URL original si no es transformable (data:, blob:, relativa, ya transformada).
 *
 * @param width ancho CSS máximo al que se pinta; se pide 2x para retina.
 */
export function getThumbUrl(url: string | null | undefined, width: number, quality = 75): string {
  if (!url) return '';
  // Solo URLs http(s) absolutas; data:/blob:/relativas se devuelven tal cual.
  if (!/^https?:\/\//i.test(url)) return url;
  // No re-transformar una URL ya envuelta.
  if (url.includes('/cdn-cgi/image/')) return url;
  const dpr2 = Math.min(width * 2, 1600); // 2x retina con tope sano
  return `${CDN_ZONE}/cdn-cgi/image/width=${dpr2},quality=${quality},format=auto,fit=cover/${url}`;
}
