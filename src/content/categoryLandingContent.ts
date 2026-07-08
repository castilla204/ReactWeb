/**
 * Contenido de las landings de categoría (SEO long-tail).
 *
 * Cada entrada alimenta a CategoryLandingPage: una ruta estática con la keyword
 * exacta en la URL, title/description propios, contenido real (qué se revisa,
 * pasos, FAQ visibles) y JSON-LD (Service + BreadcrumbList + FAQPage).
 *
 * Los textos de title/description salen del plan SEO (SEO_PENDING.md).
 * Las FAQ deben ser VISIBLES en la página — Google exige que el JSON-LD
 * coincida con el contenido renderizado (update 08/2023).
 */

export interface CategoryLandingFaq {
  question: string;
  answer: string;
}

export interface CategoryLandingConfig {
  /** Slug de la URL (sin barra inicial). */
  slug: string;
  /** Nombre corto de la categoría (breadcrumb, enlaces relacionados). */
  shortName: string;
  /** Texto del enlace en el footer (keyword corta). */
  footerLabel: string;
  /** <title> SEO. */
  seoTitle: string;
  /** <meta description>. */
  seoDescription: string;
  /** OG title más humano para WhatsApp/LinkedIn. */
  ogTitle: string;
  /** Eyebrow sobre el H1. */
  eyebrow: string;
  /** H1 visible. */
  h1: string;
  /** Párrafo de introducción bajo el H1. */
  intro: string;
  /**
   * Respuesta directa de 40-60 palabras a la pregunta implícita del H1.
   * AEO/GEO 2026: los motores de respuesta (AI Overviews, ChatGPT, Perplexity)
   * extraen y citan el primer bloque que responde de forma directa y autocontenida.
   * Se renderiza destacado justo bajo el H1, antes de la intro narrativa.
   */
  answerFirst: string;
  /** Nombre del servicio para el schema Service. */
  serviceName: string;
  /** Título de la sección de puntos de revisión. */
  checksTitle: string;
  /** Qué revisa el experto (visible + credibilidad). */
  checks: string[];
  /** FAQ específicas de la categoría (visibles + FAQPage JSON-LD). */
  faqs: CategoryLandingFaq[];
}

/** Pasos comunes a todas las landings (mismo flujo real de la plataforma). */
export const LANDING_STEPS = [
  {
    title: 'Busca en el mapa',
    body: 'Indica dónde está lo que quieres comprar y compara expertos verificados cerca: precio, valoraciones y experiencia.',
  },
  {
    title: 'Reserva fecha y hora',
    body: 'Eliges un hueco del calendario real del experto. La cita queda cerrada en el momento, sin cruces de mensajes.',
  },
  {
    title: 'El experto lo inspecciona',
    body: 'Va en persona, lo revisa a fondo y documenta lo que encuentra con fotos y comentarios.',
  },
  {
    title: 'Recibes tu informe',
    body: 'Un informe claro para decidir con cabeza. El pago queda retenido en escrow hasta que das el visto bueno.',
  },
] as const;

