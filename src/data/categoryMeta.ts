/**
 * Metadata "del oficio" por categoría: descripción de entrega, precio desde,
 * expertos activos. No viene del backend (CategoryWithDetailsDto solo trae
 * id/name/parentId/isActive) — son datos contractuales del marketplace que
 * viven aquí hasta que el backend los exponga calculados desde Services +
 * ExpertServices.
 *
 * ⚠️ PLACEHOLDERS — ajusta con los datos reales antes de producción.
 *
 * Cuando se mueva a backend: este módulo expone un hook que resuelve la misma
 * forma, sustituyéndose por fetch sin tocar los componentes consumidores.
 *
 * Match por ID de categoría (en src/components/AirbnbSearchBar.tsx → CATEGORIES):
 *   VEHICULOS = 2  (parent, no se muestra)
 *   COCHES    = 5
 *   MOTOS     = 6
 *   INMOBILIARIA = 3
 *   CAMARAS   = 4
 *   FONTANERIA = 12
 */

export interface CategoryOfficeMeta {
    /** Frase de entrega: una línea, sin marketing. */
    delivery: string;
    /** Precio mínimo en euros enteros (sin céntimos). */
    priceFromEur: number;
    /** Expertos activos disponibles. */
    expertCount: number;
    /** Horas medias entre solicitud aceptada y informe entregado. Usado en aria. */
    reportHours: number;
}

const META_BY_CATEGORY_ID: Record<number, CategoryOfficeMeta> = {
    // COCHES — id 5
    5: {
        delivery: 'Inspección presencial · informe en 48 h',
        priceFromEur: 25,
        expertCount: 142,
        reportHours: 48,
    },
    // MOTOS — id 6
    6: {
        delivery: 'Inspección presencial · informe en 48 h',
        priceFromEur: 25,
        expertCount: 38,
        reportHours: 48,
    },
    // INMOBILIARIA — id 3
    3: {
        delivery: 'Visita técnica con informe certificado',
        priceFromEur: 89,
        expertCount: 21,
        reportHours: 72,
    },
    // CÁMARAS — id 4 (cuando pase a activa)
    4: {
        delivery: 'Revisión presencial de la cámara y accesorios',
        priceFromEur: 19,
        expertCount: 8,
        reportHours: 24,
    },
    // FONTANERÍA — id 12 (cuando pase a activa)
    12: {
        delivery: 'Diagnóstico de caldera, calefacción y fontanería',
        priceFromEur: 39,
        expertCount: 14,
        reportHours: 48,
    },
};

/**
 * Devuelve metadata si la categoría está catalogada. null si no — el componente
 * debe degradar a "alta sin meta" (solo nombre + chevron).
 */
export function getCategoryMeta(categoryId: number): CategoryOfficeMeta | null {
    return META_BY_CATEGORY_ID[categoryId] ?? null;
}
