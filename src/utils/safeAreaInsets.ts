/** Lee env(safe-area-inset-bottom) de forma fiable en iOS/Android. */
export function getSafeAreaInsetBottom(): number {
    if (typeof document === 'undefined') return 0;

    const probe = document.createElement('div');
    probe.style.cssText =
        'position:fixed;bottom:0;left:0;width:0;height:0;visibility:hidden;pointer-events:none;padding-bottom:env(safe-area-inset-bottom,0px);';
    document.body.appendChild(probe);
    const value = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
    document.body.removeChild(probe);
    return value;
}

/** Margen inferior del tutorial — simétrico al header y con extra en pantallas bajas. */
export function getTutorialDrawerBottomBuffer(viewportH: number): number {
    const safe = getSafeAreaInsetBottom();
    const base = viewportH <= 667 ? 18 : viewportH <= 812 ? 16 : viewportH <= 896 ? 14 : 12;
    return base + safe;
}

/** Fracción del viewport para el drawer tutorial según altura real del contenido. */
export function clampTutorialDrawerSnap(totalPx: number, viewportH: number): number {
    if (viewportH <= 0) return 0.48;
    const frac = totalPx / viewportH;
    // iPhone SE y similares necesitan más %; antes el techo 50 % recortaba el texto.
    const maxFrac =
        viewportH <= 667 ? 0.64 : viewportH <= 812 ? 0.58 : viewportH <= 896 ? 0.55 : 0.52;
    return Math.min(maxFrac, Math.max(0.36, Math.round(frac * 1000) / 1000));
}
