# 🌍 Migración i18n (Sprint 4)

Estado actual: **infraestructura completa + 1ª ola de keys**. Faltan ~170 strings de UI por migrar.

## Stack instalado

- `i18next@^26.3.1`
- `react-i18next@^17.0.8`
- `i18next-browser-languagedetector@^8.2.1`

## Estructura

```
src/i18n/
├── index.ts                   # Config + detector navegador → localStorage
├── locales/
│   ├── es.json                # Canónico (español, idioma fuente)
│   └── en.json                # Inglés (UK + international)
└── MIGRATION_GUIDE.md         # Este archivo
```

Inicialización: `src/main.tsx` importa `'./i18n'` antes del `createRoot`.

## Convención de keys

`namespace.section.element`:

- `common.actions.cancel` → "Cancelar" / "Cancel"
- `auth.register.submit` → "Crear cuenta" / "Create account"
- `checkout.summary.total` → "Total" / "Total"
- `expertPanel.services.priceLabel` → "Precio ({{currency}})" / "Price ({{currency}})"

Namespaces actuales:
- `common` — actions, labels, messages compartidos
- `auth` — login + register + social
- `checkout` — payment flow
- `expertPanel` — panel del experto (tabs, servicios)
- `legal` — terms, privacy, cookies, dataExport

## Uso en componentes

```tsx
import { useTranslation, Trans } from 'react-i18next';

function MiComponente() {
  const { t } = useTranslation();

  // Texto simple
  return <button>{t('common.actions.cancel')}</button>;

  // Con interpolación
  return <label>{t('expertPanel.services.priceLabel', { currency: '£' })}</label>;

  // Con elementos React (Trans component)
  return (
    <Trans i18nKey="auth.register.acceptTerms">
      Acepto los <a href="/terms.html">Términos de uso</a> y la <a href="/privacy-policy.html">Política de Privacidad</a>.
    </Trans>
  );
}
```

## Plan de migración por oleadas (prioridad)

### Ola 1 — INFRA + auth + checkout (HECHO en S4)
- [x] Instalar dependencias
- [x] `src/i18n/index.ts` con detector
- [x] `locales/es.json` y `locales/en.json` con namespaces base
- [x] Import en `main.tsx`
- [ ] **PENDIENTE**: refactorizar `LoginModal.tsx` para usar `t()` (siguiente PR)

### Ola 2 — Componentes críticos para experto UK / internacional
- [ ] `LoginModal.tsx` (registro + login + social)
- [ ] `CheckoutPage.tsx` (pagar en moneda extranjera)
- [ ] `BecomeExpertPage.tsx` (onboarding multi-país)
- [ ] `AccountSettingsModal.tsx` (eliminar cuenta + ajustes)
- [ ] `ServiceForm.tsx`, `ServicesTab.tsx`, `HiresTab.tsx` (panel experto)

### Ola 3 — Componentes secundarios
- [ ] `SearchDetails.tsx`, `SearchForm.tsx`, `SearchParameterForm.tsx`
- [ ] `MessagesPage.tsx`, `PreHireChatPage.tsx`, `Chat.tsx`
- [ ] `DisputePanel.tsx`, `RejectAppointmentModal.tsx`
- [ ] `Notification*.tsx`

### Ola 4 — Util/helpers
- [ ] `utils/countries.ts` — usar `Intl.DisplayNames(locale, {type:'region'})`
- [ ] `utils/availability.ts` — usar `Intl.DateTimeFormat(locale, {weekday:'long'})`
- [ ] `utils/timezoneFormat.ts` — usar `Intl.DateTimeFormat`
- [ ] `utils/relativeTime.ts` (NUEVO) — wrap de `Intl.RelativeTimeFormat`

### Ola 5 — Documentación + tests
- [ ] Tests E2E con `i18nextLng=en` en localStorage
- [ ] CI check de keys ausentes (script `i18next-parser`)

## Comandos útiles

```bash
# Cambiar idioma manualmente (devtools)
localStorage.setItem('i18nextLng', 'en'); location.reload();

# Listar todas las keys actuales (script para CI futuro)
grep -RhoE "t\(['\"][a-zA-Z0-9._-]+['\"]" src --include='*.tsx' | sort -u
```

## Convenciones de traducción

- **Plural en EN**: usar `_one` / `_other` postfix.
  ```json
  { "common.messages.itemCount_one": "{{count}} item", "common.messages.itemCount_other": "{{count}} items" }
  ```
- **Fechas**: siempre via `Intl.DateTimeFormat(i18n.language, ...)`. NO hardcodear `'es-ES'`.
- **Monedas**: `formatCurrency(amount, currency, i18n.language)` — el helper ya acepta locale.

## Deuda técnica registrada

- `~170 strings de UI` siguen en español hardcoded en componentes y páginas — migración progresiva.
- `utils/countries.ts:5+` tiene nombres ES hardcoded — sustituible por `Intl.DisplayNames`.
- `utils/availability.ts:18-24` tiene días de semana ES hardcoded.
- `index.html:2` declara `lang="es"` estático — debería generarse dinámicamente vía SSR/Vite plugin.

Ver `S4 i18n completo` en TaskList para tracking del progreso.
