import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { ShieldCheck, Lock, FileText, ArrowRight } from 'lucide-react';
import { WELCOME_OPEN_EVENT } from '../lib/welcomeScreen';

/**
 * Pantalla de bienvenida de PRIMERA APERTURA — solo en la app nativa (Capacitor),
 * nunca en web. Se muestra una vez y no vuelve a aparecer (flag en localStorage, que
 * persiste en el WebView de Capacitor entre lanzamientos, sin plugin nativo extra).
 *
 * Momento de MARCA: el checkout va neutro, pero aquí sí conviene el azul de bolígrafo a
 * pantalla completa. Un solo pantallazo (no un carrusel) para llegar al valor rápido:
 * marca → qué es → CTA "Empezar". Entrada en cascada (variants) + brillo que respira.
 */

const STORAGE_KEY = 'inspecciono.welcomeSeen.v1';

function shouldShowInitially(force: boolean): boolean {
  if (force) return true;
  try {
    // Hook de DEV para previsualizar en web (se elimina del build de producción):
    // ?welcome=1 o localStorage.__welcomePreview=1 (sobrevive a redirecciones del router).
    if (
      import.meta.env.DEV &&
      (new URLSearchParams(window.location.search).has('welcome') ||
        window.localStorage.getItem('__welcomePreview') === '1')
    ) {
      return true;
    }
    if (!Capacitor.isNativePlatform()) return false;
    return window.localStorage.getItem(STORAGE_KEY) !== '1';
  } catch {
    return false;
  }
}

/**
 * Mientras la bienvenida (azul oscuro) está en pantalla, la barra de estado nativa debe
 * llevar iconos BLANCOS (Style.Dark = contenido claro) o no se verían sobre el azul. Al
 * cerrar se restaura el estilo normal de la app (Style.Light, fondo claro). No-op en web.
 */
function useNativeStatusBarOverride(active: boolean) {
  useEffect(() => {
    if (!active || !Capacitor.isNativePlatform()) return;
    let cancelled = false;
    void (async () => {
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        if (cancelled) return;
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#0066CC' }).catch(() => {});
      } catch {
        /* plugin ausente / plataforma sin barra: ignorar */
      }
    })();
    return () => {
      cancelled = true;
      void (async () => {
        try {
          const { StatusBar, Style } = await import('@capacitor/status-bar');
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: '#ffffff' }).catch(() => {});
        } catch {
          /* ignorar */
        }
      })();
    };
  }, [active]);
}

const TRUST_POINTS = [
  { icon: ShieldCheck, label: 'Expertos verificados', detail: 'peritos, mecánicos y técnicos con credenciales revisadas.' },
  { icon: Lock, label: 'Pago protegido', detail: 'el importe queda retenido hasta que apruebes el informe.' },
  { icon: FileText, label: 'Informe con pruebas', detail: 'fotos, vídeo y conclusiones claras de lo revisado.' },
] as const;

