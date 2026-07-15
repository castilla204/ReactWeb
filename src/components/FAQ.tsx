import React, { useMemo, useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { HelpCircle, Search, X } from 'lucide-react';

import { FAQ_ITEMS, SUPPORT_EMAIL } from '../content/faqContent';

// 🛡️ Migrado a tokens de marca (antes: text-blue-600, text-gray-900/700/600/500, bg-gray-50 —
// un sistema de color distinto al resto de la página que lo incrusta, CentroAyudaPage.tsx). El
// título también bajó de text-3xl (30px) a `hp-section-title` (19-20px), la misma clase que usan
// el resto de cabeceras de sección de esa página; antes era un 50% más grande que sus vecinas.
//
// Con 41 preguntas, un acordeón plano sin filtro es mucho para escanear (cognitive load: "wall
// of options"). Añadido buscador por texto sobre pregunta y respuesta.
interface FAQProps {
  /** Corrección 2026-07-15: se asumió que este componente también se usaba en
   *  DesktopLanding.tsx (home) — FALSO, ese fichero tiene su PROPIO componente local
   *  también llamado `FAQ` (con su propia data `FAQS` y radix-accordion directo), sin
   *  relación con este. `components/FAQ.tsx` se usa en un ÚNICO sitio: CentroAyudaPage.tsx,
   *  anidado dentro de `SD_PAGE_INNER_MAX_CLASS` (max-w-[1280px]). El max-w-4xl (896px) +
   *  padding propios de abajo dejaban el FAQ visiblemente más estrecho que "Sobre
   *  nosotros"/"Cómo funciona" — bug real, confirmado en captura. `fullWidth` se deja como
   *  prop explícita (documenta la intención) aunque hoy solo exista el caso `true`. */
  fullWidth?: boolean;
}

export const FAQ: React.FC<FAQProps> = ({ fullWidth = false }) => {
  const [value, setValue] = useState<string | undefined>(undefined);
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQ_ITEMS;
    return FAQ_ITEMS.filter(
      (item) => item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className={fullWidth ? 'w-full' : 'mx-auto w-full max-w-4xl px-4 py-4'}>
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-2.5">
          <HelpCircle className="h-5 w-5 text-brand" aria-hidden />
          <h2 className="hp-section-title">Preguntas frecuentes</h2>
        </div>
        <p className="text-sm leading-relaxed text-ink-muted">
          Encuentra respuestas a las dudas más habituales sobre la plataforma.
        </p>
      </div>

      {/* Buscador: 41 preguntas es mucho para escanear una por una. */}
      <div className="relative mb-4 max-w-md">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar en las preguntas frecuentes…"
          aria-label="Buscar en las preguntas frecuentes"
          className="h-11 w-full rounded-full border border-line bg-white pl-10 pr-9 text-sm text-ink-strong placeholder:text-ink-muted transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Borrar búsqueda"
            className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted hover:bg-surface-tinted hover:text-ink-strong"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-white px-6 py-10 text-center">
          <p className="text-sm font-semibold text-ink-strong">Sin coincidencias</p>
          <p className="mt-1 text-sm text-ink-muted">
            No encontramos preguntas que contengan "{query}".{' '}
            <button
              type="button"
              onClick={() => setQuery('')}
              className="font-semibold text-brand hover:underline"
            >
              Ver todas
            </button>
          </p>
        </div>
      ) : (
        <>
          {query && (
            <p className="mb-3 text-xs text-ink-muted" aria-live="polite">
              {filteredItems.length} de {FAQ_ITEMS.length} preguntas
            </p>
          )}
          <Accordion
            type="single"
            collapsible
            value={value}
            onValueChange={setValue}
            className="w-full space-y-2.5"
          >
            {filteredItems.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="rounded-xl border border-line bg-white px-4 shadow-sm transition-colors hover:bg-surface-tinted/60 sm:px-5"
              >
                <AccordionTrigger className="py-3.5 text-left text-sm font-semibold text-ink-strong hover:no-underline sm:py-4">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-sm leading-relaxed text-ink-muted">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </>
      )}

      <div className="mt-8 text-center">
        <p className="text-sm text-ink-muted">
          ¿No encuentras la respuesta que buscas?{' '}
          {/* 🐛 FIX [enlace roto]: antes href="#" + preventDefault + comentario "aquí puedes
              agregar lógica..." — un stub sin terminar que no hacía nada al pulsarlo. La misma
              página ya tiene un mailto funcional (sección Legal y contacto); reusamos esa vía. */}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="font-semibold text-brand underline-offset-2 hover:underline"
          >
            Contáctanos
          </a>
        </p>
      </div>
    </div>
  );
};
