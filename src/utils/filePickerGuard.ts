/** Evita que useBodyScrollSafety restaure el body mientras el selector de archivos del SO está abierto. */
let activeUntil = 0;

export function markFilePickerOpening(durationMs = 10000) {
  activeUntil = Date.now() + durationMs;
}

export function isFilePickerActive(): boolean {
  return Date.now() < activeUntil;
}

/** Renueva el guard al volver el foco si hay un drawer de formulario abierto. */
export function extendFilePickerGuardIfDrawerOpen(durationMs = 3000) {
  if (document.body.dataset.drawerOpen) {
    markFilePickerOpening(durationMs);
  }
}