export function WelcomeScreen({ force = false }: { force?: boolean }) {
  const reduceMotion = useReducedMotion();
  const [show, setShow] = useState(() => shouldShowInitially(force));
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);

  useNativeStatusBarOverride(show);

  const dismiss = useCallback(() => {
    if (closeTimer.current) return; // ya cerrando: evita doble disparo
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
      if (import.meta.env.DEV) window.localStorage.removeItem('__welcomePreview');
    } catch {
      /* almacenamiento no disponible: aun así cerramos la pantalla */
    }
    // Anima la salida y DESMONTA de forma determinista (sin depender de onExitComplete de
    // AnimatePresence, que dejaba el overlay pegado a opacity:0 bloqueando la app).
    setClosing(true);
    closeTimer.current = setTimeout(() => setShow(false), reduceMotion ? 0 : 420);
  }, [reduceMotion]);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  // Reapertura a demanda (botón "Ver bienvenida" del menú de cuenta, web y app).
  // El componente está montado siempre (main.tsx), así que este listener vive aunque
  // la pantalla no se esté mostrando. Cancela cualquier cierre en curso y la reabre.
  useEffect(() => {
    const open = () => {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
      setClosing(false);
      setShow(true);
    };
    window.addEventListener(WELCOME_OPEN_EVENT, open);
    return () => window.removeEventListener(WELCOME_OPEN_EVENT, open);
  }, []);

  // Foco al CTA al abrir: es la única acción y el ancla para teclado/lector de pantalla.
  useEffect(() => {
    if (!show) return;
    const id = window.setTimeout(() => ctaRef.current?.focus({ preventScroll: true }), reduceMotion ? 0 : 260);
    return () => window.clearTimeout(id);
  }, [show, reduceMotion]);

  if (typeof document === 'undefined' || !show) return null;

  const ease = [0.22, 1, 0.36, 1] as const;

  // 🛡️ El contenido debe ser VISIBLE por defecto: la cascada solo ENRIQUECE. Si el documento
  // está oculto (headless, app lanzada en segundo plano) o hay reduce-motion, framer pausa la
  // animación de entrada y, si dependiéramos de opacity:0 inicial, la pantalla saldría EN BLANCO.
  // Por eso el reveal solo se activa con la pestaña visible; si no, se pinta ya en su sitio.
  const canReveal = !reduceMotion && document.visibilityState === 'visible';

  // Cascada por retardo explícito (fiable: no depende de la propagación de variants a
  // través de los <div> intermedios). Cada elemento entra un pelín después que el anterior.
  const rise = (delay: number, opts?: { scaleFrom?: number; duration?: number }) =>
    canReveal
      ? {
          initial: { opacity: 0, y: 18, ...(opts?.scaleFrom ? { scale: opts.scaleFrom } : null) },
          animate: {
            opacity: 1,
            y: 0,
            ...(opts?.scaleFrom ? { scale: 1 } : null),
            transition: { duration: opts?.duration ?? 0.55, ease, delay },
          },
        }
      : { initial: false as const, animate: { opacity: 1, y: 0, scale: 1 } };

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Bienvenido a Inspecciono"
      aria-describedby="welcome-tagline"
      className={`fixed inset-0 z-[2147483000] flex flex-col overflow-hidden bg-brand text-white ${closing ? 'pointer-events-none' : ''}`}
      style={{
        backgroundImage:
          'radial-gradient(120% 80% at 50% -10%, #1a7ae0 0%, rgba(26,122,224,0) 55%), linear-gradient(180deg, hsl(var(--brand)) 0%, #004a99 100%)',
      }}
      initial={canReveal ? { opacity: 0 } : false}
      animate={
        closing
          ? { opacity: 0, scale: reduceMotion ? 1 : 1.04, transition: { duration: reduceMotion ? 0.12 : 0.4, ease } }
          : { opacity: 1, scale: 1, transition: { duration: canReveal ? 0.4 : 0, ease } }
      }
    >
      {/* Firma sobria: un halo que respira detrás de la marca. Da profundidad sin ruido. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[26%] h-[60vw] max-h-80 w-[60vw] max-w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25 blur-[70px]"
        initial={{ opacity: 0.12 }}
        animate={
          canReveal
            ? { opacity: [0.1, 0.2, 0.1], scale: [1, 1.09, 1], transition: { duration: 7, ease: 'easeInOut', repeat: Infinity, delay: 0.3 } }
            : { opacity: 0.13 }
        }
      />

      {/* Cuerpo scrollable: se centra cuando cabe (min-h-full) y hace scroll en pantallas
          muy bajas / landscape, sin robarle sitio al CTA (que va en pie fijo). */}
      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div
          className="flex min-h-full flex-col justify-center px-7"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.75rem)', paddingBottom: '1.25rem' }}
        >
          <motion.p
            {...rise(0.12)}
            className="font-display text-[13px] font-semibold uppercase tracking-[0.24em] text-white/65"
          >
            Bienvenido a
          </motion.p>
          <motion.h1
            {...rise(0.18, { scaleFrom: 0.965, duration: 0.6 })}
            className="mt-1.5 font-display text-[clamp(2.6rem,13vw,3.4rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-white"
          >
            Inspecciono<span className="text-white/55">.</span>
          </motion.h1>
          <motion.p
            id="welcome-tagline"
            {...rise(0.28)}
            className="mt-4 max-w-[20ch] font-display text-[clamp(1.25rem,5.5vw,1.6rem)] font-semibold leading-[1.2] tracking-[-0.01em] text-white [text-wrap:balance]"
          >
            Un experto revisa lo que vas a comprar.
          </motion.p>

          <motion.ul {...rise(0.37)} className="mt-7 flex flex-col gap-3.5">
            {TRUST_POINTS.map(({ icon: Icon, label, detail }) => (
              <li key={label} className="flex items-start gap-3.5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.14] ring-1 ring-inset ring-white/15">
                  <Icon className="h-[18px] w-[18px] text-white" aria-hidden />
                </span>
                <p className="pt-0.5 font-display text-[14px] leading-snug text-white/85">
                  <span className="font-semibold text-white">{label}</span>: {detail}
                </p>
              </li>
            ))}
          </motion.ul>
        </div>
      </div>

      {/* Pie fijo: CTA. Botón blanco (invertido) sobre el azul. */}
      <motion.div
        {...rise(0.46)}
        className="relative z-10 px-7 pt-6"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)' }}
      >
        <button
          ref={ctaRef}
          type="button"
          onClick={dismiss}
          className="group inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-white px-7 font-display text-[16px] font-bold text-brand shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition-transform duration-200 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          Empezar
          <ArrowRight className="h-[18px] w-[18px] transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-active:translate-x-1 motion-reduce:transition-none" aria-hidden />
        </button>
        <p className="mt-3 text-center font-display text-caption text-white/70">
          Sin coste hasta que reserves. Explora los servicios cerca de ti.
        </p>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

export default WelcomeScreen;
