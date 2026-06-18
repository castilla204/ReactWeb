import { FileText, Video, Image as ImageIcon, Phone, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getDeliverableKind } from '../../utils/deliverableIcons';
import type { ServiceDeliverableType } from '../../utils/mapSelectedDeliverableTypes';

export type DeliverableIconVariant = 'overlay' | 'chip' | 'list';

const ICONS: Record<ReturnType<typeof getDeliverableKind>, LucideIcon> = {
  pdf: FileText,
  video: Video,
  photo: ImageIcon,
  call: Phone,
  default: FileText,
};

const ICON_SIZE: Record<DeliverableIconVariant, string> = {
  overlay: 'h-3 w-3',
  chip: 'h-3.5 w-3.5',
  list: 'h-[18px] w-[18px]',
};

interface DeliverableTypeIconProps {
  deliverable: ServiceDeliverableType;
  variant?: DeliverableIconVariant;
  className?: string;
}

/** Icono del tipo de entregable (PDF, vídeo, llamada…), en una cajita uniforme. */
export function DeliverableTypeIcon({
  deliverable,
  variant = 'chip',
  className,
}: DeliverableTypeIconProps) {
  const kind = getDeliverableKind(deliverable);
  const Icon = ICONS[kind];

  return (
    <span
      className={cn('sd-deliverable-type-badge', `sd-deliverable-type-badge--${variant}`, className)}
      aria-hidden
    >
      <Icon className={ICON_SIZE[variant]} strokeWidth={2} />
    </span>
  );
}
