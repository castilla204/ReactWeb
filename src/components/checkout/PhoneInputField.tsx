/**
 * PhoneInputField — selector de país + teléfono.
 * El dropdown se renderiza en un PORTAL a document.body para escapar de
 * contenedores con `transform` (p. ej. la animación del paso del checkout),
 * que harían que `position: fixed` se anclara mal. Banderas flagcdn.com con
 * fallback CSS. Nombres en español. Funciona en desktop y móvil.
 */
import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

// ─── Datos ───────────────────────────────────────────────────────────────────

interface CountryEntry {
  code: string;
  dial: string;
  name: string;
}

const COUNTRIES: CountryEntry[] = [
  { code: 'ES', dial: '+34',  name: 'España' },
  { code: 'MX', dial: '+52',  name: 'México' },
  { code: 'AR', dial: '+54',  name: 'Argentina' },
  { code: 'CO', dial: '+57',  name: 'Colombia' },
  { code: 'PE', dial: '+51',  name: 'Perú' },
  { code: 'CL', dial: '+56',  name: 'Chile' },
  { code: 'BR', dial: '+55',  name: 'Brasil' },
  { code: 'US', dial: '+1',   name: 'Estados Unidos' },
  { code: 'GB', dial: '+44',  name: 'Reino Unido' },
  { code: 'FR', dial: '+33',  name: 'Francia' },
  { code: 'DE', dial: '+49',  name: 'Alemania' },
  { code: 'IT', dial: '+39',  name: 'Italia' },
  { code: 'PT', dial: '+351', name: 'Portugal' },
  { code: 'MA', dial: '+212', name: 'Marruecos' },
  { code: 'DZ', dial: '+213', name: 'Argelia' },
  { code: 'TN', dial: '+216', name: 'Túnez' },
  { code: 'RO', dial: '+40',  name: 'Rumania' },
  { code: 'PL', dial: '+48',  name: 'Polonia' },
  { code: 'UA', dial: '+380', name: 'Ucrania' },
  { code: 'VE', dial: '+58',  name: 'Venezuela' },
  { code: 'EC', dial: '+593', name: 'Ecuador' },
  { code: 'BO', dial: '+591', name: 'Bolivia' },
  { code: 'PY', dial: '+595', name: 'Paraguay' },
  { code: 'UY', dial: '+598', name: 'Uruguay' },
  { code: 'DO', dial: '+1',   name: 'Rep. Dominicana' },
  { code: 'CU', dial: '+53',  name: 'Cuba' },
  { code: 'GT', dial: '+502', name: 'Guatemala' },
  { code: 'HN', dial: '+504', name: 'Honduras' },
  { code: 'NI', dial: '+505', name: 'Nicaragua' },
  { code: 'SV', dial: '+503', name: 'El Salvador' },
  { code: 'CR', dial: '+506', name: 'Costa Rica' },
  { code: 'PA', dial: '+507', name: 'Panamá' },
  { code: 'NL', dial: '+31',  name: 'Países Bajos' },
  { code: 'BE', dial: '+32',  name: 'Bélgica' },
  { code: 'CH', dial: '+41',  name: 'Suiza' },
  { code: 'AT', dial: '+43',  name: 'Austria' },
  { code: 'SE', dial: '+46',  name: 'Suecia' },
  { code: 'NO', dial: '+47',  name: 'Noruega' },
  { code: 'DK', dial: '+45',  name: 'Dinamarca' },
  { code: 'FI', dial: '+358', name: 'Finlandia' },
  { code: 'IE', dial: '+353', name: 'Irlanda' },
  { code: 'GR', dial: '+30',  name: 'Grecia' },
  { code: 'CZ', dial: '+420', name: 'Rep. Checa' },
  { code: 'HU', dial: '+36',  name: 'Hungría' },
  { code: 'SK', dial: '+421', name: 'Eslovaquia' },
  { code: 'HR', dial: '+385', name: 'Croacia' },
  { code: 'RS', dial: '+381', name: 'Serbia' },
  { code: 'BG', dial: '+359', name: 'Bulgaria' },
  { code: 'LT', dial: '+370', name: 'Lituania' },
  { code: 'LV', dial: '+371', name: 'Letonia' },
  { code: 'EE', dial: '+372', name: 'Estonia' },
  { code: 'TR', dial: '+90',  name: 'Turquía' },
  { code: 'RU', dial: '+7',   name: 'Rusia' },
  { code: 'SA', dial: '+966', name: 'Arabia Saudí' },
  { code: 'AE', dial: '+971', name: 'Emiratos Árabes' },
  { code: 'IL', dial: '+972', name: 'Israel' },
  { code: 'EG', dial: '+20',  name: 'Egipto' },
  { code: 'ZA', dial: '+27',  name: 'Sudáfrica' },
  { code: 'IN', dial: '+91',  name: 'India' },
  { code: 'PK', dial: '+92',  name: 'Pakistán' },
  { code: 'CN', dial: '+86',  name: 'China' },
  { code: 'JP', dial: '+81',  name: 'Japón' },
  { code: 'KR', dial: '+82',  name: 'Corea del Sur' },
  { code: 'AU', dial: '+61',  name: 'Australia' },
  { code: 'NZ', dial: '+64',  name: 'Nueva Zelanda' },
  { code: 'CA', dial: '+1',   name: 'Canadá' },
  { code: 'SG', dial: '+65',  name: 'Singapur' },
  { code: 'PH', dial: '+63',  name: 'Filipinas' },
];

