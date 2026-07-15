import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Renderer ligero (sin dependencias) para las respuestas del asistente.
 * El backend instruye al modelo a responder en párrafos cortos o listas, y a
 * citar rutas de la plataforma (/faq, /busquedas…) y soporte@inspecciono.com.
 * Aquí convertimos eso en markdown mínimo + enlaces navegables dentro de la SPA.
 */

/** Rutas internas sin parámetro que el asistente menciona y podemos enlazar. */
const INTERNAL_ROUTES = [
  '/faq',
  '/busquedas',
  '/expert/join',
  '/help',
  '/hires',
  '/favorites',
  '/legal/privacy',
  '/',
] as const;

const ROUTE_ALT = INTERNAL_ROUTES.map((r) => r.replace('/', '\\/')).join('|');

// Orden importa: negrita › ruta interna › email › url suelta.
const INLINE_PATTERN = new RegExp(
  [
    '(\\*\\*[^*]+\\*\\*)', // **negrita**
    `((?:${ROUTE_ALT})\\b)`, // /ruta-interna
    '([\\w.+-]+@[\\w-]+\\.[\\w.-]+)', // email
    '(https?:\\/\\/[^\\s)]+)', // url
  ].join('|'),
  'g',
);

const linkClass =
  'font-medium text-brand underline decoration-brand/30 underline-offset-2 transition-colors hover:decoration-brand';

function safeHttpUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null;
  } catch {
    return null;
  }
}

function renderInline(
  text: string,
  onNavigate: () => void,
  keyBase: string,
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  INLINE_PATTERN.lastIndex = 0;
  let i = 0;

  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    const [, bold, route, email, url] = match;
    const k = `${keyBase}-${i++}`;

    if (bold) {
      nodes.push(
        <strong key={k} className="font-semibold text-ink-strong">
          {bold.slice(2, -2)}
        </strong>,
      );
    } else if (route) {
      // <Link>, no <button>: es navegación real (abrible en pestaña nueva, anunciada como enlace).
      nodes.push(
        <Link key={k} to={route} onClick={onNavigate} className={linkClass}>
          {route}
        </Link>,
      );
    } else if (email || url) {
      // No tragar la puntuación final de la frase (".", ",", ")"…).
      let value = (email || url) as string;
      let trailing = '';
      while (value.length > 0 && '.,;:!?)'.includes(value[value.length - 1])) {
        trailing = value[value.length - 1] + trailing;
        value = value.slice(0, -1);
      }
      if (email) {
        nodes.push(
          <a key={k} href={`mailto:${value}`} className={linkClass}>
            {value}
          </a>,
        );
      } else {
        const href = safeHttpUrl(value);
        nodes.push(
          href ? (
            <a
              key={k}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              {value}
            </a>
          ) : (
            value
          ),
        );
      }
      if (trailing) nodes.push(trailing);
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

const LIST_ITEM = /^\s*(?:[-*•]|\d+[.)])\s+(.*)$/;

interface Block {
  type: 'p' | 'ul' | 'ol';
  lines: string[];
}

/**
 * Agrupa el texto línea a línea en párrafos y listas. Reconoce el caso habitual
 * "Pasos:\n- a\n- b" (línea de introducción seguida de viñetas) como párrafo + lista.
 */
function toBlocks(raw: string): Block[] {
  const blocks: Block[] = [];
  const lines = raw.replace(/\r\n/g, '\n').split('\n');

  let para: string[] = [];
  let list: Block | null = null;

  const flushPara = () => {
    if (para.length) {
      blocks.push({ type: 'p', lines: para });
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push(list);
      list = null;
    }
  };

  for (const line of lines) {
    if (line.trim().length === 0) {
      flushPara();
      flushList();
      continue;
    }
    const m = line.match(LIST_ITEM);
    if (m) {
      flushPara();
      const type: Block['type'] = /^\s*\d+[.)]/.test(line) ? 'ol' : 'ul';
      if (!list || list.type !== type) {
        flushList();
        list = { type, lines: [] };
      }
      list.lines.push(m[1]);
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushPara();
  flushList();
  return blocks;
}

interface AssistantMessageProps {
  content: string;
  /** Cierra el drawer al navegar a una ruta interna. */
  onClose: () => void;
}

export const AssistantMessage: React.FC<AssistantMessageProps> = ({ content, onClose }) => {
  const blocks = toBlocks(content);

  return (
    <div className="space-y-2">
      {blocks.map((block, bi) => {
        if (block.type === 'p') {
          return (
            <p key={bi} className="leading-relaxed">
              {block.lines.map((line, li) => (
                <React.Fragment key={li}>
                  {li > 0 && <br />}
                  {renderInline(line, onClose, `${bi}-${li}`)}
                </React.Fragment>
              ))}
            </p>
          );
        }
        const ListTag = block.type === 'ol' ? 'ol' : 'ul';
        return (
          <ListTag
            key={bi}
            className={
              block.type === 'ol'
                ? 'list-decimal space-y-1 pl-[1.15rem] marker:text-ink-soft'
                : 'list-disc space-y-1 pl-[1.15rem] marker:text-line'
            }
          >
            {block.lines.map((line, li) => (
              <li key={li} className="leading-relaxed">
                {renderInline(line, onClose, `${bi}-${li}`)}
              </li>
            ))}
          </ListTag>
        );
      })}
    </div>
  );
};
