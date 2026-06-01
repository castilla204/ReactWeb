import type { LucideIcon } from 'lucide-react';
import { Calendar, ClipboardCheck, MapPin, MessageCircle, Search, ShieldCheck, ShoppingBag } from 'lucide-react';

export interface ComoFuncionaStep {
  title: string;
  body: string;
  Icon: LucideIcon;
}

export const COMO_FUNCIONA_STEPS: ComoFuncionaStep[] = [
  {
    title: 'Elige un experto',
    body: 'Explora el mapa, compara precios, reseñas y zona de cobertura. Sin registro para mirar.',
    Icon: Search,
  },
  {
    title: 'Reserva con pago seguro',
    body: 'Precio cerrado. El importe queda retenido hasta que confirmes que el trabajo está bien hecho.',
    Icon: ShoppingBag,
  },
  {
    title: 'Inspección y entrega',
    body: 'Coordináis fecha y lugar por chat. Recibes fotos, vídeo e informe con conclusiones claras.',
    Icon: Calendar,
  },
  {
    title: 'Confirmas y listo',
    body: 'Si todo encaja, liberas el pago. Si cancelas antes de empezar la revisión, reembolso completo.',
    Icon: ClipboardCheck,
  },
];

export const COMO_FUNCIONA_TRUST: { title: string; body: string; Icon: LucideIcon }[] = [
  {
    title: 'Expertos verificados',
    body: 'Revisores con identidad y credenciales validadas en Inspecciono.',
    Icon: ShieldCheck,
  },
  {
    title: 'Chat antes de pagar',
    body: 'Aclara dudas con el experto tras reservar, sin compartir datos de pago por mensaje.',
    Icon: MessageCircle,
  },
  {
    title: 'Cobertura real',
    body: 'Cada servicio muestra el radio de desplazamiento y la ubicación del revisor.',
    Icon: MapPin,
  },
];
