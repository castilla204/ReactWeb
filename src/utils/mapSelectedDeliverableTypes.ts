import { normalizeDeliverableLabels } from './deliverableLabels';

export type ServiceDeliverableType = {
  id?: number;
  name?: string;
  displayName?: string;
  description?: string;
  isRequired?: boolean;
  isSelected?: boolean;
  deliverableType?: {
    name?: string;
    displayName?: string;
    description?: string;
  };
};

/** Aplana DTO plano o anidado (create/update) → tipo usado en ficha/checkout. */
export function mapSelectedDeliverableType(dt: unknown): ServiceDeliverableType | null {
  if (!dt || typeof dt !== 'object') return null;
  const raw = dt as Record<string, unknown>;
  const nested = (raw.deliverableType ?? raw.DeliverableType) as Record<string, unknown> | undefined;

  const isSelected = raw.isSelected ?? raw.IsSelected;
  if (isSelected === false) return null;

  const name = String(raw.name ?? raw.Name ?? nested?.name ?? nested?.Name ?? '').trim();
  const displayName = String(
    raw.displayName ?? raw.DisplayName ?? nested?.displayName ?? nested?.DisplayName ?? ''
  ).trim();
  const description = String(
    raw.description ?? raw.Description ?? nested?.description ?? nested?.Description ?? ''
  ).trim();
  const isRequired = Boolean(raw.isRequired ?? raw.IsRequired ?? nested?.isRequired ?? nested?.IsRequired);

  if (!name && !displayName) return null;

  const id =
    (raw.id as number | undefined) ??
    (raw.Id as number | undefined) ??
    (raw.deliverableTypeId as number | undefined) ??
    (raw.DeliverableTypeId as number | undefined) ??
    (nested?.id as number | undefined) ??
    (nested?.Id as number | undefined);

  return normalizeDeliverableLabels({
    id,
    name: name || displayName,
    displayName: displayName || name,
    description: description || undefined,
    isRequired,
    isSelected: isSelected !== false,
  });
}

export function mapSelectedDeliverableTypes(list: unknown): ServiceDeliverableType[] {
  if (!Array.isArray(list)) return [];
  return list.map(mapSelectedDeliverableType).filter((dt): dt is ServiceDeliverableType => dt !== null);
}
