/**
 * 🛡️ Round 28 — Sprint 4: configuración i18next.
 *
 * ESTRATEGIA
 * ----------
 * Migración progresiva. Primera fase: infra + idiomas ES (canónico) y EN (UK/international).
 * Detección automática vía navigator.language → fallback a `es-ES` para usuarios sin Accept-Language
 * conocido. El usuario puede cambiar manualmente vía LanguageContext (futuro).
 *
 * AÑADIR UN NUEVO IDIOMA:
 * 1. Crear archivo locales/<lang>.json con las mismas keys que es.json (canónico).
 * 2. Importarlo abajo y añadirlo a `resources`.
 * 3. Listar el código en `supportedLngs`.
 *
 * USO EN COMPONENTES:
 *   import { useTranslation } from 'react-i18next';
 *   const { t } = useTranslation();
 *   return <span>{t('common.cancel')}</span>;
 *
 * KEYS CONVENCIÓN: namespace.dot.path → ej. "checkout.summary.total", "common.actions.cancel".
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import es from './locales/es.json';
import en from './locales/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    fallbackLng: 'es',
    supportedLngs: ['es', 'en'],
    interpolation: {
      escapeValue: false, // React ya escapa
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    returnNull: false, // si una key no existe, devolver la propia key (visibilidad de huecos)
  });

export default i18n;
