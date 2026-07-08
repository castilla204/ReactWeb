export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const SUPPORT_EMAIL = 'soporte@inspecciono.com';

/** FAQ unificado — página /faq y referencia para el chatbot (alineado con NewApi/Content/SupportChatKnowledge.cs) */
export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'what-is',
    question: '¿Qué es Inspecciono?',
    answer:
      'Inspecciono (inspecciono.com) es una plataforma que conecta a personas que quieren verificar un bien o servicio antes de comprar con expertos verificados. Cubrimos inspecciones de vehículos, viviendas y otras categorías, con informes profesionales, fotos y vídeo.',
  },
  {
    id: 'how-it-works',
    question: '¿Cómo funciona Inspecciono?',
    answer:
      'En cuatro pasos: (1) eliges un experto en el mapa comparando precio, reseñas y cobertura; (2) reservas con pago seguro — autorizamos el importe y solo se cobra cuando el experto confirma la cita; (3) coordináis la inspección y recibes informe, fotos y vídeo; (4) si todo está bien, confirmas y se libera el pago al experto.',
  },
  {
    id: 'explore-without-account',
    question: '¿Puedo mirar expertos sin registrarme?',
    answer:
      'Sí. Puedes explorar el mapa, ver fichas de servicio, precios y reseñas sin crear cuenta. Solo necesitas registrarte o iniciar sesión cuando quieras reservar, chatear con un experto o gestionar tus revisiones.',
  },
  {
    id: 'price',
    question: '¿Cuánto cuesta una revisión?',
    answer:
      'Desde 25 €. El precio depende de la categoría, la distancia, el alcance del servicio y los entregables incluidos (informe PDF, vídeo, fotos). Se muestra cerrado en la ficha del experto antes de pagar; no hay sorpresas después.',
  },
  {
    id: 'platform-fee',
    question: '¿Hay algún costo por usar la plataforma?',
    answer:
      'Para clientes no hay costes ocultos: solo pagas el precio acordado con el experto. Inspecciono cobra una comisión al experto por cada transacción completada, no al cliente.',
  },
  {
    id: 'currencies',
    question: '¿En qué moneda pago?',
    answer:
      'Cada experto fija el precio en su moneda (EUR, CHF, GBP, etc.). En la web puedes cambiar la moneda de visualización; en el checkout verás el importe que se cobrará. El pago se procesa de forma segura con Stripe.',
  },
  {
    id: 'payments',
    question: '¿Cómo se procesan los pagos?',
    answer:
      'Con Stripe. Al reservar solo autorizamos el importe en tu tarjeta; no se cobra nada hasta que el experto confirma la cita, y entonces queda en custodia. Ni Inspecciono ni el experto reciben el dinero hasta que confirmas que el servicio se completó correctamente o hasta que se resuelva una disputa.',
  },
  {
    id: 'escrow',
    question: '¿Qué significa que el pago está retenido?',
    answer:
      'Significa que tu dinero está a salvo en custodia mientras el experto realiza la inspección y entrega el informe. Solo se libera al experto cuando tú apruebas el trabajo. Si hay un problema, puedes abrir disputa antes de liberar el pago.',
  },
  {
    id: 'when-release',
    question: '¿Cuándo se libera el pago al experto?',
    answer:
      'Cuando tú confirmas que el informe y el servicio cumplen lo acordado. Hasta entonces el importe sigue retenido. Si no actúas y no hay disputa, aplican los plazos automáticos de la plataforma según el estado de la reserva.',
  },
  {
    id: 'checkout',
    question: '¿Qué pasa en el checkout?',
    answer:
      'Revisas el resumen de tu reserva (experto, servicio, precio) y autorizas el pago con Stripe. No se cobra nada hasta que el experto confirma la cita; después el importe queda retenido hasta que apruebes el informe. Puedes cancelar sin coste antes de que empiece la revisión presencial.',
  },
  {
    id: 'report-time',
    question: '¿En cuánto tiempo recibo el informe?',
    answer:
      'La media es 24 horas desde que el experto hace la inspección. En urgencias, el mismo día. Normalmente incluye PDF con fotos integradas y, según el servicio, un vídeo corto de la revisión.',
  },
  {
    id: 'deliverables',
    question: '¿Qué incluye el informe de inspección?',
    answer:
      'Depende del servicio contratado. Lo habitual: informe PDF con hallazgos y conclusiones, fotografías de las zonas revisadas y, en muchos servicios, vídeo del recorrido. En la ficha del servicio verás los chips "Informe PDF", "Vídeo", etc.',
  },
  {
    id: 'appointment',
    question: '¿Cómo coordinamos la cita de inspección?',
    answer:
      'Tras reservar, habláis por el chat de la reserva para acordar fecha, hora y lugar. Debe encajar con la disponibilidad del experto y su zona de cobertura (mapa en la ficha). No compartas datos de pago por mensaje.',
  },
  {
    id: 'pre-hire-chat',
    question: '¿Puedo hablar con el experto antes de reservar?',
    answer:
      'Sí. En la ficha del servicio puedes abrir el chat de pre-contratación para aclarar dudas sobre alcance, zona o entregables. Necesitas iniciar sesión. El pago formal se hace al reservar desde la ficha o el checkout.',
  },
  {
    id: 'messages',
    question: '¿Dónde veo mis mensajes y revisiones?',
    answer:
      'Inicia sesión y entra en "Mis revisiones" (/busquedas) para ver el estado de cada contratación. Los mensajes con el experto están en el chat de cada reserva o en la sección de mensajes de la app.',
  },
  {
    id: 'cancel',
    question: '¿Puedo cancelar un servicio contratado?',
    answer:
      'Sí. Antes de que el experto acepte o empiece la revisión presencial, suele aplicarse cancelación sin coste y reembolso completo. Si ya avanzó el servicio, aplican las políticas de cancelación según el momento y quién cancela.',
  },
  {
    id: 'cancel-change-mind',
    question: '¿Puedo cancelar si cambio de opinión?',
    answer:
      'Si la inspección aún no ha empezado, normalmente puedes cancelar con reembolso completo. Si ya hay cita acordada o el experto está en camino, revisa el estado en "Mis revisiones" o contacta soporte para ver las opciones.',
  },
  {
    id: 'expert-no-response',
    question: '¿Qué pasa si el experto no responde?',
    answer:
      'Si el experto no responde a tiempo a una reserva o propuesta, la plataforma puede cancelar automáticamente y procesar el reembolso correspondiente. Si llevas mucho tiempo esperando, escribe a soporte@inspecciono.com.',
  },
  {
    id: 'dispute',
    question: '¿Qué pasa si no estoy satisfecho con el servicio?',
    answer:
      'Puedes rechazar el informe y abrir una disputa desde tu reserva. El equipo de Inspecciono revisa el caso, escucha a ambas partes y, cuando procede, gestiona reembolso parcial o completo. El pago retenido existe para protegerte.',
  },
  {
    id: 'dispute-how',
    question: '¿Cómo abro una disputa?',
    answer:
      'Desde "Mis revisiones", entra en la contratación afectada y usa la opción de rechazar o disputar el servicio cuando el informe no cumple lo acordado. Describe el problema con detalle. No liberes el pago si no estás conforme.',
  },
  {
    id: 'approve-report',
    question: '¿Cómo apruebo el informe y cierro la reserva?',
    answer:
      'Cuando recibas el informe y estés conforme, confirma la finalización desde el detalle de tu reserva en "Mis revisiones". Eso libera el pago al experto y cierra el servicio.',
  },
  {
    id: 'categories',
    question: '¿Qué tipo de inspecciones ofrecéis?',
    answer:
      'Principalmente vehículos (coches, motos y similares) y viviendas, además de otras categorías según los expertos registrados. Cada ficha indica el tipo de servicio, entregables y radio de cobertura en el mapa.',
  },
  {
    id: 'coverage',
    question: '¿Hacéis revisiones fuera de España?',
    answer:
      'Sí, operamos en más de 50 países. La cobertura más densa está en España, Portugal, Francia, Italia y México. Si tu zona no aparece en el mapa, contacta soporte y valoraremos ampliar cobertura.',
  },
  {
    id: 'coverage-map',
    question: '¿Cómo sé si un experto llega a mi zona?',
    answer:
      'En la ficha del servicio verás su ubicación y un mapa con el radio de cobertura en kilómetros. Solo contrata expertos cuya zona incluya el lugar de la inspección.',
  },
  {
    id: 'expert-vacation',
    question: 'El experto aparece "de vacaciones", ¿qué significa?',
    answer:
      'El experto activó el modo vacaciones y no acepta nuevas reservas temporalmente. Puedes buscar otro revisor en el mapa o guardar el servicio en favoritos y volver más tarde.',
  },
  {
    id: 'experts',
    question: '¿Cómo funciona la verificación de expertos?',
    answer:
      'Validación de identidad, comprobación de experiencia profesional y revisión de sus primeras inspecciones en la plataforma. Las reseñas verificadas de otros clientes ayudan a elegir con confianza.',
  },
  {
    id: 'reviews',
    question: '¿Las reseñas son fiables?',
    answer:
      'Las opiniones provienen de clientes que completaron una contratación real en Inspecciono. En la ficha del servicio ves la nota media y el desglose de valoraciones.',
  },
  {
    id: 'favorites',
    question: '¿Puedo guardar expertos en favoritos?',
    answer:
      'Sí. Usa el icono de corazón en la ficha del servicio o entra en /favoritos para ver los servicios guardados. Necesitas iniciar sesión.',
  },
  {
    id: 'response-time',
    question: '¿Cuánto tarda un experto en responder?',
    answer:
      'Suelen responder en un plazo de 24 horas, según categoría y disponibilidad. En el perfil del experto puedes ver indicadores de actividad y tiempo de respuesta.',
  },
  {
    id: 'become-expert',
    question: '¿Cómo puedo convertirme en experto?',
    answer:
      'Crea una cuenta, ve a /become-expert, completa tu perfil profesional, verifica tu identidad y configura Stripe Connect para recibir pagos. Cuando te aprueben, podrás publicar servicios con precio, zona y entregables.',
  },
  {
    id: 'expert-stripe',
    question: '¿Por qué los expertos necesitan Stripe?',
    answer:
      'Stripe Connect permite cobrar de forma legal y segura y recibir transferencias cuando el cliente aprueba el informe. Es obligatorio para publicar servicios como experto verificado.',
  },
  {
    id: 'expert-commission',
    question: '¿Qué comisión cobra Inspecciono a los expertos?',
    answer:
      'La plataforma retiene una comisión sobre cada transacción completada; el experto ve su precio neto al configurar el servicio. Los clientes no pagan comisión extra aparte del precio del experto.',
  },
  {
    id: 'expert-vacation-mode',
    question: 'Soy experto, ¿cómo activo el modo vacaciones?',
    answer:
      'Desde tu panel de experto puedes activar el modo vacaciones para pausar nuevas reservas sin borrar tu perfil. Las contrataciones ya aceptadas deben gestionarse con normalidad.',
  },
  {
    id: 'account-login',
    question: '¿Cómo inicio sesión o creo cuenta?',
    answer:
      'Usa el botón "Iniciar sesión" o "Mi cuenta" en la web. Puedes registrarte con email o proveedores compatibles. Para reservar, chatear o ver tus revisiones necesitas estar autenticado.',
  },
  {
    id: 'mfa',
    question: '¿Qué es la verificación en dos pasos (MFA)?',
    answer:
      'Es una capa extra de seguridad para tu cuenta. Algunas áreas sensibles pueden pedirte activar MFA con una app de autenticación. Sigue las instrucciones en ajustes de cuenta si te lo solicita la plataforma.',
  },
  {
    id: 'account-deletion',
    question: '¿Puedo eliminar mi cuenta?',
    answer:
      'Sí, desde ajustes de cuenta. No podrás eliminarla si tienes dinero en vuelo (reservas activas, disputas o reembolsos pendientes). Las contrataciones abiertas se cancelan según las políticas de la plataforma.',
  },
  {
    id: 'privacy',
    question: '¿Cómo tratáis mis datos personales?',
    answer:
      'Inspecciono trata tus datos según su política de privacidad (/privacidad). Usamos la información para gestionar cuentas, pagos, mensajes y reservas. No compartas contraseñas ni datos bancarios por el chat.',
  },
  {
    id: 'scam-safety',
    question: '¿Cómo evito estafas?',
    answer:
      'Paga siempre dentro de Inspecciono con Stripe; nunca transfieras dinero por fuera. No compartas datos de tarjeta por chat. Si alguien te pide pago externo, repórtalo a soporte@inspecciono.com.',
  },
  {
    id: 'my-booking-status',
    question: '¿Puedes decirme el estado de mi reserva?',
    answer:
      'No tengo acceso a reservas concretas ni a datos de tu cuenta. Inicia sesión en /busquedas para ver el estado, los mensajes y las acciones disponibles. Para ayuda personalizada escribe a soporte@inspecciono.com con el email de tu cuenta.',
  },
  {
    id: 'support',
    question: '¿Cómo puedo contactar con el soporte?',
    answer:
      'Por este chat, por correo en soporte@inspecciono.com o mediante la mensajería dentro de cada servicio contratado. Respondemos en menos de un día laborable.',
  },
  {
    id: 'off-topic',
    question: '¿Puedes ayudarme con temas que no son de Inspecciono?',
    answer:
      'Solo puedo ayudarte con dudas sobre Inspecciono: inspecciones, reservas, pagos, expertos y uso de la plataforma. Para otros temas, consulta las fuentes adecuadas o soporte@inspecciono.com si crees que es un caso de la plataforma.',
  },
];

export const CHATBOT_EMPTY_TITLE = '¿En qué te ayudo?';

export const CHATBOT_WELCOME_MESSAGE =
  'Respondo sobre inspecciones, pagos retenidos, cancelaciones, disputas, cómo contratar un experto y cómo registrarte como revisor.';

export const CHATBOT_SUGGESTED_QUESTIONS = [
  '¿Cómo funciona el pago retenido?',
  '¿Qué incluye el informe de inspección?',
  '¿Puedo hablar con el experto antes de reservar?',
  '¿Qué pasa si no estoy satisfecho?',
  '¿Puedo cancelar si cambio de opinión?',
  '¿Cómo me hago experto?',
] as const;
