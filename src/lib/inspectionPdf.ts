import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { ESTADO_OPTIONS } from './inspectionCatalog';
import { type ResolvedTemplate } from './inspectionTemplateConfig';

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 40;
const BLUE = rgb(0.13, 0.39, 0.92);
const GREY = rgb(0.45, 0.5, 0.55);
const DARK = rgb(0.06, 0.09, 0.16);

// Trunca una etiqueta para que quepa en el ancho dado (aprox por anchura de fuente).
function fit(font: PDFFont, text: string, size: number, maxW: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxW) return text;
  let t = text;
  while (t.length > 1 && font.widthOfTextAtSize(t + '…', size) > maxW) t = t.slice(0, -1);
  return t + '…';
}

export async function buildTemplatePdf(t: ResolvedTemplate): Promise<Blob> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const form = doc.getForm();
  const contentW = A4[0] - MARGIN * 2;

  let page = doc.addPage(A4);
  let y = A4[1] - MARGIN;

  const footer = (p: PDFPage) => {
    p.drawText('inspecciono.com · Revisión independiente', {
      x: MARGIN, y: 24, size: 8, font, color: GREY,
    });
  };
  const newPage = () => { footer(page); page = doc.addPage(A4); y = A4[1] - MARGIN; };
  const ensure = (need: number) => { if (y - need < 50) newPage(); };

  // --- Título ---
  page.drawText(t.headerTitle, { x: MARGIN, y: y - 6, size: 18, font: bold, color: DARK });
  y -= 24;
  page.drawText(t.headerSubtitle, {
    x: MARGIN, y, size: 9, font, color: GREY,
  });
  y -= 26;

  // --- Cabecera: campos de texto en 2 columnas ---
  const colW = (contentW - 16) / 2;
  for (let i = 0; i < t.headerFields.length; i += 2) {
    ensure(34);
    for (let c = 0; c < 2; c++) {
      const h = t.headerFields[i + c];
      if (!h) continue;
      const x = MARGIN + c * (colW + 16);
      page.drawText(h.label, { x, y, size: 7.5, font, color: GREY });
      const tf = form.createTextField(h.fieldName);
      tf.addToPage(page, { x, y: y - 18, width: colW, height: 15, borderWidth: 0.5, borderColor: GREY });
    }
    y -= 34;
  }
  y -= 6;

  // --- Secciones ---
  for (const sec of t.sections) {
    ensure(48);
    page.drawRectangle({ x: MARGIN, y: y - 18, width: contentW, height: 20, color: rgb(0.93, 0.96, 1) });
    page.drawText(`${sec.id} · ${sec.title}`, { x: MARGIN + 6, y: y - 13, size: 11, font: bold, color: BLUE });
    page.drawText(sec.subtitle, { x: MARGIN + 6, y: y - 28, size: 8, font, color: GREY });
    y -= 40;

    const ddW = 110;
    const labelW = contentW - 26 - ddW - 8;
    for (const p of sec.points) {
      ensure(24);
      page.drawText(String(p.displayNum), { x: MARGIN, y, size: 9, font: bold, color: DARK });
      page.drawText(fit(font, p.label, 9, labelW), { x: MARGIN + 26, y, size: 9, font, color: DARK });
      const dd = form.createDropdown(p.fieldName);
      dd.addOptions([...ESTADO_OPTIONS]);
      dd.addToPage(page, {
        x: MARGIN + contentW - ddW, y: y - 4, width: ddW, height: 15,
        borderWidth: 0.5, borderColor: GREY, font,
      });
      y -= 22;
    }

    // Observaciones de la sección
    ensure(46);
    page.drawText(`Observaciones — ${sec.title.toLowerCase()}`, { x: MARGIN, y, size: 7.5, font, color: GREY });
    const obs = form.createTextField(sec.obsFieldName);
    obs.enableMultiline();
    obs.addToPage(page, { x: MARGIN, y: y - 38, width: contentW, height: 34, borderWidth: 0.5, borderColor: GREY });
    y -= 50;
  }

  // --- Veredicto ---
  newPage();
  page.drawText('VEREDICTO Y CONSEJO', { x: MARGIN, y: y - 6, size: 14, font: bold, color: DARK });
  y -= 30;
  for (const [label, name, h] of [
    ['Recomendación final', 'vd_recomendacion', 16] as const,
    ['Lo que hay que arreglar y cuánto cuesta', 'vd_reparaciones', 80] as const,
    ['Rebaja que justifica el informe', 'vd_rebaja', 16] as const,
    ['Resumen del experto (en cristiano, para decidir)', 'vd_resumen', 80] as const,
  ]) {
    ensure(h + 26);
    page.drawText(label, { x: MARGIN, y, size: 8, font, color: GREY });
    const f = form.createTextField(name);
    if (h > 20) f.enableMultiline();
    f.addToPage(page, { x: MARGIN, y: y - (h + 4), width: contentW, height: h, borderWidth: 0.5, borderColor: GREY });
    y -= h + 22;
  }

  // --- Imágenes (placeholders) ---
  newPage();
  page.drawText('IMÁGENES DEL VEHÍCULO', { x: MARGIN, y: y - 6, size: 14, font: bold, color: DARK });
  y -= 28;
  page.drawText('El experto carga las fotos desde la app; se insertan aquí al generar el informe.', {
    x: MARGIN, y, size: 8, font, color: GREY,
  });
  y -= 20;
  const cell = (contentW - 16) / 2;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const x = MARGIN + c * (cell + 16);
      const yy = y - r * (cell * 0.7 + 12) - cell * 0.7;
      page.drawRectangle({ x, y: yy, width: cell, height: cell * 0.7, borderWidth: 0.5, borderColor: GREY });
      page.drawText(`Foto ${r * 2 + c + 1}`, { x: x + 6, y: yy + cell * 0.7 - 14, size: 8, font, color: GREY });
    }
  }
  footer(page);

  const bytes = await doc.save();
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}