export const CATEGORY_LANDINGS: CategoryLandingConfig[] = [
  {
    slug: 'inspeccion-coche-segunda-mano',
    shortName: 'Coche',
    footerLabel: 'Inspección de coche de segunda mano',
    seoTitle: 'Inspección de coche de segunda mano antes de comprar | Inspecciono',
    seoDescription:
      'Un mecánico verificado revisa el coche por ti, comprueba kms, siniestros y mecánica, y te entrega un informe. Pago retenido hasta tu visto bueno.',
    ogTitle: 'Que un mecánico revise ese coche antes de que lo pagues',
    eyebrow: 'Coches de segunda mano',
    h1: 'Inspección de coche de segunda mano antes de comprar',
    intro:
      'Comprar un coche usado sin revisarlo es jugar a la lotería: kilómetros trucados, siniestros ocultos, averías caras a la vuelta de la esquina. Un mecánico verificado de Inspecciono va donde está el coche, lo revisa a fondo y te entrega un informe para que decidas con datos, no con la palabra del vendedor.',
    answerFirst:
      'Una inspección de coche de segunda mano es una revisión presencial que hace un mecánico verificado antes de que compres: comprueba kilómetros reales, siniestros ocultos, mecánica y documentación, y te entrega un informe con fotos. En Inspecciono reservas al experto por el mapa, pagas en escrow y no cobra hasta tu visto bueno.',
    serviceName: 'Inspección pre-compra de coche de segunda mano',
    checksTitle: 'Qué revisa el mecánico',
    checks: [
      'Kilometraje real: coherencia entre cuadro, desgaste y mantenimiento documentado',
      'Historial de siniestros: golpes reparados, espesor de pintura y holguras de carrocería',
      'Mecánica: motor en frío y caliente, fugas, correas, embrague y cambio',
      'Diagnosis electrónica OBD: errores guardados y borrados recientes sospechosos',
      'Prueba dinámica: dirección, frenos, suspensión y ruidos en marcha',
      'Documentación: ITV, cargas, mantenimiento oficial y coherencia de bastidor',
    ],
    faqs: [
      {
        question: '¿Cuánto cuesta una inspección de coche de segunda mano?',
        answer:
          'Cada mecánico fija su precio y lo ves antes de reservar. Compara varios expertos cerca del coche en el mapa y elige el que mejor encaje por precio y valoraciones. Suele ser una fracción mínima de lo que cuesta una avería oculta.',
      },
      {
        question: '¿El mecánico va hasta donde está el coche?',
        answer:
          'Sí. Buscas expertos por la ubicación del vehículo (casa del vendedor, compraventa o concesionario) y el mecánico se desplaza a inspeccionarlo allí, en tu lugar si tú no puedes ir.',
      },
      {
        question: '¿Qué incluye el informe de la inspección?',
        answer:
          'El estado real del coche punto por punto: mecánica, electrónica, carrocería, kilometraje y documentación, con fotos y la valoración del experto. Suficiente para decidir la compra o negociar el precio a la baja.',
      },
      {
        question: '¿Cuándo pago? ¿Y si algo sale mal?',
        answer:
          'Pagas al reservar, pero el dinero queda retenido en escrow: el experto no lo cobra hasta que recibes el informe y das el visto bueno. Si la inspección no se realiza, se te devuelve.',
      },
    ],
  },
  {
    slug: 'peritaje-piso',
    shortName: 'Piso',
    footerLabel: 'Peritaje de piso',
    seoTitle: 'Peritaje de piso antes de firmar la compra | Inspecciono',
    seoDescription:
      'Un perito verificado inspecciona el piso (humedades, instalación, estructura) y te entrega un informe técnico antes de que firmes. Pago en escrow.',
    ogTitle: 'Que un perito revise ese piso antes de que firmes',
    eyebrow: 'Vivienda',
    h1: 'Peritaje de piso antes de firmar la compra',
    intro:
      'Es la compra más grande de tu vida y las visitas de 20 minutos no enseñan lo que importa: humedades tapadas, instalaciones caducadas, grietas que no son "de pintura". Un perito verificado inspecciona la vivienda a fondo y te entrega un informe técnico antes de que firmes nada.',
    answerFirst:
      'Un peritaje de piso antes de comprar es una inspección técnica de la vivienda —humedades, instalación eléctrica, fontanería y estructura— hecha por un perito verificado que trabaja para ti, no para el vendedor. Recibes un informe con fotos para decidir o negociar el precio antes de firmar las arras. El pago queda retenido en escrow.',
    serviceName: 'Peritaje pre-compra de vivienda',
    checksTitle: 'Qué revisa el perito',
    checks: [
      'Humedades y filtraciones: paredes, techos, baños y puntos ciegos que el vendedor no enseña',
      'Instalación eléctrica: cuadro, cableado, tomas de tierra y antigüedad real',
      'Fontanería y saneamiento: presión, desagües, calentador y estado de las conducciones',
      'Estructura y cerramientos: grietas, forjados, aluminosis y carpintería exterior',
      'Ventilación y aislamiento: condensaciones, puentes térmicos y ruido',
      'Entorno del edificio: zonas comunes, cubierta, fachada y posibles derramas a la vista',
    ],
    faqs: [
      {
        question: '¿Cuánto cuesta un peritaje de piso antes de comprar?',
        answer:
          'Cada perito fija su tarifa y la ves antes de reservar; compara varios profesionales de la zona en el mapa. Frente al precio de una vivienda —o de una derrama sorpresa— es un seguro muy barato.',
      },
      {
        question: '¿Qué diferencia hay con la tasación del banco?',
        answer:
          'La tasación valora el inmueble para la hipoteca; no busca defectos. El peritaje pre-compra inspecciona el estado real de la vivienda: humedades, instalaciones, estructura. Son cosas distintas y complementarias.',
      },
      {
        question: '¿Puede ir el perito si yo no estoy en la ciudad?',
        answer:
          'Sí. Coordinas la visita con el vendedor o la agencia, el perito inspecciona la vivienda y tú recibes el informe con fotos sin moverte. Ideal si compras a distancia.',
      },
      {
        question: '¿El informe me sirve para negociar el precio?',
        answer:
          'Es su mejor uso: un informe técnico con defectos documentados y fotos es un argumento objetivo para pedir una rebaja o exigir reparaciones antes de firmar las arras.',
      },
    ],
  },
  {
    slug: 'inspeccion-moto-segunda-mano',
    shortName: 'Moto',
    footerLabel: 'Inspección de moto de segunda mano',
    seoTitle: 'Inspección de moto de segunda mano por un experto | Inspecciono',
    seoDescription:
      'Antes de pagar por una moto usada, un mecánico verificado la revisa: chasis, motor, kms reales y siniestros. Informe en pocos días.',
    ogTitle: 'Que un experto revise esa moto antes de que la pagues',
    eyebrow: 'Motos de segunda mano',
    h1: 'Inspección de moto de segunda mano por un experto',
    intro:
      'En una moto usada, una caída mal reparada o un chasis tocado no se ven en fotos — y te juegas algo más que dinero. Un mecánico verificado la inspecciona donde esté y te dice la verdad sobre su estado antes de que pagues.',
    answerFirst:
      'Una inspección de moto de segunda mano es una revisión presencial en la que un mecánico verificado comprueba chasis, motor, kilómetros reales, caídas ocultas y documentación antes de que pagues, y te entrega un informe con fotos en pocos días. En Inspecciono buscas al experto por el mapa y el pago queda retenido hasta tu visto bueno.',
    serviceName: 'Inspección pre-compra de moto de segunda mano',
    checksTitle: 'Qué revisa el mecánico',
    checks: [
      'Chasis y horquilla: alineación, marcas de caída y reparaciones ocultas',
      'Motor: arranque en frío, humos, ruidos, fugas y estado del embrague',
      'Kilometraje real: desgaste de estriberas, puños y transmisión frente al cuadro',
      'Parte ciclo: rodamientos, suspensiones, frenos y estado de neumáticos',
      'Electrónica: luces, cuadro, arranque y errores de diagnosis',
      'Documentación: ITV, cargas y coherencia de número de bastidor',
    ],
    faqs: [
      {
        question: '¿Cuánto cuesta inspeccionar una moto de segunda mano?',
        answer:
          'El precio lo fija cada mecánico y lo ves antes de reservar. Compara expertos cerca de la moto en el mapa; suele costar mucho menos que cambiar una horquilla doblada que nadie te contó.',
      },
      {
        question: '¿Detecta si la moto ha tenido caídas?',
        answer:
          'Es uno de los puntos centrales: marcas en semimanillares, estriberas y cárteres, alineación de chasis y horquilla, y piezas nuevas donde no tocaría. Una caída mal reparada compromete la seguridad.',
      },
      {
        question: '¿El experto se desplaza hasta el vendedor?',
        answer:
          'Sí. Eliges expertos por la ubicación de la moto y el mecánico va a inspeccionarla en persona, aunque tú estés en otra ciudad.',
      },
      {
        question: '¿Cuándo cobra el experto?',
        answer:
          'El pago queda retenido en escrow al reservar y el experto solo lo cobra cuando recibes el informe y das el visto bueno. Si la inspección no se realiza, se te devuelve.',
      },
    ],
  },
  {
    slug: 'peritaje-maquinaria-segunda-mano',
    shortName: 'Maquinaria',
    footerLabel: 'Peritaje de maquinaria',
    seoTitle: 'Peritaje de maquinaria de segunda mano en toda España | Inspecciono',
    seoDescription:
      'Tractor, carretilla o maquinaria industrial: un técnico verificado la inspecciona in situ y te entrega un informe antes de cerrar la compra.',
    ogTitle: 'Que un técnico revise esa máquina antes de cerrar el trato',
    eyebrow: 'Maquinaria e industrial',
    h1: 'Peritaje de maquinaria de segunda mano',
    intro:
      'Un tractor, una carretilla o una máquina industrial de ocasión puede costar decenas de miles de euros — y venir con horas trucadas, hidráulica cansada o un mantenimiento inexistente. Un técnico verificado la inspecciona in situ y te entrega un informe antes de que cierres la compra.',
    answerFirst:
      'Un peritaje de maquinaria de segunda mano es una inspección in situ —tractor, carretilla o máquina industrial— donde un técnico verificado comprueba horas reales, motor, hidráulica y estructura antes de que cierres la compra, y te entrega un informe con fotos y valoración. En Inspecciono lo reservas por ubicación y el pago queda en escrow.',
    serviceName: 'Peritaje pre-compra de maquinaria de segunda mano',
    checksTitle: 'Qué revisa el técnico',
    checks: [
      'Horas de uso reales: coherencia entre cuentahoras, desgaste y mantenimiento',
      'Motor y transmisión: arranque, humos, fugas, ruidos y respuesta bajo carga',
      'Sistema hidráulico: presión, latiguillos, cilindros y pérdidas',
      'Estructura y bastidor: fisuras, soldaduras no originales y puntos de fatiga',
      'Elementos de trabajo: implementos, mástil, cazo o aperos según la máquina',
      'Documentación: marcado CE, mantenimiento, cargas y procedencia',
    ],
    faqs: [
      {
        question: '¿Qué tipo de maquinaria se puede peritar?',
        answer:
          'Agrícola (tractores, cosechadoras), de manutención (carretillas elevadoras, plataformas), obra pública e industrial. Si tiene motor u horas de trabajo, un técnico puede revisarla antes de que la compres.',
      },
      {
        question: '¿El técnico se desplaza a naves o fincas?',
        answer:
          'Sí. La inspección se hace donde está la máquina: nave del vendedor, finca o parque de maquinaria. Buscas técnicos por esa ubicación y comparas precios en el mapa.',
      },
      {
        question: '¿Qué incluye el informe?',
        answer:
          'Estado real de motor, hidráulica, estructura y elementos de trabajo, con fotos, horas estimadas reales y la valoración del técnico. La base para comprar tranquilo o renegociar el precio.',
      },
      {
        question: '¿Cómo funciona el pago?',
        answer:
          'Reservas con el precio cerrado y el dinero queda retenido en escrow. El técnico cobra cuando tienes el informe y das el visto bueno; si la inspección no llega a realizarse, se te devuelve.',
      },
    ],
  },
  {
    slug: 'inspeccion-bici-electrica-segunda-mano',
    shortName: 'Bici eléctrica',
    footerLabel: 'Inspección de bici eléctrica',
    seoTitle: 'Inspección de bici eléctrica de 2ª mano (batería, motor) | Inspecciono',
    seoDescription:
      'Un técnico verificado comprueba el estado real de la batería, el motor y la electrónica de tu bici eléctrica usada antes de que pagues.',
    ogTitle: 'Que un técnico revise esa e-bike antes de que la pagues',
    eyebrow: 'Bicis eléctricas',
    h1: 'Inspección de bici eléctrica de segunda mano',
    intro:
      'En una e-bike usada, el dinero está en lo que no se ve: una batería degradada o un motor cansado convierten una ganga en un pisapapeles de 2.000 €. Un técnico verificado comprueba la salud real de batería, motor y electrónica antes de que pagues.',
    answerFirst:
      'Una inspección de bici eléctrica de segunda mano comprueba lo que no se ve: la salud real de la batería (ciclos y capacidad restante), el motor, la electrónica y el cuadro. La hace un técnico verificado y te entrega un informe antes de que pagues. En Inspecciono buscas al experto por el mapa y pagas en escrow.',
    serviceName: 'Inspección pre-compra de bicicleta eléctrica',
    checksTitle: 'Qué revisa el técnico',
    checks: [
      'Salud de la batería: capacidad real, ciclos de carga y estado de las celdas',
      'Motor: ruidos, holguras, temperatura y entrega de potencia en prueba',
      'Electrónica: display, controladora, sensores y errores de diagnosis',
      'Cuadro: fisuras, reparaciones y estado de la zona del motor',
      'Transmisión y frenos: desgaste de cadena, piñones, pastillas y discos',
      'Kilometraje y procedencia: coherencia del desgaste y número de serie',
    ],
    faqs: [
      {
        question: '¿Cómo se comprueba la salud de la batería?',
        answer:
          'Con la diagnosis del sistema (ciclos de carga y capacidad restante cuando la marca lo permite) y una prueba real de autonomía y entrega de potencia. Es el componente más caro de la bici: cambiarla puede costar más de 500 €.',
      },
      {
        question: '¿Merece la pena para una bici de 1.500 €?',
        answer:
          'Es justo donde más sentido tiene: la inspección cuesta una pequeña parte del precio y te libra de comprar una batería agotada o un motor al final de su vida. También te da argumentos para negociar.',
      },
      {
        question: '¿El técnico va a ver la bici por mí?',
        answer:
          'Sí. Buscas técnicos por la ubicación de la bici y el experto la revisa en persona, aunque el vendedor esté en otra ciudad.',
      },
      {
        question: '¿Cuándo se paga?',
        answer:
          'Al reservar, con el dinero retenido en escrow: el técnico cobra cuando recibes el informe y das el visto bueno. Si la inspección no se realiza, se te devuelve.',
      },
    ],
  },
];

export const CATEGORY_LANDING_BY_SLUG: Record<string, CategoryLandingConfig> = Object.fromEntries(
  CATEGORY_LANDINGS.map((c) => [c.slug, c]),
);
