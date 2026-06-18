import React, { Suspense, lazy, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, FileText, ShieldCheck, Cookie, Mail } from 'lucide-react';
import { Footer } from '../components/Footer';
import { FAQ } from '../components/FAQ';
import { LoginModal } from '../components/LoginModal';
import { useAuth } from '../contexts/AuthContext';
import { HP_PANEL_GRADIENT, SD_PAGE_INNER_MAX_CLASS } from '../constants/homepageTypography';
import { COMO_FUNCIONA_STEPS, COMO_FUNCIONA_TRUST } from '../content/comoFuncionaContent';
import { SOBRE_INTRO, SOBRE_MISION, SOBRE_VALORES } from '../content/sobreContent';
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
      navigate('/busquedas');
      return;
    }
    sessionStorage.setItem('redirectAfterLogin', '/busquedas');
    setShowLoginDialog(true);
  };

  const jsonLd = [
    aboutPageSchema('https://inspecciono.com/ayuda'),
    howToSchema(
      'Cómo funciona Inspecciono',
      'Contrata un perito verificado para revisar lo que vas a comprar: 4 pasos sencillos con pago seguro en escrow.',
      COMO_FUNCIONA_STEPS.map((s) => ({ name: s.title, text: s.body })),
    ),
    faqPageSchema(FAQ_ITEMS.map((it) => ({ question: it.question, answer: it.answer }))),
    breadcrumbSchema([
      { name: 'Inicio', url: '/' },
      { name: 'Centro de Ayuda', url: '/ayuda' },
    ]),
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] font-display text-[#1c1c1c]">
      <SEO
        title="Centro de Ayuda · Inspecciono — quiénes somos, cómo funciona y FAQ"
        description="Todo en un sitio: quiénes somos, cómo funciona Inspecciono en 4 pasos con pago seguro, preguntas frecuentes y acceso a términos y privacidad actualizados."
        canonical="/ayuda"
        ogTitle="Centro de Ayuda — Inspecciono"
        ogDescription="Quiénes somos, cómo funciona, preguntas frecuentes y documentación legal en una sola página."
        jsonLd={jsonLd}
      />

      {/* Header propio SOLO en móvil (en desktop el topbar global ya es la cabecera). */}
      <header className="sticky top-0 z-40 border-b border-[#e8e8e8] bg-white/95 backdrop-blur-sm md:hidden">
        <div className="flex h-12 items-center gap-2 px-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#1c1c1c] hover:bg-[#f5f5f5]"
            aria-label="Volver"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-semibold tracking-[-0.02em]">Centro de Ayuda</h1>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-[#e8e8e8]" style={{ background: HP_PANEL_GRADIENT }}>
        <div className={`${SD_PAGE_INNER_MAX_CLASS} px-4 py-8 md:px-6 md:py-12 lg:py-14`}>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">Inspecciono</p>
          <h2 className="mt-2 max-w-2xl font-display text-2xl font-semibold leading-tight tracking-[-0.03em] text-[#1c1c1c] md:text-[2rem]">
            Centro de Ayuda
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#6a6a6a] md:text-base">
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
              className="inline-flex h-12 items-center justify-center rounded-full border border-[#1c1c1c] bg-white px-5 text-sm font-semibold text-[#1c1c1c] transition-colors hover:bg-[#f7f7f7]"
            >
              Mis revisiones
            </button>
          </div>
        </div>
      </section>

      {/* Sub-nav pegajoso de anclas */}
      <nav className="sticky top-0 z-30 border-b border-[#e8e8e8] bg-white/95 backdrop-blur-sm">
        <div className={`${SD_PAGE_INNER_MAX_CLASS} flex gap-1 overflow-x-auto px-4 py-2 md:px-6`}>
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold text-[#6a6a6a] transition-colors hover:bg-[#f5f5f5] hover:text-[#1c1c1c]"
            >
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      <main className={`${SD_PAGE_INNER_MAX_CLASS} px-4 py-8 pb-24 md:px-6 md:py-10 md:pb-16`}>
        {/* Sección: Sobre nosotros */}
        <section id="sobre" aria-labelledby="sobre-heading" className="scroll-mt-24">
          <h2 id="sobre-heading" className="hp-section-title mb-2">Sobre Inspecciono</h2>
          <p className="mb-4 max-w-2xl text-sm leading-relaxed text-[#6a6a6a]">{SOBRE_INTRO}</p>
          <h3 className="mt-6 text-base font-semibold text-[#1c1c1c]">Nuestra misión</h3>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[#6a6a6a]">{SOBRE_MISION}</p>
          <h3 className="mt-6 text-base font-semibold text-[#1c1c1c]">Nuestros valores</h3>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {SOBRE_VALORES.map((v) => (
              <li key={v.titulo} className="rounded-lg border border-[#ebebeb] bg-white px-4 py-3">
                <p className="text-sm font-semibold text-[#1c1c1c]">{v.titulo}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-[#6a6a6a]">{v.texto}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Sección: Cómo funciona */}
        <section id="como-funciona" aria-labelledby="cf-steps-heading" className="mt-12 scroll-mt-24 border-t border-[#e8e8e8] pt-8">
          <h2 id="cf-steps-heading" className="hp-section-title mb-2">Cómo funciona · en 4 pasos</h2>
          <p className="mb-6 max-w-2xl text-sm leading-relaxed text-[#6a6a6a]">
            Un flujo sencillo pensado para que sepas qué pasa en cada momento, sin letra pequeña.
          </p>
          <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {COMO_FUNCIONA_STEPS.map((step, index) => (
              <li key={step.title} className="relative rounded-xl border border-[#e8e8e8] bg-white p-4 shadow-sm">
                <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#f0f6fc] text-xs font-bold text-brand">
                  {index + 1}
                </span>
                <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#fafafa] text-[#6a6a6a]" aria-hidden>
                  <step.Icon className="h-4 w-4" strokeWidth={2} />
                </div>
                <h3 className="text-sm font-semibold text-[#1c1c1c]">{step.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#6a6a6a]">{step.body}</p>
              </li>
            ))}
          </ol>

          <h3 className="hp-section-title mb-2 mt-10">Por qué confiar</h3>
          <ul className="grid gap-3 sm:grid-cols-3">
            {COMO_FUNCIONA_TRUST.map((item) => (
              <li key={item.title} className="flex gap-3 rounded-lg border border-[#ebebeb] bg-white px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fafafa] text-brand">
                  <item.Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1c1c1c]">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#6a6a6a]">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 rounded-xl border border-[#e8e8e8] bg-white p-5 md:p-6">
            <h3 className="text-base font-semibold text-[#1c1c1c]">¿Eres revisor profesional?</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#6a6a6a]">
              Publica tus servicios, define tu zona y cobra con pagos seguros cuando el cliente confirma el trabajo.
            </p>
            <button
              type="button"
              onClick={() => navigate('/become-expert')}
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
            >
              Quiero ser experto
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </section>

        {/* Sección: Preguntas frecuentes */}
        <section id="preguntas" className="mt-12 scroll-mt-24 border-t border-[#e8e8e8] pt-8">
          <FAQ />
        </section>

        {/* Sección: Legal y contacto */}
        <section id="legal" aria-labelledby="legal-heading" className="mt-12 scroll-mt-24 border-t border-[#e8e8e8] pt-8">
          <h2 id="legal-heading" className="hp-section-title mb-2">Legal y contacto</h2>
          <p className="mb-4 max-w-2xl text-sm leading-relaxed text-[#6a6a6a]">
            Nuestros términos y nuestra política de privacidad se mantienen siempre actualizados:
            su contenido se carga directamente desde nuestro servidor.
          </p>
          <ul className="grid gap-3 sm:grid-cols-3">
            <li>
              <a href="/terms.html" className="flex h-full gap-3 rounded-lg border border-[#ebebeb] bg-white px-4 py-3 transition-colors hover:bg-[#fafafa]">
                <FileText className="h-5 w-5 shrink-0 text-brand" aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1c1c1c]">Términos y condiciones</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#6a6a6a]">Las reglas de uso de la plataforma.</p>
                </div>
              </a>
            </li>
            <li>
              <a href="/privacy-policy.html" className="flex h-full gap-3 rounded-lg border border-[#ebebeb] bg-white px-4 py-3 transition-colors hover:bg-[#fafafa]">
                <ShieldCheck className="h-5 w-5 shrink-0 text-brand" aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1c1c1c]">Política de privacidad</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#6a6a6a]">Cómo tratamos tus datos.</p>
                </div>
              </a>
            </li>
            <li>
              <a href="/cookies" className="flex h-full gap-3 rounded-lg border border-[#ebebeb] bg-white px-4 py-3 transition-colors hover:bg-[#fafafa]">
                <Cookie className="h-5 w-5 shrink-0 text-brand" aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1c1c1c]">Política de cookies</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#6a6a6a]">Qué cookies usamos y por qué.</p>
                </div>
              </a>
            </li>
          </ul>

          <div className="mt-6 flex items-center gap-3 rounded-lg border border-[#ebebeb] bg-white px-4 py-3">
            <Mail className="h-5 w-5 shrink-0 text-brand" aria-hidden />
            <p className="text-sm text-[#6a6a6a]">
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
          navigate(redirect || '/busquedas');
        }}
      />
    </div>
  );
};

export default CentroAyudaPage;
