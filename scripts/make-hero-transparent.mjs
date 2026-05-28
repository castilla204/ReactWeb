/**
 * Recorte limpio del experto hero:
 * - Fuente: Generated_image.png (fondo claro) o hero-expert-cutout.png
 * - Solo quita fondo CONECTADO a los bordes (flood-fill), no zonas oscuras internas
 * - Limpia halos blancos en píxeles transparentes
 * - Recorte, espejo horizontal
 *
 * Uso: node scripts/make-hero-transparent.mjs
 */
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mediaDir = path.join(__dirname, '../src/media');
const candidates = [
  path.join(mediaDir, 'Generated_image.png'),
  path.join(mediaDir, 'hero-expert-cutout.png'),
];
const input = candidates.find((p) => fs.existsSync(p));
const output = path.join(mediaDir, 'hero-expert-transparent.png');

if (!input) {
  console.error('No se encontró imagen fuente en src/media/');
  process.exit(1);
}

/** Fondo de estudio (blanco / gris claro) */
const isBackgroundPixel = (r, g, b, a) => {
  if (a < 20) return true;
  const lum = (r + g + b) / 3;
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  return lum >= 205 && chroma <= 42;
};

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: w, height: h } = info;
const n = w * h;

const isBackground = new Uint8Array(n);
const queue = [];

const trySeed = (idx) => {
  if (idx < 0 || idx >= n || isBackground[idx]) return;
  const px = idx * 4;
  const r = data[px];
  const g = data[px + 1];
  const b = data[px + 2];
  const a = data[px + 3];
  if (!isBackgroundPixel(r, g, b, a)) return;
  isBackground[idx] = 1;
  queue.push(idx);
};

for (let x = 0; x < w; x++) {
  trySeed(x);
  trySeed((h - 1) * w + x);
}
for (let y = 0; y < h; y++) {
  trySeed(y * w);
  trySeed(y * w + (w - 1));
}

while (queue.length > 0) {
  const idx = queue.pop();
  const x = idx % w;
  const y = (idx / w) | 0;
  if (x > 0) trySeed(idx - 1);
  if (x < w - 1) trySeed(idx + 1);
  if (y > 0) trySeed(idx - w);
  if (y < h - 1) trySeed(idx + w);
}

let removed = 0;
for (let idx = 0; idx < n; idx++) {
  const px = idx * 4;
  if (isBackground[idx]) {
    data[px] = 0;
    data[px + 1] = 0;
    data[px + 2] = 0;
    data[px + 3] = 0;
    removed++;
    continue;
  }
  if (data[px + 3] === 0) {
    data[px] = 0;
    data[px + 1] = 0;
    data[px + 2] = 0;
  }
}

/** Suaviza halos blancos semitransparentes en el contorno */
for (let idx = 0; idx < n; idx++) {
  const px = idx * 4;
  const a = data[px + 3];
  if (a === 0 || a === 255) continue;
  const r = data[px];
  const g = data[px + 1];
  const b = data[px + 2];
  const lum = (r + g + b) / 3;
  if (lum > 200) {
    data[px + 3] = Math.max(0, Math.min(255, Math.round(a * 0.65)));
  }
}

const meta = await sharp(data, { raw: info })
  .png()
  .trim()
  .flop()
  .png({ compressionLevel: 9 })
  .toFile(output);

console.log(`Fuente: ${path.basename(input)}`);
console.log(`OK ${output} (${meta.width}x${meta.height}), fondo eliminado: ${removed} px`);