const PINNED = new Set(['ES', 'MX', 'AR', 'CO', 'PE', 'US', 'GB', 'FR', 'DE', 'IT', 'PT', 'MA', 'RO', 'UA']);

const byCode: Record<string, CountryEntry> = {};
for (const c of COUNTRIES) byCode[c.code] = c;

function findCountry(code: string): CountryEntry {
  return byCode[code.toUpperCase()] ?? COUNTRIES[0];
}

function flagUrl(code: string) {
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
}

// ─── Búsqueda ─────────────────────────────────────────────────────────────────

function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}
function matches(c: CountryEntry, q: string) {
  const n = norm(q.trim());
  return (
    norm(c.name).includes(n) ||
    c.dial.replace('+', '').startsWith(n.replace('+', '')) ||
    c.code.toLowerCase().startsWith(n)
  );
}

// ─── FlagImg con fallback ─────────────────────────────────────────────────────

function FlagImg({ code, size = 'sm' }: { code: string; size?: 'sm' | 'md' }) {
  const [ok, setOk] = useState(true);
  const w = size === 'sm' ? 20 : 24;
  const h = size === 'sm' ? 14 : 16;

  if (!ok) {
    return (
      <span
        style={{ width: w, height: h, fontSize: 8.5 }}
        className="inline-flex shrink-0 items-center justify-center rounded-[3px] bg-[#e2e5ea] font-bold leading-none text-[#6b7280]"
      >
        {code}
      </span>
    );
  }

  return (
    <img
      src={flagUrl(code)}
      alt=""
      aria-hidden
      loading="lazy"
      width={w}
      height={h}
      onError={() => setOk(false)}
      style={{ width: w, height: h, objectFit: 'cover' }}
      className="shrink-0 rounded-[3px] shadow-[0_0_0_1px_rgba(0,0,0,0.1)]"
    />
  );
}

// ─── Fila ─────────────────────────────────────────────────────────────────────

function CountryRow({
  entry,
  selected,
  onClick,
}: {
  entry: CountryEntry;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="option"
      aria-selected={selected}
      className={cn(
        'flex w-full items-center gap-3 px-4 py-[10px] text-left transition-colors duration-100',
        'hover:bg-[#f5f6f8] focus-visible:bg-[#f5f6f8] focus-visible:outline-none',
        selected && 'bg-[#eef1fd]',
      )}
    >
      <FlagImg code={entry.code} size="sm" />
      <span className={cn('flex-1 truncate text-[13.5px] leading-none text-[#1c1c1c]', selected && 'font-semibold')}>
        {entry.name}
      </span>
      <span className="shrink-0 font-mono text-[12px] tabular-nums text-[#9ca3af]">{entry.dial}</span>
      {selected && <Check aria-hidden className="h-4 w-4 shrink-0 text-[#3d5afe]" />}
    </button>
  );
}

// ─── Posición del dropdown ────────────────────────────────────────────────────

interface DropPos {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  origin: 'top' | 'bottom';
}

// ─── PhoneInputField ─────────────────────────────────────────────────────────

export interface PhoneInputFieldProps {
  value: string;
  onChange: (e164: string) => void;
  id?: string;
  name?: string;
  autoComplete?: string;
  'aria-invalid'?: boolean;
  error?: boolean;
  className?: string;
  defaultCountry?: string;
}

