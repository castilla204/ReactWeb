const SERVICE_RETURN_PATH_KEY = 'servicePageReturnTo';

const BLOCKED_RETURN_PREFIXES = ['/checkout', '/inquiry'];

export function isBlockedServiceReturnPath(path: string): boolean {
  return BLOCKED_RETURN_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function normalizeServiceReturnPath(path: string | null | undefined): string | null {
  if (!path || typeof path !== 'string') return null;
  if (!path.startsWith('/')) return null;
  if (isBlockedServiceReturnPath(path)) return null;
  return path;
}

export function persistServiceReturnPath(path: string): void {
  const normalized = normalizeServiceReturnPath(path);
  if (!normalized) return;
  sessionStorage.setItem(SERVICE_RETURN_PATH_KEY, normalized);
}

export function readServiceReturnPath(): string {
  const stored = normalizeServiceReturnPath(sessionStorage.getItem(SERVICE_RETURN_PATH_KEY));
  return stored ?? '/';
}

export function resolveServiceReturnPath(stateReturnTo: unknown): string {
  const fromState = normalizeServiceReturnPath(
    typeof stateReturnTo === 'string' ? stateReturnTo : null,
  );
  if (fromState) return fromState;
  return readServiceReturnPath();
}
