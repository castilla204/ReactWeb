// Fuente de verdad del informe base de revisión de coche.
// Reconstruido del PDF base (secciones A–K, 56 puntos). Las cabeceras, el
// veredicto y las imágenes son fijos (no personalizables).

export const ESTADO_OPTIONS = ['Bien', 'Ojo / negociar', 'Defecto', 'No aplica'] as const;

export interface CatalogPoint {
  num: number;          // número global 1..56 (estable, identifica el punto)
  label: string;
  required?: boolean;   // no se puede quitar
}

export interface CatalogSection {
  id: string;           // 'A'..'K'
  title: string;
  subtitle: string;
  points: CatalogPoint[];
}

export interface Catalog {
  headerFields: { key: string; label: string }[];
  sections: CatalogSection[];
}

export const INSPECTION_CATALOG: Catalog = {
  headerFields: [
    { key: 'marca_modelo', label: 'Marca y modelo' },
    { key: 'version_motor', label: 'Versión / motor' },
    { key: 'matricula', label: 'Matrícula' },
    { key: 'vin', label: 'Bastidor (VIN)' },
    { key: 'anio', label: 'Año' },
    { key: 'kilometros', label: 'Kilómetros' },
    { key: 'precio', label: 'Precio pedido' },
    { key: 'fecha_lugar', label: 'Fecha / lugar' },
    { key: 'experto', label: 'Experto' },
    { key: 'cliente', label: 'Cliente' },
  ],
  sections: [
    {
      id: 'A', title: 'Documentación y procedencia', subtitle: '¿Es legal, sin trampas ni deudas?',
      points: [
        { num: 1, label: 'Kilometraje real: coherencia cuadro / OBD / desgaste / facturas', required: true },
        { num: 2, label: 'Bastidor (VIN) coincide con documentación y sin manipular', required: true },
        { num: 3, label: 'No accidentado grave / no consta siniestro total o baja' },
        { num: 4, label: 'Sin cargas, embargos ni reserva de dominio (informe DGT)', required: true },
        { num: 5, label: 'No figura como robado; documentación legítima' },
        { num: 6, label: 'Titularidad y nº de transferencias coherentes' },
        { num: 7, label: 'ITV en vigor y sin defectos graves pendientes' },
        { num: 8, label: 'Nº de llaves y mandos entregados' },
      ],
    },
    {
      id: 'B', title: 'Motor', subtitle: '¿El corazón del coche está sano?',
      points: [
        { num: 9, label: 'Scanner OBD: fallos activos y códigos borrados recientemente' },
        { num: 10, label: 'Testigo de motor (MIL)' },
        { num: 11, label: 'Fugas de aceite o refrigerante' },
        { num: 12, label: 'Tapa de aceite: emulsión / lodos (junta de culata)' },
        { num: 13, label: 'Indicios de sobrecalentamiento' },
        { num: 14, label: 'Humo de escape (color y cantidad)' },
        { num: 15, label: 'Correa de distribución: estado y último cambio' },
        { num: 16, label: 'Turbo y admisión (si aplica)' },
        { num: 17, label: 'Niveles y estado de fluidos' },
      ],
    },
    {
      id: 'C', title: 'Transmisión', subtitle: '¿Cambia y embraga como debe?',
      points: [
        { num: 18, label: 'Embrague: punto y patinamiento' },
        { num: 19, label: 'Caja de cambios manual: entra bien, sin ruidos' },
        { num: 20, label: 'Cambio automático / DSG: suavidad y respuesta' },
        { num: 21, label: 'Ruidos de transmisión o diferencial' },
      ],
    },
    {
      id: 'D', title: 'Frenos', subtitle: '¿Frena con seguridad?',
      points: [
        { num: 22, label: 'Discos y pastillas: desgaste' },
        { num: 23, label: 'Eficacia de frenada, sin vibración' },
        { num: 24, label: 'ABS / ESP funcionando (testigo y prueba)' },
        { num: 25, label: 'Freno de mano / electrónico' },
      ],
    },
    {
      id: 'E', title: 'Suspensión y dirección', subtitle: '¿Va estable y no tira?',
      points: [
        { num: 26, label: 'Amortiguadores: rebotes y fugas' },
        { num: 27, label: 'Rótulas y holguras en dirección' },
        { num: 28, label: 'No tira a un lado (alineación)' },
        { num: 29, label: 'Ruidos en baches o al girar' },
      ],
    },
    {
      id: 'F', title: 'Carrocería y pintura', subtitle: '¿Le han tapado un golpe?',
      points: [
        { num: 30, label: 'Espesor de pintura (medidor): repintados y tono' },
        { num: 31, label: 'Masilla o reparaciones de chapa' },
        { num: 32, label: 'Holguras y simetría de paneles' },
        { num: 33, label: 'Óxido o corrosión superficial' },
        { num: 34, label: 'Cristales y lunas: roturas y fechas coherentes' },
      ],
    },
    {
      id: 'G', title: 'Estructura y bajos', subtitle: '¿Está entero por debajo?',
      points: [
        { num: 35, label: 'Largueros y estructura: deformación o soldaduras no originales' },
        { num: 36, label: 'Corrosión estructural' },
        { num: 37, label: 'Señales de inundación (barro, óxido, humedad, olor)' },
        { num: 38, label: 'Fugas visibles bajo el vehículo' },
      ],
    },
    {
      id: 'H', title: 'Sistema eléctrico y electrónico', subtitle: '¿Funciona todo lo electrónico?',
      points: [
        { num: 39, label: 'Testigos airbag y ABS sin fallo' },
        { num: 40, label: 'Batería de tracción: salud (si híbrido / eléctrico)' },
        { num: 41, label: 'Batería de 12V y carga' },
        { num: 42, label: 'Luces, elevalunas y cierre centralizado' },
        { num: 43, label: 'Climatización: enfría y calienta' },
      ],
    },
    {
      id: 'I', title: 'Interior y equipamiento', subtitle: '¿El uso es coherente con el km?',
      points: [
        { num: 44, label: 'Desgaste coherente (volante, asiento, pedales)' },
        { num: 45, label: 'Tapicería, cinturones y airbags visibles' },
        { num: 46, label: 'Infoentretenimiento, cámaras y sensores' },
        { num: 47, label: 'Olores (humedad, quemado, tabaco)' },
      ],
    },
    {
      id: 'J', title: 'Ruedas y neumáticos', subtitle: '¿Cuánto me durarán?',
      points: [
        { num: 48, label: 'Profundidad de dibujo (4 ruedas)' },
        { num: 49, label: 'Antigüedad de los neumáticos (DOT)' },
        { num: 50, label: 'Llantas: golpes, fisuras o corrosión' },
        { num: 51, label: 'Rueda de repuesto o kit antipinchazos' },
      ],
    },
    {
      id: 'K', title: 'Prueba en carretera', subtitle: '¿Cómo se comporta de verdad?',
      points: [
        { num: 52, label: 'Arranque en frío y ralentí estable' },
        { num: 53, label: 'Aceleración y respuesta del motor' },
        { num: 54, label: 'Frenada y estabilidad a velocidad' },
        { num: 55, label: 'Ruidos anómalos en marcha' },
        { num: 56, label: 'Comportamiento general y vibraciones' },
      ],
    },
  ],
};

export function allPoints(catalog: Catalog): CatalogPoint[] {
  return catalog.sections.flatMap((s) => s.points);
}

export function requiredPointNums(catalog: Catalog): number[] {
  return allPoints(catalog).filter((p) => p.required).map((p) => p.num);
}
