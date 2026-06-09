export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const SUPPORT_EMAIL = 'soporte@inspecciono.com';

/** FAQ unificado — página /faq y referencia para el chatbot */
export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'price',
    question: '¿Cuánto cuesta una revisión?',
    answer:
      'Desde 25 €. El precio depende de la categoría, la distancia y el alcance. Se muestra cerrado antes de aceptar; no hay sorpresas después.',
  },
  {
    id: 'platform-fee',
    question: '¿Hay algún costo por usar la plataforma?',
    answer:
      'Para los clientes, no hay costes ocultos. Solo pagas el precio acordado con el experto. La plataforma cobra una pequeña comisión al experto por cada transacción completada.',
  },
  {
    id: 'report-time',
    question: '¿En cuánto tiempo recibo el informe?',
    answer:
      'La media es 24 horas desde que el experto hace la inspección. En urgencias, el mismo día. Se entrega como PDF con fotos y un vídeo corto.',
  },
  {
    id: 'payments',
    question: '¿Cómo se procesan los pagos?',
    answer:
      'Utilizamos Stripe. El pago se mantiene en custodia hasta que confirmes que el servicio se completó correctamente. Así te proteges y solo liberas el importe cuando estás satisfecho.',
  },
  {
    id: 'cancel',
    question: '¿Puedo cancelar un servicio contratado?',
    answer:
      'Sí. Puedes cancelar sin coste antes de que el experto lo acepte. Si ya lo aceptó, aplican las políticas de cancelación. Si cancelas antes de que empiece la revisión, reembolso completo.',
  },
  {
    id: 'dispute',
    question: '¿Qué pasa si no estoy satisfecho con el servicio?',
    answer:
      'Puedes abrir una disputa. Nuestro equipo revisará el caso y, cuando proceda, procesará reembolsos parciales o completos. El pago retenido existe precisamente para protegerte.',
  },
  {
    id: 'experts',
    question: '¿Cómo funciona la verificación de expertos?',
    answer:
      'Validación de identidad, comprobación de experiencia profesional y revisión de sus primeras inspecciones. Las reseñas de clientes completan la confianza.',
  },
  {
    id: 'become-expert',
    question: '¿Cómo puedo convertirme en experto?',
    answer:
      'Crea una cuenta, completa el registro como experto, aporta credenciales y pasa la verificación de identidad. Una vez aprobado, puedes publicar servicios en /become-expert.',
  },
  {
    id: 'response-time',
    question: '¿Cuánto tarda un experto en responder?',
    answer:
      'Los expertos suelen responder en un plazo de 24 horas, según categoría y disponibilidad. Puedes ver el tiempo medio de respuesta en el perfil del experto.',
  },
  {
    id: 'coverage',
    question: '¿Hacéis revisiones fuera de España?',
    answer:
      'Sí, operamos en más de 50 países. La cobertura más densa está en España, Portugal, Francia, Italia y México.',
  },
  {
    id: 'support',
    question: '¿Cómo puedo contactar con el soporte?',
    answer:
      'Por este chat, por correo en soporte@inspecciono.com o mediante la mensajería dentro de cada servicio contratado.',
  },
];

export const CHATBOT_WELCOME_MESSAGE =
  'Hola, soy el asistente de Inspecciono. Puedo ayudarte con dudas sobre inspecciones, pagos, cancelaciones o cómo contratar un experto.';

export const CHATBOT_SUGGESTED_QUESTIONS = [
  '¿Cómo funciona el pago retenido?',
  '¿Cuánto cuesta una revisión?',
  '¿Puedo cancelar si cambio de opinión?',
  '¿Cómo me hago experto?',
] as const;
