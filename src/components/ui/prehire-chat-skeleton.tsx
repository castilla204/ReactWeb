import { SileoSkeleton } from './sileo-skeleton';
import { HP_FONT } from '../../constants/homepageTypography';

/**
 * Skeleton de PreHireChatPage (chat "estilo Wallapop" pre-contratación).
 *
 * Espeja el frame REAL de la página para que el reemplazo (lazy chunk → página
 * montada) no salte de tamaño:
 *  · Root `fixed inset-0 flex flex-col overflow-hidden bg-surface-tinted` — pantalla
 *    completa tipo app, igual que la página real (que además fija --vh).
 *  · Cabecera `max-w-4xl mx-auto`: fila superior con back + identidad del experto
 *    (variante móvil compacta con CTA "Contratar" · variante desktop con nombre) +
 *    menú; y, SOLO en desktop (`hidden md:block`, para expertos), el bloque de ficha
 *    del servicio (foto 80px + nombre/estrellas/ubicación + avatar, 2 tiles, CTAs).
 *  · Cuerpo del chat `max-w-4xl mx-auto bg-white`: área de mensajes sobre
 *    `bg-surface-tinted` con burbujas alternas (izq recibidas / dcha enviadas) de
 *    ancho variable, y barra composer inferior (pill + botón enviar).
 *
 * Nota de contraste: `SileoSkeleton` rellena con `bg-surface-tinted` (#fafafa), casi
 * invisible sobre superficies claras (cabecera tintada, burbujas sobre el propio
 * tintado, composer blanco). Por eso todas las piezas fuerzan `GHOST_ON_LIGHT`.
 */
const GHOST_ON_LIGHT = 'bg-[#e4e4e4]';

/** Burbujas fantasma: alternancia izq/dcha + alto/ancho variables (ritmo de chat real). */
const BUBBLES: { mine: boolean; w: string; h: string }[] = [
  { mine: false, w: 'w-3/5', h: 'h-10' },
  { mine: true, w: 'w-1/2', h: 'h-9' },
  { mine: false, w: 'w-3/4', h: 'h-16' },
  { mine: true, w: 'w-2/5', h: 'h-8' },
  { mine: false, w: 'w-2/3', h: 'h-12' },
];

export function PreHireChatSkeleton() {
  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden bg-surface-tinted"
      style={{ fontFamily: HP_FONT }}
      aria-busy="true"
      aria-label="Cargando conversación"
    >
      {/* Cabecera: identidad del experto + acciones */}
      <div className="flex-shrink-0 border-b border-line bg-surface-tinted shadow-sm">
        <div className="mx-auto max-w-4xl">
          {/* Fila superior: back + identidad + menú */}
          <div className="flex items-center gap-1 px-2 py-2 md:px-4 md:py-1.5">
            <SileoSkeleton className={`h-10 w-10 shrink-0 ${GHOST_ON_LIGHT}`} rounded="full" />

            {/* Identidad — móvil (avatar + nombre/ubicación + CTA "Contratar") */}
            <div className="flex min-w-0 flex-1 items-center gap-2.5 md:hidden">
              <SileoSkeleton className={`h-9 w-9 shrink-0 ${GHOST_ON_LIGHT}`} rounded="full" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <SileoSkeleton className={`h-4 w-32 max-w-[60%] rounded ${GHOST_ON_LIGHT}`} />
                <SileoSkeleton className={`h-3 w-24 max-w-[45%] rounded ${GHOST_ON_LIGHT}`} />
              </div>
              <SileoSkeleton className={`ml-auto h-8 w-24 shrink-0 ${GHOST_ON_LIGHT}`} rounded="full" />
            </div>

            {/* Identidad — desktop (avatar + nombre) */}
            <div className="ml-4 hidden flex-1 items-center gap-3 md:flex">
              <SileoSkeleton className={`h-10 w-10 shrink-0 ${GHOST_ON_LIGHT}`} rounded="full" />
              <SileoSkeleton className={`h-4 w-40 rounded ${GHOST_ON_LIGHT}`} />
            </div>

            <SileoSkeleton className={`h-10 w-10 shrink-0 ${GHOST_ON_LIGHT}`} rounded="full" />
          </div>

          {/* Ficha del servicio — solo desktop (hidden md:block) */}
          <div className="hidden md:block">
            <div className="px-4 py-2.5">
              <div className="mb-2.5 flex items-start gap-4">
                <SileoSkeleton className={`h-20 w-20 shrink-0 ${GHOST_ON_LIGHT}`} rounded="lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <SileoSkeleton className={`h-4 w-32 rounded ${GHOST_ON_LIGHT}`} />
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <SileoSkeleton
                        key={i}
                        className={`h-3.5 w-3.5 ${GHOST_ON_LIGHT}`}
                        rounded="sm"
                      />
                    ))}
                    <SileoSkeleton className={`ml-1 h-3.5 w-14 rounded ${GHOST_ON_LIGHT}`} />
                  </div>
                  <SileoSkeleton className={`h-3.5 w-28 rounded ${GHOST_ON_LIGHT}`} />
                </div>
                <SileoSkeleton className={`h-10 w-10 shrink-0 ${GHOST_ON_LIGHT}`} rounded="full" />
              </div>

              {/* 2 tiles (ubicación + ver zona) */}
              <div className="mb-2.5 grid grid-cols-2 gap-2">
                <SileoSkeleton className={`h-9 w-full ${GHOST_ON_LIGHT}`} rounded="xl" />
                <SileoSkeleton className={`h-9 w-full ${GHOST_ON_LIGHT}`} rounded="xl" />
              </div>

              <div className="my-2.5 border-t border-line" />

              {/* Barra de botones (Favorito + Contratar) */}
              <div className="flex items-center gap-2">
                <SileoSkeleton className={`h-10 flex-1 ${GHOST_ON_LIGHT}`} rounded="full" />
                <SileoSkeleton className={`h-10 flex-1 ${GHOST_ON_LIGHT}`} rounded="full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cuerpo del chat: mensajes + composer (espeja PreHireChat embebido) */}
      <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col overflow-hidden bg-white">
        {/* Área de mensajes (mismo fondo punteado que el chat real) */}
        <div className="min-h-0 flex-1 overflow-hidden bg-surface-tinted px-3 py-4 [background-image:radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.04)_1px,transparent_0)] [background-size:20px_20px] sm:px-4">
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
            {BUBBLES.map((b, i) => (
              <div key={i} className={b.mine ? 'flex justify-end' : 'flex justify-start'}>
                <SileoSkeleton
                  className={`${b.h} ${b.w} ${
                    b.mine ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm'
                  } ${GHOST_ON_LIGHT}`}
                  rounded="none"
                  shimmerDelayMs={i * 90}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Composer inferior (pill + botón enviar) */}
        <div className="relative z-10 shrink-0 border-t border-line bg-white px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom,0px))] sm:px-4">
          <div className="flex items-end gap-1.5 rounded-[1.5rem] border border-line bg-surface-tinted py-1.5 pl-3.5 pr-1.5">
            <SileoSkeleton className={`h-6 flex-1 rounded ${GHOST_ON_LIGHT}`} />
            <SileoSkeleton className={`h-9 w-9 shrink-0 ${GHOST_ON_LIGHT}`} rounded="full" />
          </div>
        </div>
      </div>
    </div>
  );
}
