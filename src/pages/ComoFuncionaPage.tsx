import React, { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Footer } from '../components/Footer';
import { HomepageDesktopTopBar } from '../components/HomepageDesktopTopBar';
import { useAuth } from '../contexts/AuthContext';
import { HP_PANEL_GRADIENT, SD_PAGE_INNER_MAX_CLASS } from '../constants/homepageTypography';
import { COMO_FUNCIONA_STEPS, COMO_FUNCIONA_TRUST } from '../content/comoFuncionaContent';

const MobileBottomBar = lazy(() =>
  import('../components/MobileBottomBar').then((m) => ({ default: m.MobileBottomBar })),
);

const ComoFuncionaPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#fafafa] font-display text-[#1c1c1c]">
      <HomepageDesktopTopBar />

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
          <h1 className="text-base font-semibold tracking-[-0.02em]">Cómo funciona</h1>
        </div>
      </header>

      <section
        className="border-b border-[#e8e8e8]"
        style={{ background: HP_PANEL_GRADIENT }}
      >
        <div className={`${SD_PAGE_INNER_MAX_CLASS} px-4 py-8 md:px-6 md:py-12 lg:py-14`}>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0066CC]">
            Inspecciono
          </p>
          <h2 className="mt-2 max-w-2xl font-display text-2xl font-semibold leading-tight tracking-[-0.03em] text-[#1c1c1c] md:text-[2rem]">
            Contrata revisiones con expertos verificados, con tranquilidad en cada paso
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#6a6a6a] md:text-base">
            Ideal para comprar un coche, una vivienda o un servicio importante: alguien de confianza
            va, revisa y te entrega un informe antes de decidir.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="sd-btn-primary min-w-0 px-5"
            >
              Explorar expertos
            </button>
            {!isAuthenticated ? (
              <button
                type="button"
                onClick={() => navigate('/crear-busqueda')}
                className="inline-flex h-12 items-center justify-center rounded-full border border-[#1c1c1c] bg-white px-5 text-sm font-semibold text-[#1c1c1c] transition-colors hover:bg-[#f7f7f7]"
              >
                Publicar una búsqueda
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <main className={`${SD_PAGE_INNER_MAX_CLASS} px-4 py-8 pb-24 md:px-6 md:py-10 md:pb-16`}>
        <section aria-labelledby="cf-steps-heading">
          <h2 id="cf-steps-heading" className="hp-section-title mb-2">
            En 4 pasos
          </h2>
          <p className="mb-6 max-w-2xl text-sm leading-relaxed text-[#6a6a6a]">
            Un flujo sencillo pensado para que sepas qué pasa en cada momento, sin letra pequeña.
          </p>

          <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {COMO_FUNCIONA_STEPS.map((step, index) => (
              <li
                key={step.title}
                className="relative rounded-xl border border-[#e8e8e8] bg-white p-4 shadow-sm"
              >
                <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#f0f6fc] text-xs font-bold text-[#0066CC]">
                  {index + 1}
                </span>
                <div
                  className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#fafafa] text-[#6a6a6a]"
                  aria-hidden
                >
                  <step.Icon className="h-4 w-4" strokeWidth={2} />
                </div>
                <h3 className="text-sm font-semibold text-[#1c1c1c]">{step.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#6a6a6a]">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10 border-t border-[#e8e8e8] pt-8" aria-labelledby="cf-trust-heading">
          <h2 id="cf-trust-heading" className="hp-section-title mb-2">
            Por qué confiar
          </h2>
          <ul className="grid gap-3 sm:grid-cols-3">
            {COMO_FUNCIONA_TRUST.map((item) => (
              <li
                key={item.title}
                className="flex gap-3 rounded-lg border border-[#ebebeb] bg-white px-4 py-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fafafa] text-[#0066CC]">
                  <item.Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1c1c1c]">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#6a6a6a]">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-xl border border-[#e8e8e8] bg-white p-5 md:p-6">
          <h2 className="text-base font-semibold text-[#1c1c1c]">¿Eres revisor profesional?</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#6a6a6a]">
            Publica tus servicios, define tu zona y cobra con pagos seguros cuando el cliente confirma
            el trabajo.
          </p>
          <button
            type="button"
            onClick={() => navigate('/become-expert')}
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#0066CC] hover:underline"
          >
            Quiero ser experto
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </section>

        <section className="mt-8 flex flex-wrap items-center gap-4 text-sm">
          <button
            type="button"
            onClick={() => navigate('/faq')}
            className="font-medium text-[#6a6a6a] underline-offset-2 hover:text-[#1c1c1c] hover:underline"
          >
            Preguntas frecuentes
          </button>
          <span className="text-[#d4d4d4]" aria-hidden>
            ·
          </span>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="font-medium text-[#0066CC] underline-offset-2 hover:underline"
          >
            Volver al inicio
          </button>
        </section>
      </main>

      <Footer />

      <div className="md:hidden">
        <Suspense fallback={null}>
          <MobileBottomBar />
        </Suspense>
      </div>
    </div>
  );
};

export default ComoFuncionaPage;
