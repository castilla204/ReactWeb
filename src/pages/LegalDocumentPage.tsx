import {
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { SileoLoader } from '../components/ui/sileo-loader';
import { Footer } from '../components/Footer';
import { SEO } from '../components/SEO';

const MobileBottomBar = lazy(() =>
  import('../components/MobileBottomBar').then((m) => ({ default: m.MobileBottomBar })),
);

/** Contenedor de página, ancho. Hero e índice+contenido comparten ancho. */
const PAGE_CONTAINER = 'mx-auto w-full max-w-[1240px] px-4 md:px-6';

interface LegalApiResponse {
  content: string;
  version?: string;
}

interface TocItem {
  id: string;
  text: string;
}

interface LegalDocumentPageProps {
  /** Endpoint absoluto del documento (API_CONFIG.endpoints.legal.*). */
  endpoint: string;
  /** Título del hero (ej. "Términos y condiciones"). */
  title: string;
  /** Subtítulo bajo el título. */
  subtitle: string;
  /** Path canónico para SEO (ej. "/terms.html"). */
  canonical: string;
  seoTitle: string;
  seoDescription: string;
  /** Mensaje de error específico del documento. */
  errorMessage: string;
}

/**
 * Página base de documentos legales. Reemplaza al render directo del HTML del
 * backend (que arrastraba su propio <style> y se filtraba a TODA la SPA).
 *
 * - Saneamos el HTML: solo el contenido del <body>, sin <style>/<script>/<head>.
 * - Extraemos las secciones (<h2>) para un índice lateral con scrollspy.
 * - Estética sobria y documental: monocroma, texto compacto, ancho amplio.
 */
export function LegalDocumentPage({
  endpoint,
  title,
  subtitle,
  canonical,
  seoTitle,
  seoDescription,
  errorMessage,
}: LegalDocumentPageProps) {
  const navigate = useNavigate();
  const { fetchApi } = useApi();
  const [rawContent, setRawContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    const fetchDoc = async () => {
      try {
        const response = await fetchApi<LegalApiResponse>(endpoint);
        if (!cancelled) setRawContent(response.content ?? '');
      } catch (err) {
        console.error('Error fetching legal document:', err);
        if (!cancelled) setError(errorMessage);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDoc();
    return () => {
      cancelled = true;
    };
  }, [endpoint, errorMessage, fetchApi]);

  /**
   * Sanea el HTML y, de paso, asigna un id a cada <h2> y devuelve el índice de
   * secciones. Robusto tanto si el backend manda documento completo como
   * fragmento.
   */
  const { html, toc } = useMemo<{ html: string; toc: TocItem[] }>(() => {
    if (!rawContent) return { html: '', toc: [] };
    try {
      const doc = new DOMParser().parseFromString(rawContent, 'text/html');
      doc
        .querySelectorAll('style, script, link, meta, title, head')
        .forEach((el) => el.remove());

      const toc: TocItem[] = [];
      doc.querySelectorAll('h2').forEach((h, i) => {
        const id = `sec-${i + 1}`;
        h.id = id;
        toc.push({ id, text: (h.textContent || `Sección ${i + 1}`).trim() });
      });

      const body = doc.body;
      return { html: (body ? body.innerHTML : rawContent).trim(), toc };
    } catch {
      return { html: rawContent, toc: [] };
    }
  }, [rawContent]);

  /**
   * Scrollspy: la sección activa es la última cuyo encabezado ha cruzado el
   * umbral superior. Robusto independientemente de la altura de cada sección.
   */
  useEffect(() => {
    if (!toc.length) return;
    const ids = toc.map((t) => t.id);
    const THRESHOLD = 130; // px desde el borde superior del viewport
    let raf = 0;

    const update = () => {
      raf = 0;
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= THRESHOLD) current = id;
        else break; // los encabezados van en orden: el primero por debajo corta.
      }
      setActiveId(current);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    // Respaldo: el IntersectionObserver lo dispara el compositor, no eventos
    // 'scroll', así que sigue funcionando si el contenedor no los emite.
    const io = new IntersectionObserver(schedule, { threshold: [0, 1] });
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });

    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [toc, html]);

  const handleTocClick = (id: string) => (e: MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface-tinted font-display text-ink-strong">
      <SEO title={seoTitle} description={seoDescription} canonical={canonical} noindex={false} />

      {/* Contenido */}
      <main className={`${PAGE_CONTAINER} flex-1 py-7 pb-24 md:py-10 md:pb-16`}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-1.5 text-caption font-medium text-ink shadow-sm transition-colors hover:border-line-soft hover:text-ink-strong"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver
        </button>
        <h1 className="font-display text-[1.4rem] font-semibold leading-tight tracking-[-0.02em] text-ink-strong md:text-[1.6rem]">
          {title}
        </h1>
        <p className="mt-1.5 mb-6 max-w-2xl text-meta leading-relaxed text-ink-muted">
          {subtitle}
        </p>
        {loading ? (
          <div className="flex justify-center py-20">
            <SileoLoader size="lg" color="brand" />
          </div>
        ) : error ? (
          <div className="rounded-lg bg-white px-6 py-12 text-center text-sm text-destructive ring-1 ring-line">
            {error}
          </div>
        ) : (
          <article className="min-w-0">
            <div className="legal-prose" dangerouslySetInnerHTML={{ __html: html }} />
          </article>
        )}
      </main>

      <Footer />

      <div className="md:hidden">
        <Suspense fallback={null}>
          <MobileBottomBar />
        </Suspense>
      </div>
    </div>
  );
}
