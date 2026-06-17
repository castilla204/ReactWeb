import React from 'react';
import { cn } from '../../lib/utils';
import { getDeliverableKind } from '../../utils/deliverableIcons';
import type { ServiceDeliverableType } from '../../utils/mapSelectedDeliverableTypes';

export type DeliverableIconVariant = 'overlay' | 'chip' | 'list';

const BADGE_LABEL: Record<ReturnType<typeof getDeliverableKind>, string> = {
  pdf: 'PDF',
  video: 'VID',
  photo: 'FOT',
  default: 'DOC',
};

interface DeliverableTypeIconProps {
  deliverable: ServiceDeliverableType;
  variant?: DeliverableIconVariant;
  className?: string;
}

/** Etiqueta tipográfica del tipo de archivo (sin ilustración). */
export function DeliverableTypeIcon({
  deliverable,
  variant = 'chip',
  className,
}: DeliverableTypeIconProps) {
  const kind = getDeliverableKind(deliverable);
  const label = BADGE_LABEL[kind];

  return (
    <span
      className={cn('sd-deliverable-type-badge', `sd-deliverable-type-badge--${variant}`, className)}
      aria-hidden
    >
      {label}
    </span>
  );
}