export function PhoneInputField({
  value,
  onChange,
  id,
  name,
  autoComplete = 'tel',
  'aria-invalid': ariaInvalid,
  error = false,
  className,
  defaultCountry = 'ES',
}: PhoneInputFieldProps) {
  const listboxId = useId();
  const searchId = useId();

  function parseValue(v: string): { country: CountryEntry; local: string } {
    if (!v) return { country: findCountry(defaultCountry), local: '' };
    const s = v.startsWith('+') ? v : '+' + v;
    let best: CountryEntry | null = null;
    let bestLen = 0;
    for (const c of COUNTRIES) {
      if (s.startsWith(c.dial) && c.dial.length > bestLen) {
        best = c;
        bestLen = c.dial.length;
      }
    }
    if (!best) return { country: findCountry(defaultCountry), local: s };
    return { country: best, local: s.slice(best.dial.length) };
  }

  const { country: cur, local } = parseValue(value);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [pos, setPos] = useState<DropPos | null>(null);

  const wrapRef   = useRef<HTMLDivElement>(null);
  const dropRef   = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const numRef    = useRef<HTMLInputElement>(null);

  const calcPos = useCallback(() => {
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 8;
    const gap = 6;

    const dropW = Math.min(Math.max(r.width, 288), vw - margin * 2);
    let left = r.left;
    if (left + dropW > vw - margin) left = vw - dropW - margin;
    if (left < margin) left = margin;

    const spaceBelow = vh - r.bottom - gap - margin;
    const spaceAbove = r.top - gap - margin;
    const desired = 320;

    let origin: 'top' | 'bottom';
    let top: number;
    let maxHeight: number;

    if (spaceBelow >= Math.min(desired, 220) || spaceBelow >= spaceAbove) {
      // Abrir hacia abajo
      origin = 'top';
      top = r.bottom + gap;
      maxHeight = Math.min(desired, spaceBelow);
    } else {
      // Abrir hacia arriba
      origin = 'bottom';
      maxHeight = Math.min(desired, spaceAbove);
      top = r.top - gap - maxHeight;
    }

    setPos({ top, left, width: dropW, maxHeight: Math.max(maxHeight, 160), origin });
  }, []);

  const openDrop = useCallback(() => {
    calcPos();
    setOpen(true);
    setQuery('');
  }, [calcPos]);

  // Recalcula la posición de forma síncrona antes de pintar para evitar parpadeo
  useLayoutEffect(() => {
    if (open) calcPos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => searchRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); numRef.current?.focus(); }
    };
    const onOut = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!dropRef.current?.contains(t) && !wrapRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener('keydown', onEsc);
    document.addEventListener('mousedown', onOut);
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.removeEventListener('mousedown', onOut);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const upd = () => calcPos();
    window.addEventListener('scroll', upd, true);
    window.addEventListener('resize', upd);
    return () => {
      window.removeEventListener('scroll', upd, true);
      window.removeEventListener('resize', upd);
    };
  }, [open, calcPos]);

  function select(c: CountryEntry) {
    onChange(c.dial + local);
    setOpen(false);
    setTimeout(() => numRef.current?.focus(), 40);
  }

  function handleNum(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.replace(/[^\d\s\-()+]/g, '');
    onChange(cur.dial + v);
  }

  const q = query.trim();
  const pinnedList = COUNTRIES.filter((c) => PINNED.has(c.code));
  const otherList  = COUNTRIES.filter((c) => !PINNED.has(c.code));
  const vPinned = q ? pinnedList.filter((c) => matches(c, q)) : pinnedList;
  const vOthers = q ? otherList.filter((c) => matches(c, q)) : otherList;
  const empty = vPinned.length === 0 && vOthers.length === 0;

  const hasErr = error || ariaInvalid;

  const dropdown = open && pos ? (
    <div
      ref={dropRef}
      id={listboxId}
      role="listbox"
      aria-label="Seleccionar país"
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: pos.width,
        zIndex: 99999,
        transformOrigin: pos.origin === 'top' ? 'top center' : 'bottom center',
        animation: '_pdrop 0.15s cubic-bezier(0.16,1,0.3,1) both',
      }}
      className="flex flex-col overflow-hidden rounded-2xl border border-[#e4e7ec] bg-white shadow-[0_4px_8px_-2px_rgba(0,0,0,0.08),0_16px_48px_-8px_rgba(0,0,0,0.16)]"
    >
      {/* Buscador */}
      <div className="shrink-0 border-b border-[#f0f2f5] p-2.5">
        <label htmlFor={searchId} className="sr-only">Buscar país</label>
        <div className="flex items-center gap-2 rounded-lg bg-[#f5f6f8] px-3 py-2">
          <Search aria-hidden className="h-[13px] w-[13px] shrink-0 text-[#adb5bd]" />
          <input
            ref={searchRef}
            id={searchId}
            type="text"
            placeholder="Buscar país o prefijo…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-[13px] text-[#1c1c1c] placeholder:text-[#adb5bd] outline-none"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); searchRef.current?.focus(); }}
              aria-label="Limpiar búsqueda"
              className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#d1d5db] text-[11px] font-bold leading-none text-white hover:bg-[#9ca3af] focus-visible:outline-none"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      <div className="overflow-y-auto overscroll-contain pb-1.5 pt-1" style={{ maxHeight: pos.maxHeight }}>
        {empty ? (
          <p className="px-4 py-8 text-center text-[13px] text-[#adb5bd]">
            Sin resultados para «{query}»
          </p>
        ) : (
          <>
            {!q && vPinned.length > 0 && (
              <>
                <p className="px-4 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#c8ccd4]">
                  Frecuentes
                </p>
                {vPinned.map((c) => (
                  <CountryRow key={c.code} entry={c} selected={c.code === cur.code} onClick={() => select(c)} />
                ))}
                {vOthers.length > 0 && <div className="mx-4 my-1.5 border-t border-[#f0f2f5]" />}
              </>
            )}
            {q && vPinned.map((c) => (
              <CountryRow key={c.code} entry={c} selected={c.code === cur.code} onClick={() => select(c)} />
            ))}
            {vOthers.map((c) => (
              <CountryRow key={c.code} entry={c} selected={c.code === cur.code} onClick={() => select(c)} />
            ))}
          </>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <style>{`
        @keyframes _pdrop{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
        @media(prefers-reduced-motion:reduce){@keyframes _pdrop{from{opacity:0}to{opacity:1}}}
      `}</style>

      <div ref={wrapRef} className={cn('relative w-full', className)}>
        <div
          className={cn(
            'flex h-12 w-full items-stretch overflow-hidden rounded-full bg-[#f4f5f7] ring-1 transition-[box-shadow] duration-150',
            hasErr
              ? 'ring-red-400/70'
              : open
              ? 'ring-[#3d5afe]/40'
              : 'ring-[#e9eaed] focus-within:ring-[#3d5afe]/30',
          )}
        >
          {/* Botón país */}
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={open ? listboxId : undefined}
            aria-label={`País ${cur.name}, prefijo ${cur.dial}`}
            onClick={() => (open ? setOpen(false) : openDrop())}
            className={cn(
              'flex shrink-0 items-center gap-1.5 pl-4 pr-2.5',
              'border-r border-[#e4e6ea] bg-white',
              'transition-colors duration-100',
              'hover:bg-[#f7f8fa] active:bg-[#eef0f3]',
              'focus-visible:outline-none focus-visible:bg-[#f0f3ff]',
            )}
          >
            <FlagImg code={cur.code} size="sm" />
            <span className="font-mono text-[12.5px] font-semibold tracking-tight text-[#374151]">
              {cur.dial}
            </span>
            <ChevronDown
              aria-hidden
              className={cn('-ml-0.5 h-3.5 w-3.5 text-[#adb5bd] transition-transform duration-200', open && 'rotate-180')}
            />
          </button>

          {/* Número */}
          <input
            ref={numRef}
            id={id}
            name={name}
            type="tel"
            inputMode="tel"
            autoComplete={autoComplete}
            aria-invalid={ariaInvalid}
            value={local}
            onChange={handleNum}
            placeholder="600 000 000"
            className="flex-1 bg-transparent px-3.5 text-[14px] text-[#1c1c1c] outline-none placeholder:text-[#c0c4cc]"
          />
        </div>
      </div>

      {/* Portal: escapa de ancestros con transform (animación del paso) */}
      {typeof document !== 'undefined' && dropdown
        ? createPortal(dropdown, document.body)
        : null}
    </>
  );
}
