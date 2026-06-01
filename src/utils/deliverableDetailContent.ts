import type { ServiceDeliverableType } from './mapSelectedDeliverableTypes';

export type DeliverableDetail = {
  title: string;
  description: string;
  includes: string[];
  isRequired?: boolean;
};

function labelOf(dt: ServiceDeliverableType): string {
  return (dt.displayName || dt.name || '').trim();
}

export type DeliverableDetailOptions = {
  /** Si el servicio también incluye informe PDF (para copy del modal de vídeo). */
  hasPdf?: boolean;
};

/** Contenido mostrado al pulsar un chip de entregable. */
export function getDeliverableDetail(
  dt: ServiceDeliverableType,
  options?: DeliverableDetailOptions
): DeliverableDetail {
  const title = labelOf(dt);
  const key = (dt.name || title).toLowerCase();
  const apiDescription = (dt.description || '').trim();

  if (key.includes('pdf') || key.includes('informe') || key.includes('report')) {
    return {
      title,
      description:
        apiDescription ||
        'Documento profesional con el resultado de la inspección, listo para revisar y compartir.',
      isRequired: dt.isRequired,
      includes: [
        'Resumen de hallazgos y conclusiones claras',
        'Fotografías integradas en el informe',
        'Puntos críticos y recomendaciones de negociación',
        'Coherencia entre anuncio y estado real del bien',
        'Formato PDF descargable tras aprobar el trabajo',
      ],
    };
  }

  if (key.includes('video')) {
    const videoIncludes = [
      'Recorrido visual de las zonas revisadas',
      'Defectos, ruidos o detalles en movimiento',
      'Comentarios del experto durante la visita',
      'Archivo de vídeo entregado en el chat de la reserva',
    ];
    if (options?.hasPdf !== false) {
      videoIncludes.push('Complementa el informe PDF del servicio');
    }
    return {
      title,
      description:
        apiDescription ||
        'Grabación de la revisión presencial para ver detalles que no siempre salen en fotos fijas.',
      isRequired: dt.isRequired,
      includes: videoIncludes,
    };
  }

  if (key.includes('foto') || key.includes('photo') || key.includes('imagen')) {
    return {
      title,
      description: apiDescription || 'Conjunto de fotografías en alta resolución de los puntos revisados.',
      isRequired: dt.isRequired,
      includes: [
        'Imágenes nítidas de cada zona inspeccionada',
        'Detalle de desperfectos visibles',
        'Entrega junto al informe del servicio',
      ],
    };
  }

  return {
    title,
    description: apiDescription || 'Entregable incluido en este servicio según lo acordado con el experto.',
    isRequired: dt.isRequired,
    includes: [
      'Contenido preparado por el experto tras la visita',
      'Disponible en el chat de la reserva cuando esté listo',
      'Revisión y aprobación antes de liberar el pago',
    ],
  };
}
