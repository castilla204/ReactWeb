import { useEffect, useRef } from 'react';
import { isFilePickerActive, extendFilePickerGuardIfDrawerOpen } from '../utils/filePickerGuard';

function isElementVisible(el: HTMLElement): boolean {
    const styles = window.getComputedStyle(el);
    return (
        styles.display !== 'none' &&
        styles.visibility !== 'hidden' &&
        styles.opacity !== '0'
    );
}

/** Detecta capas modales abiertas (Radix Dialog, Vaul drawer, drawers con dataset). */
function hasOpenModalLayers(): boolean {
    if (document.body.dataset.drawerOpen) {
        return true;
    }

    const selectors = [
        '[role="dialog"][data-state="open"]:not([aria-hidden="true"])',
        '[data-vaul-drawer][data-state="open"]',
        '[data-vaul-overlay][data-state="open"]',
    ];

    for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
            if (isElementVisible(el as HTMLElement)) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Hook para manejar el bloqueo del scroll del body de forma segura
 * Previene que el body quede bloqueado si el componente se desmonta inesperadamente
 */
export function useBodyScrollLock(isLocked: boolean) {
    const lockCountRef = useRef(0);

    useEffect(() => {
        if (isLocked) {
            lockCountRef.current += 1;
            const originalOverflow = document.body.style.overflow;
            const originalPosition = document.body.style.position;
            const originalWidth = document.body.style.width;

            document.body.style.overflow = 'hidden';
            
            // Solo establecer position fixed si no está ya establecido por otro componente
            if (!document.body.style.position) {
                document.body.style.position = 'fixed';
                document.body.style.width = '100%';
            }

            return () => {
                lockCountRef.current -= 1;
                
                // Solo restaurar si no hay otros locks activos
                if (lockCountRef.current <= 0) {
                    document.body.style.overflow = originalOverflow || '';
                    document.body.style.position = originalPosition || '';
                    document.body.style.width = originalWidth || '';
                    lockCountRef.current = 0;
                }
            };
        }
    }, [isLocked]);
}

/**
 * Función para limpiar overlays huérfanos que bloquean clicks
 * DESACTIVADA - React gestiona automáticamente los overlays de Dialog/Drawer
 * Eliminar elementos manualmente causa errores de removeChild
 */
function cleanupOrphanOverlays() {
    // DESACTIVADO: React gestiona automáticamente los overlays de Radix UI/Vaul
    // Eliminar elementos manualmente causa errores de removeChild cuando React
    // intenta desmontar componentes que ya fueron eliminados
    // 
    // En su lugar, confiamos en que React limpie correctamente los overlays
    // cuando los componentes se desmontan, y solo restauramos el scroll del body
    // si no hay modales abiertos
    
    return 0;
}

/**
 * Hook global de seguridad para restaurar el body si queda bloqueado
 * Se ejecuta una vez al montar la app
 */
export function useBodyScrollSafety() {
    useEffect(() => {
        // Función para restaurar el body
        const restoreBody = () => {
            // No tocar el scroll mientras un drawer de formulario está abierto o el file picker del SO
            if (document.body.dataset.drawerOpen) {
                return;
            }
            if (isFilePickerActive()) {
                return;
            }

            const hasOpenModals = hasOpenModalLayers();
            
            // Verificar overlays visibles de Stripe
            const stripeOverlays = document.querySelectorAll('[class*="fixed"][class*="inset-0"][class*="z-[9999]"]');
            let hasVisibleStripeOverlay = false;
            stripeOverlays.forEach((overlay) => {
                const styles = window.getComputedStyle(overlay);
                if (styles.opacity !== '0' && styles.display !== 'none' && styles.visibility !== 'hidden') {
                    hasVisibleStripeOverlay = true;
                }
            });
            
            // Verificar otros overlays con z-50 que están visibles
            const otherOverlays = document.querySelectorAll('[class*="fixed"][class*="inset-0"][class*="z-50"]');
            let hasVisibleOtherOverlay = false;
            otherOverlays.forEach((overlay) => {
                const styles = window.getComputedStyle(overlay);
                const dataState = (overlay as HTMLElement).getAttribute('data-state');
                if (dataState === 'open' && 
                    styles.opacity !== '0' && 
                    styles.display !== 'none' && 
                    styles.visibility !== 'hidden') {
                    hasVisibleOtherOverlay = true;
                }
            });
            
            if (!hasOpenModals && !hasVisibleStripeOverlay && !hasVisibleOtherOverlay && document.body.style.overflow === 'hidden') {
                // Si no hay modales abiertos pero el body está bloqueado, restaurarlo
                console.warn('[BodyScrollSafety] Restoring body scroll - no modals detected');
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.width = '';
            }
        };

        // Función para detectar clicks bloqueados (mejorada)
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            
            // Detectar cualquier elemento interactivo, no solo botones
            const isClickable = target.tagName === 'BUTTON' || 
                              target.tagName === 'A' || 
                              target.tagName === 'INPUT' ||
                              target.tagName === 'SELECT' ||
                              target.closest('button') !== null ||
                              target.closest('a') !== null ||
                              target.closest('[role="button"]') !== null ||
                              target.closest('[role="link"]') !== null ||
                              target.closest('[role="tab"]') !== null ||
                              target.closest('[role="menuitem"]') !== null ||
                              target.getAttribute('role') === 'button' ||
                              target.getAttribute('onclick') !== null ||
                              target.style.cursor === 'pointer' ||
                              window.getComputedStyle(target).cursor === 'pointer';
            
            if (document.body.dataset.drawerOpen || isFilePickerActive()) {
                return;
            }

            if (isClickable) {
                // Verificar si hay overlays invisibles bloqueando
                const blockingOverlays = document.elementsFromPoint(e.clientX, e.clientY);
                let hasBlockingOverlay = false;
                
                blockingOverlays.forEach((element) => {
                    const el = element as HTMLElement;
                    const styles = window.getComputedStyle(el);
                    const hasFixedInset0 = el.classList.contains('fixed') && 
                                          (el.classList.contains('inset-0') || 
                                           (styles.position === 'fixed' && 
                                            styles.top === '0px' && 
                                            styles.left === '0px' && 
                                            styles.right === '0px' && 
                                            styles.bottom === '0px'));
                    
                    if (hasFixedInset0) {
                        const zIndex = parseInt(styles.zIndex) || 0;
                        const dataState = el.getAttribute('data-state');
                        const isInvisible = styles.opacity === '0' || 
                                           styles.display === 'none' || 
                                           styles.visibility === 'hidden' ||
                                           dataState === 'closed' ||
                                           el.getAttribute('aria-hidden') === 'true';
                        
                        // Si hay un overlay invisible con z-index alto bloqueando, es un problema
                        if (isInvisible && zIndex >= 50 && zIndex > parseInt(window.getComputedStyle(target).zIndex || '0')) {
                            hasBlockingOverlay = true;
                            console.warn('[BodyScrollSafety] Detected invisible overlay blocking click', el);
                            // ✅ NO eliminar manualmente - React/Radix UI lo gestiona automáticamente
                            // Eliminar manualmente causa errores de removeChild cuando React intenta desmontar
                            // En su lugar, solo marcamos que hay un overlay bloqueante para restaurar el scroll
                        }
                    }
                });
                
                const hasRealModals = hasOpenModalLayers();

                // No tocar el scroll mientras un modal/drawer está abierto
                if (!hasRealModals && (hasBlockingOverlay || document.body.style.overflow === 'hidden')) {
                    console.warn('[BodyScrollSafety] Detected blocked click - restoring body scroll');
                    restoreBody();
                }
            }
        };

        // Limpiar overlays huérfanos periódicamente (cada 1 segundo)
        const cleanupInterval = setInterval(cleanupOrphanOverlays, 1000);

        // Restaurar periódicamente (cada 2 segundos)
        const restoreInterval = setInterval(restoreBody, 2000);

        // Tras cerrar el diálogo nativo de archivos, esperar a que Vaul estabilice data-state
        const handleWindowFocus = () => {
            extendFilePickerGuardIfDrawerOpen();
            if (document.body.dataset.drawerOpen || isFilePickerActive()) {
                return;
            }
            setTimeout(() => {
                if (document.body.dataset.drawerOpen || isFilePickerActive()) {
                    return;
                }
                restoreBody();
            }, 400);
        };
        window.addEventListener('focus', handleWindowFocus);
        
        // Detectar clicks bloqueados (con timeout más corto - 50ms)
        let clickTimeout: NodeJS.Timeout | null = null;
        const clickHandler = (e: MouseEvent) => {
            if (clickTimeout) clearTimeout(clickTimeout);
            clickTimeout = setTimeout(() => handleClick(e), 50);
        };
        document.addEventListener('click', clickHandler, true);
        
        // Restaurar al desmontar
        return () => {
            clearInterval(cleanupInterval);
            clearInterval(restoreInterval);
            window.removeEventListener('focus', handleWindowFocus);
            document.removeEventListener('click', clickHandler, true);
            if (clickTimeout) clearTimeout(clickTimeout);
            // Asegurar restauración final y limpieza
            cleanupOrphanOverlays();
            restoreBody();
        };
    }, []);
}

