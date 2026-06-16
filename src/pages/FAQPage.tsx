import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { FAQ } from '../components/FAQ';
import { Footer } from '../components/Footer';
import { SEO } from '../components/SEO';
import { FAQ_ITEMS } from '../content/faqContent';
import { faqPageSchema, breadcrumbSchema } from '../utils/jsonLd';

const FAQPage: React.FC = () => {
  const navigate = useNavigate();

  // 🛡️ SEO: FAQPage JSON-LD con TODAS las preguntas del faqContent.
  // Google requiere que las preguntas estén visibles en el HTML (lo hace el componente <FAQ />)
  // para mostrar el rich snippet. Con 41 preguntas Inspecciono cubre casi toda la intención
  // informacional del marketplace → muy alto potencial de AI Overviews + featured snippets.
  const jsonLd = [
    faqPageSchema(
      FAQ_ITEMS.map((it) => ({ question: it.question, answer: it.answer })),
    ),
    breadcrumbSchema([
      { name: 'Inicio', url: '/' },
      { name: 'Preguntas frecuentes', url: '/faq' },
    ]),
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Preguntas frecuentes sobre inspecciones pre-compra | Inspecciono"
        description="Resolvemos las dudas más habituales sobre Inspecciono: precios, plazos, pago en escrow, qué incluye el informe, cómo elegir experto y cómo abrir disputa."
        canonical="/faq"
        ogTitle="Preguntas frecuentes — Inspecciono"
        ogDescription="¿Cuánto cuesta? ¿Qué incluye el informe? ¿Cómo funciona el pago retenido? Todas las respuestas en un sitio."
        jsonLd={jsonLd}
      />

      {/* Header propio SOLO en móvil: en desktop el topbar global de la homepage
          (App.tsx) ya es la cabecera unificada, así que evitamos el doble header. */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 md:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Preguntas Frecuentes</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Título de página en desktop (en móvil ya está en el header propio). */}
        <h1 className="mb-6 hidden text-3xl font-bold text-gray-900 md:block">
          Preguntas Frecuentes
        </h1>
        <FAQ />
      </main>

      <Footer />
    </div>
  );
};

export default FAQPage;

