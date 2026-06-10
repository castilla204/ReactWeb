// Optimiza las imágenes que se sirven en el bundle (src/media) y los favicons (public).
// - PNGs de iconos/ilustraciones: reescala al tamaño máximo de render real (2x retina)
//   y cuantiza a paleta (equivalente a pngquant) → ~85-95% menos peso.
// - JPGs: recomprime con mozjpeg q75 y limita a 1280px.
// - AVIF: además genera variantes AVIF para el hero y fotos grandes (~20-30%
//   menos peso que WebP a calidad equivalente; soporte ≥94% en 2026).
// Uso: node scripts/optimize-images.mjs
import sharp from 'sharp';
import { stat, rename } from 'node:fs/promises';
import path from 'node:path';

const MEDIA = path.resolve('src/media');
const PUBLIC = path.resolve('public');

// [archivo, maxLado, tipo]
const targets = [
  // Iconos de categoría del AirbnbSearchBar (se muestran ≤160px CSS → 512px sobra para 3x)
  [`${MEDIA}/house.png`, 512, 'png'],
  [`${MEDIA}/caldera.png`, 512, 'png'],
  [`${MEDIA}/motorcycle.png`, 512, 'png'],
  [`${MEDIA}/motoagua.png`, 512, 'png'],
  [`${MEDIA}/casapng.png`, 512, 'png'],
  [`${MEDIA}/camarapng.png`, 512, 'png'],
  [`${MEDIA}/cochepng.png`, 512, 'png'],
  [`${MEDIA}/Car.png`, 512, 'png'],
  [`${MEDIA}/internet-61.png`, 512, 'png'],
  [`${MEDIA}/bluecheck.png`, 512, 'png'],
  [`${MEDIA}/erizo.png`, 256, 'png'],
  // Foto recortada del hero (tiene alpha; la paleta banding-ea fotos → quality alta + dither)
  [`${MEDIA}/hero-expert-transparent.png`, null, 'png-photo'],
  [`${MEDIA}/hero-expert-cutout.png`, null, 'png-photo'],
  // Fotos de oficio (JPG)
  [`${MEDIA}/revisioncasa.jpg`, 1280, 'jpg'],
  [`${MEDIA}/revisionmoto.jpg`, 1280, 'jpg'],
  [`${MEDIA}/revisioncoche.jpg`, 1280, 'jpg'],
  // Favicons: se declaran como 48/192/180px en index.html pero pesan 74KB cada uno
  [`${PUBLIC}/favicon.png`, 192, 'png'],
  [`${PUBLIC}/apple-touch-icon.png`, 180, 'png'],
];

const kb = (n) => `${Math.round(n / 1024)}KB`;

for (const [file, maxSide, kind] of targets) {
  let before;
  try {
    before = (await stat(file)).size;
  } catch {
    console.log(`(omitido, no existe) ${path.basename(file)}`);
    continue;
  }

  let img = sharp(file);
  const meta = await img.metadata();
  if (maxSide && (meta.width > maxSide || meta.height > maxSide)) {
    img = img.resize(maxSide, maxSide, { fit: 'inside', withoutEnlargement: true });
  }

  if (kind === 'png') {
    img = img.png({ palette: true, quality: 90, compressionLevel: 9, effort: 10 });
  } else if (kind === 'png-photo') {
    img = img.png({ palette: true, quality: 95, dither: 1, compressionLevel: 9, effort: 10 });
  } else {
    img = img.jpeg({ quality: 75, mozjpeg: true });
  }

  const tmp = `${file}.tmp`;
  await img.toFile(tmp);
  const after = (await stat(tmp)).size;
  if (after < before) {
    await rename(tmp, file);
    console.log(`✔ ${path.basename(file)}: ${kb(before)} → ${kb(after)}`);
  } else {
    const { unlink } = await import('node:fs/promises');
    await unlink(tmp);
    console.log(`= ${path.basename(file)}: ya óptima (${kb(before)})`);
  }
}

// ⚡ Variantes AVIF + WebP del hero (LCP) y fotos grandes. NO los iconos
// paletizados (≤160px) — ahí AVIF/WebP empata o pierde frente a PNG-8 por el
// overhead del contenedor.
const heroVariants = [
  { src: `${PUBLIC}/hero-expert.webp`, base: `${PUBLIC}/hero-expert` },
];

const kbCount = (n) => `${Math.round(n / 1024)}KB`;

for (const { src, base } of heroVariants) {
  let exists = true;
  try { await stat(src); } catch { exists = false; }
  if (!exists) {
    console.log(`(omitido AVIF/WebP, no existe) ${path.basename(src)}`);
    continue;
  }
  // AVIF: effort 4 ya da ~80% del ahorro de effort 9 en 1/8 del tiempo.
  // quality 60 es punto dulce para fotos (Mozilla recomienda 50-65).
  await sharp(src).avif({ quality: 60, effort: 4 }).toFile(`${base}.avif`);
  // WebP: regenerar también para asegurar pareja-q (fallback consistente).
  await sharp(src).webp({ quality: 78 }).toFile(`${base}.webp.new`);
  const { rename: rn } = await import('node:fs/promises');
  await rn(`${base}.webp.new`, `${base}.webp`);
  const sAvif = (await stat(`${base}.avif`)).size;
  const sWebp = (await stat(`${base}.webp`)).size;
  console.log(`✔ ${path.basename(base)}: AVIF ${kbCount(sAvif)} · WebP ${kbCount(sWebp)}`);
}
