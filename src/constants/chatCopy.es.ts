export const PRE_HIRE_CHAT_COPY = {
  trustBannerInline:
    'Acuerda fecha y detalles de la visita en este chat. Todo queda registrado en Inspecciono.',
  trustBannerAck: 'Entendido',
  reconnecting: 'Sincronizando mensajes…',
  offlineSend: 'Sin conexión en vivo. Los mensajes se envían por la plataforma.',
  emptyTitle: 'Pregunta antes de contratar',
  emptyBody:
    'Resuelve dudas sobre disponibilidad, alcance del servicio o zona de trabajo antes de continuar.',
  emptyTrust: 'La contratación y el pago se gestionan de forma segura en Inspecciono.',
  suggestedQuestions: [
    '¿Tienes disponibilidad esta semana?',
    '¿Qué incluye exactamente el servicio?',
    '¿Trabajas en mi zona?',
    '¿Cuánto tarda la entrega del informe?',
  ] as const,
  inputPlaceholder: 'Escribe un mensaje…',
  inputHelp: 'Enter envía · Mayús+Enter nueva línea',
  typing: (name: string) => `${name} está escribiendo`,
  hireCta: 'Contratar ahora',
} as const;
