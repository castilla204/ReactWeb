export const PRE_HIRE_CHAT_COPY = {
  trustBannerInline:
    'Acuerda fecha y detalles de la visita en este chat. Todo queda registrado en Inspecciono.',
  trustBannerAck: 'Entendido',
  reconnecting: 'Sincronizando mensajes…',
  offlineSend: 'Sin conexión en vivo. Los mensajes se envían por la plataforma.',
  emptyTitle: 'Consulta a un experto antes de contratar',
  emptyBody:
    'Conversa directamente con el experto para validar disponibilidad, alinear expectativas y definir el alcance antes de formalizar el servicio.',
  emptyTrust: 'Tu tranquilidad es nuestra prioridad. El pago se mantiene bloqueado hasta la finalización satisfactoria del servicio.',
  suggestedQuestions: [
    '¿Estás disponible esta semana?',
    '¿Qué incluye el servicio?',
    '¿Ofreces servicios en mi zona?',
    '¿Cuánto tiempo tarda la entrega del informe?',
  ] as const,
  inputPlaceholder: 'Escribe un mensaje…',
  inputHelp: 'Enter envía · Mayús+Enter nueva línea',
  typing: (name: string) => `${name} está escribiendo`,
  hireCta: 'Contratar ahora',
} as const;
