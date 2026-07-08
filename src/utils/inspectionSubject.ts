/**
 * Sustantivo de LO QUE SE INSPECCIONA, derivado del nombre de la categoría.
 *
 * El checkout tenía «coche» escrito a mano en varios sitios («El coche lo tiene el
 * vendedor», «¿Dónde está el coche?»), así que al contratar una revisión de una casa o
 * una moto la copy mentía. Este helper devuelve el sintagma con artículo, listo para
 * incrustar en la frase.
 *
 * Los patrones son los mismos que usan `searchCategoryIcon` y `AirbnbSearchBar` para
 * elegir el icono, para que icono y texto nunca discrepen.
 */

const RULES: ReadonlyArray<{ match: (n: string) => boolean; subject: string }> = [
    { match: (n) => n.includes('moto') && n.includes('agua'), subject: 'la moto de agua' },
    { match: (n) => n.includes('moto') && !n.includes('agua'), subject: 'la moto' },
    { match: (n) => n.includes('coche') || n.includes('vehículo') || n.includes('vehiculo'), subject: 'el coche' },
    {
        match: (n) =>
            n.includes('inmobiliaria') ||
            n.includes('inmueble') ||
            n.includes('casa') ||
            n.includes('piso') ||
            n.includes('vivienda'),
        subject: 'el inmueble',
    },
];

/** Genérico cuando la categoría no encaja con ninguna regla (o aún no ha cargado). */
const FALLBACK_SUBJECT = 'el producto';

/** «el coche», «la moto», «el inmueble»… Siempre en minúscula y con artículo. */
export function getInspectionSubject(categoryName?: string | null): string {
    const name = categoryName ? String(categoryName).toLowerCase() : '';
    if (!name) return FALLBACK_SUBJECT;
    return RULES.find((r) => r.match(name))?.subject ?? FALLBACK_SUBJECT;
}

/** Igual, con la primera letra en mayúscula: «El coche», «La moto»… */
export function getInspectionSubjectCapitalized(categoryName?: string | null): string {
    const subject = getInspectionSubject(categoryName);
    return subject.charAt(0).toUpperCase() + subject.slice(1);
}

/**
 * Forma en genitivo, con la contracción hecha: «del coche», «de la moto», «del inmueble».
 * Sin esto saldría «de el coche», que es justo el fallo que introduce interpolar el
 * sintagma a pelo detrás de una preposición.
 */
export function getInspectionSubjectOf(categoryName?: string | null): string {
    const subject = getInspectionSubject(categoryName);
    return subject.startsWith('el ') ? `del ${subject.slice(3)}` : `de ${subject}`;
}
