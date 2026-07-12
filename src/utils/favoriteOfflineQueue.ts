const STORAGE_KEY = 'tp_favorite_offline_queue';

export interface PendingFavoriteToggle {
  serviceId: number;
  isFavorite: boolean;
  updatedAt: number;
}

function readQueue(): PendingFavoriteToggle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is PendingFavoriteToggle =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as PendingFavoriteToggle).serviceId === 'number' &&
        typeof (item as PendingFavoriteToggle).isFavorite === 'boolean',
    );
  } catch {
    return [];
  }
}

function writeQueue(items: PendingFavoriteToggle[]): void {
  try {
    if (items.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  } catch {
    // Quota exceeded or private browsing — ignore.
  }
}

/** Guarda un toggle optimista en localStorage para sync al reconectar. */
export function stageFavoriteToggle(serviceId: number, isFavorite: boolean): void {
  const queue = readQueue().filter((item) => item.serviceId !== serviceId);
  queue.push({ serviceId, isFavorite, updatedAt: Date.now() });
  writeQueue(queue);
}

/** Elimina un toggle pendiente tras confirmación del servidor. */
export function clearFavoriteToggle(serviceId: number): void {
  writeQueue(readQueue().filter((item) => item.serviceId !== serviceId));
}

export function getPendingFavoriteToggles(): PendingFavoriteToggle[] {
  return readQueue();
}

/** Prioriza estado local pendiente sobre el del servidor. */
export function resolveFavoriteState(serviceId: number, serverFavorite: boolean): boolean {
  const pending = readQueue().find((item) => item.serviceId === serviceId);
  return pending ? pending.isFavorite : serverFavorite;
}
