import React, { Suspense, lazy, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, FileText, ShieldCheck, Cookie, Mail } from 'lucide-react';
import { Footer } from '../components/Footer';
import { FAQ } from '../components/FAQ';
import { LoginModal } from '../components/LoginModal';
import { useAuth } from '../contexts/AuthContext';
import { HP_PANEL_GRADIENT, SD_PAGE_INNER_MAX_CLASS } from '../constants/homepageTypography';
import { COMO_FUNCIONA_STEPS } from '../content/comoFuncionaContent';
import { SOBRE_INTRO, SOBRE_MISION } from '../content/sobreContent';
import { FAQ_ITEMS, SUPPORT_EMAIL } from '../content/faqContent';
import { SEO } from '../components/SEO';
import { aboutPageSchema, howToSchema, faqPageSchema, breadcrumbSchema } from '../utils/jsonLd';

const MobileBottomBar = lazy(() =>
  import('../components/MobileBottomBar').then((m) => ({ default: m.MobileBottomBar })),
);

const SECTIONS = [
  { id: 'sobre', label: 'Sobre nosotros' },
  { id: 'como-funciona', label: 'Cómo funciona' },
  { id: 'preguntas', label: 'Preguntas frecuentes' },
  { id: 'legal', label: 'Legal y contacto' },
];

const CentroAyudaPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const handleMisRevisiones = () => {
    if (isAuthenticated) {
      navigate('/hires');
      return;
    }
    sessionStorage.setItem('redirectAfterLogin', '/hires');
    setShowLoginDialog(true);
  };

  const jsonLd = [
    aboutPageSchema('https://inspecciono.com/help'),
    howToSchema(
      'Cómo funciona Inspecciono',
      'Contrata un perito verificado para revisar lo que vas a comprar: 4 pasos sencillos con pago seguro en escrow.',
      COMO_FUNCIONA_STEPS.map((s) => ({ name: s.title, text: s.body })),
    ),
    faqPageSchema(FAQ_ITEMS.map((it) => ({ question: it.question, answer: it.answer }))),
    breadcrumbSchema([
      { name: 'Inicio', url: '/' },
      { name: 'Centro de Ayuda', url: '/help' },
    ]),
  ];

  return (
    <div className="min-h-screen bg-surface-tinted font-display text-ink-strong">
      <SEO
        title="Centro de Ayuda · Inspecciono — quiénes somos, cómo funciona y FAQ"
        description="Todo en un sitio: quiénes somos, cómo funciona Inspecciono en 4 pasos con pago seguro, preguntas frecuentes y acceso a términos y privacidad actualizados."
        canonical="/help"
        ogTitle="Centro de Ayuda — Inspecciono"
        ogDescription="Quiénes somos, cómo funciona, preguntas frecuentes y documentación legal en una sola página."
        jsonLd={jsonLd}
      />

      {/* Header propio SOLO en móvil (en desktop el topbar global ya es la cabecera).
          🐛 FIX ["Centro de Ayuda" repetido en móvil]: esta barra decía exactamente lo mismo
          que el H1 del Hero, unos px más abajo — mismo texto, dos veces seguidas (reportado
          por el usuario con captura). Las páginas hermanas de este mismo patrón (cabecera
          móvil + hero: CategoryLandingPage/CityLandingPage/CoverageHubPage) NUNCA repiten:
          la barra muestra una etiqueta corta y distinta (`config.shortName`), el Hero lleva
          el H1 completo (`config.h1`). Aquí "Ayuda" (barra) vs "Centro de Ayuda" (Hero) sigue
          el mismo patrón. De paso, esta barra pasa de `<h1>` a `<p>`: no es un encabezado de
          página, es una etiqueta de navegación — el H1 real y único vive en el Hero (visible
          en TODOS los tamaños; antes en desktop, con esta barra `md:hidden`, la página no
          tenía ningún h1 en absoluto). */}
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-sm md:hidden">
        <div className="flex h-12 items-center gap-2 px-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-strong hover:bg-surface-tinted"
            aria-label="Volver"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <p className="text-base font-semibold tracking-[-0.02em]">Ayuda</p>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-line" style={{ background: HP_PANEL_GRADIENT }}>
        <div className={`${SD_PAGE_INNER_MAX_CLASS} px-4 py-8 md:px-6 md:py-12 lg:py-14`}>
          {/* 🐛 FIX [Inspecciono duplicado]: había un eyebrow "Inspecciono" justo aquí, que en
              desktop repetía la marca a los pocos px del wordmark "Inspecciono." ya visible en
              la topbar global (HomepageDesktopTopBar variant="plain" showLogo, App.tsx) — dos
              veces el mismo texto en el primer scroll. El eyebrow no aportaba nada que la
              topbar no dijera ya, así que se quita en vez de renombrarlo. */}
          <h1 className="max-w-2xl font-display text-2xl font-semibold leading-tight tracking-[-0.03em] text-ink-strong md:text-[2rem]">
            Centro de Ayuda
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-muted md:text-base">
            Quiénes somos, cómo funciona la plataforma y respuestas a las dudas más habituales.
            Todo en un mismo sitio.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={() => navigate('/')} className="sd-btn-primary min-w-0 px-5">
              Explorar expertos
            </button>
            <button
              type="button"
              onClick={handleMisRevisiones}
              className="inline-flex h-12 items-center justify-center rounded-full border border-ink-strong bg-white px-5 text-sm font-semibold text-ink-strong transition-colors hover:bg-surface-tinted"
            >
              Mis revisiones
            </button>
          </div>
        </div>
      </section>

      {/* Sub-nav pegajoso de anclas.
          🐛 FIX [subnav oculta]: iba con `top-0`, igual que la cabecera móvil (también
          top-0, z-40 > z-30 de este nav) → al hacer scroll ambas se apilaban en el MISMO
          rectángulo y la cabecera tapaba el nav por completo (verificado: a scrollY=900
          quedaba invisible). `top-[49px]` reserva la altura real de la cabecera móvil
          (h-12 + border = 49px) para que el nav se enganche justo DEBAJO, no encima. En
          desktop no hay cabecera propia (md:hidden), así que vuelve a top-0. */}
      <nav className="sticky top-[49px] z-30 border-b border-line bg-white/95 backdrop-blur-sm md:top-0">
        <div className={`${SD_PAGE_INNER_MAX_CLASS} flex gap-1 overflow-x-auto px-4 py-2 md:px-6`}>
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold text-ink-muted transition-colors hover:bg-surface-tinted hover:text-ink-strong"
            >
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      <main className={`${SD_PAGE_INNER_MAX_CLASS} px-4 py-8 pb-24 md:px-6 md:py-10 md:pb-16`}>
        {/* Sección: Sobre nosotros */}
        <section id="sobre" aria-labelledby="sobre-heading" className="scroll-mt-28">
          <h2 id="sobre-heading" className="hp-section-title mb-2">Sobre Inspecciono</h2>
          <p className="mb-4 max-w-2xl text-sm leading-relaxed text-ink-muted">{SOBRE_INTRO}</p>
          <h3 className="mt-6 text-base font-semibold text-ink-strong">Nuestra misión</h3>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-muted">{SOBRE_MISION}</p>
        </section>

        {/* Sección: Cómo funciona */}
        <section id="como-funciona" aria-labelledby="cf-steps-heading" className="mt-12 scroll-mt-28 border-t border-line pt-8">
          <h2 id="cf-steps-heading" className="hp-section-title mb-2">Cómo funciona · en 4 pasos</h2>
          <p className="mb-6 max-w-2xl text-sm leading-relaxed text-ink-muted">
            Un flujo sencillo pensado para que sepas qué pasa en cada momento, sin letra pequeña.
          </p>
          {/* 🐛 FIX [sección interminable en móvil]: cada tarjeta apilaba insignia numérica
              (8x8) → icono (9x9) → título → cuerpo, 4 bloques en vertical (149-169px cada
              una, medido). "Por qué confiar" y "Legal y contacto" (más abajo) ya resuelven lo
              mismo con icono a la izquierda + texto a la derecha en una sola fila (87px). Unificar
              los pasos al mismo patrón: el número pasa a insignia pequeña en la esquina del
              icono (mismo idioma visual que el punto verde "en directo" del chat) en vez de un
              círculo aparte. Con esto la sección completa baja de 1465px a un tercio menos en
              móvil, y las 3 secciones de la página comparten POR FIN el mismo lenguaje visual. */}
          <ol className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {COMO_FUNCIONA_STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3 rounded-lg border border-line bg-white px-4 py-3 shadow-sm">
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-tinted text-ink-muted" aria-hidden>
                  <step.Icon className="h-4 w-4" strokeWidth={2} />
                  <span className="absolute -bottom-1 -right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-brand text-[10px] font-bold leading-none text-white ring-2 ring-white">
                    {index + 1}
                  </span>
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-ink-strong">{step.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-8 rounded-xl border border-line bg-white p-5 md:p-6">
            <h3 className="text-base font-semibold text-ink-strong">¿Eres revisor profesional?</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Publica tus servicios, define tu zona y cobra con pagos seguros cuando el cliente confirma el trabajo.
            </p>
            <button
              type="button"
              onClick={() => navigate('/expert/join')}
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
            >
              Quiero ser experto
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </section>

        {/* Sección: Preguntas frecuentes */}
        <section id="preguntas" className="mt-12 scroll-mt-28 border-t border-line pt-8">
          <FAQ fullWidth />
        </section>

        {/* Sección: Legal y contacto */}
        <section id="legal" aria-labelledby="legal-heading" className="mt-12 scroll-mt-28 border-t border-line pt-8">
          <h2 id="legal-heading" className="hp-section-title mb-2">Legal y contacto</h2>
          <p className="mb-4 max-w-2xl text-sm leading-relaxed text-ink-muted">
            Nuestros términos y nuestra política de privacidad se mantienen siempre actualizados:
            su contenido se carga directamente desde nuestro servidor.
          </p>
          <ul className="grid gap-3 sm:grid-cols-3">
            <li>
              <a href="/legal/terms" className="flex h-full gap-3 rounded-lg border border-line bg-white px-4 py-3 transition-colors hover:bg-surface-tinted">
                <FileText className="h-5 w-5 shrink-0 text-brand" aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-strong">Términos y condiciones</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">Las reglas de uso de la plataforma.</p>
                </div>
              </a>
            </li>
            <li>
              <a href="/legal/privacy" className="flex h-full gap-3 rounded-lg border border-line bg-white px-4 py-3 transition-colors hover:bg-surface-tinted">
                <ShieldCheck className="h-5 w-5 shrink-0 text-brand" aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-strong">Política de privacidad</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">Cómo tratamos tus datos.</p>
                </div>
              </a>
            </li>
            <li>
              <a href="/cookies" className="flex h-full gap-3 rounded-lg border border-line bg-white px-4 py-3 transition-colors hover:bg-surface-tinted">
                <Cookie className="h-5 w-5 shrink-0 text-brand" aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-strong">Política de cookies</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">Qué cookies usamos y por qué.</p>
                </div>
              </a>
            </li>
          </ul>

          <div className="mt-6 flex items-center gap-3 rounded-lg border border-line bg-white px-4 py-3">
            <Mail className="h-5 w-5 shrink-0 text-brand" aria-hidden />
            <p className="text-sm text-ink-muted">
              ¿Necesitas ayuda?{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-brand hover:underline">
                {SUPPORT_EMAIL}
              </a>
            </p>
          </div>
        </section>
      </main>

      <Footer />

      <div className="md:hidden">
        <Suspense fallback={null}>
          <MobileBottomBar />
        </Suspense>
      </div>

      <LoginModal
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        onSuccess={() => {
          setShowLoginDialog(false);
          const redirect = sessionStorage.getItem('redirectAfterLogin');
          sessionStorage.removeItem('redirectAfterLogin');
          navigate(redirect || '/hires');
        }}
      />
    </div>
  );
};

export default CentroAyudaPage;
