#!/usr/bin/env node
/**
 * 🌐 Guarda de i18n (sin framework de tests). Falla el build si:
 *   1. Las claves de es.json y en.json no son simétricas (un idioma mostraría la clave cruda).
 *   2. Una clave `stripe.*` literal referenciada en el código (t('...') / i18n.t('...')) no existe
 *      en es.json (typo → el experto vería "stripe.status.foo.title" en pantalla).
 *
 * Solo cubre claves ESTÁTICAS; las dinámicas (`stripe.status.${x}.kicker`) se omiten (no casan el
 * regex) y su existencia queda cubierta por la simetría es↔en. Ejecutado antes de `vite build`.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const localesDir = join(root, 'src', 'i18n', 'locales');
const srcDir = join(root, 'src');

const flatten = (obj, prefix = '') =>
    Object.entries(obj).flatMap(([k, v]) =>
        v && typeof v === 'object' ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`]
    );

const es = JSON.parse(readFileSync(join(localesDir, 'es.json'), 'utf8'));
const en = JSON.parse(readFileSync(join(localesDir, 'en.json'), 'utf8'));
const esKeys = new Set(flatten(es));
const enKeys = new Set(flatten(en));

const errors = [];

// 1) Simetría es↔en.
for (const k of esKeys) if (!enKeys.has(k)) errors.push(`Falta en en.json: ${k}`);
for (const k of enKeys) if (!esKeys.has(k)) errors.push(`Falta en es.json: ${k}`);

// 2) Claves stripe.* estáticas referenciadas en el código que no existen en es.json (canónico).
const walk = (dir) => {
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        const st = statSync(p);
        if (st.isDirectory()) {
            if (name === 'node_modules' || name === 'locales') continue;
            walk(p);
        } else if (/\.(ts|tsx)$/.test(name)) {
            const code = readFileSync(p, 'utf8');
            const rx = /\bt\(\s*['"](stripe\.[\w.]+)['"]/g;
            // Una clave base de plural (p.ej. deadlineDays) es válida si existe su forma _one/_other.
            const PLURAL_SUFFIXES = ['_zero', '_one', '_two', '_few', '_many', '_other'];
            const keyExists = (k) => esKeys.has(k) || PLURAL_SUFFIXES.some((s) => esKeys.has(k + s));
            let m;
            while ((m = rx.exec(code))) {
                if (!keyExists(m[1])) errors.push(`Clave i18n inexistente referenciada en ${name}: ${m[1]}`);
            }
        }
    }
};
walk(srcDir);

if (errors.length) {
    console.error('❌ Comprobación i18n fallida:\n' + errors.map((e) => '  - ' + e).join('\n'));
    process.exit(1);
}
console.log(`✅ i18n OK: ${esKeys.size} claves simétricas es↔en, claves stripe.* estáticas válidas.`);
