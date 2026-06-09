import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { SEO } from '../components/SEO';
import { aboutPageSchema, breadcrumbSchema } from '../utils/jsonLd';

const QuienesSomosPage: React.FC = () => {
  const navigate = useNavigate();

  const jsonLd = [
    aboutPageSchema('https://inspecciono.com/quienes-somos'),
    breadcrumbSchema([
      { name: 'Inicio', url: '/' },
      { name: 'Quiénes somos', url: '/quienes-somos' },
    ]),
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Quiénes somos | Inspecciono — marketplace de peritos en España"
        description="Inspecciono conecta a compradores con peritos verificados para inspeccionar coches, pisos, motos y maquinaria antes de la compra. Pago seguro en escrow, cobertura nacional."
        canonical="/quienes-somos"
        ogTitle="Inspecciono — peritos verificados para tu próxima compra"
        ogDescription="Marketplace nacional de inspecciones pre-compra. Coches, pisos, motos. Pago en escrow, informe estandarizado."
        jsonLd={jsonLd}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
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
            <h1 className="text-2xl font-bold text-gray-900">Quienes Somos</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Sobre Nosotros</h2>
          
          <div className="space-y-6 text-gray-700">
            <p className="text-lg leading-relaxed">
              En <strong>inspecciono.com</strong>, nos dedicamos a facilitar la verificación profesional 
              de servicios y productos, conectando a usuarios que necesitan inspecciones con expertos 
              cualificados en diversas áreas.
            </p>

            <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Nuestra Misión</h3>
            <p className="leading-relaxed">
              Nuestra misión es proporcionar un servicio confiable y eficiente que permita a los usuarios 
              verificar la calidad y autenticidad de servicios antes de realizar una compra o contratación. 
              Creemos en la transparencia y en ayudar a las personas a tomar decisiones informadas.
            </p>

            <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Nuestros Valores</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Transparencia:</strong> Proporcionamos información clara y honesta sobre nuestros servicios.</li>
              <li><strong>Calidad:</strong> Trabajamos solo con expertos verificados y cualificados.</li>
              <li><strong>Confianza:</strong> Construimos relaciones duraderas basadas en la confianza mutua.</li>
              <li><strong>Innovación:</strong> Utilizamos tecnología avanzada para mejorar continuamente nuestros servicios.</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Cómo Funcionamos</h3>
            <p className="leading-relaxed">
              Nuestra plataforma permite a los usuarios crear búsquedas de inspección especificando el tipo 
              de servicio o producto que desean verificar. Nuestros expertos, previamente verificados, pueden 
              entonces ofrecer sus servicios de inspección profesional.
            </p>

            <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Contacto</h3>
            <p className="leading-relaxed">
              Si tienes alguna pregunta o necesitas más información, no dudes en contactarnos a través de 
              nuestro sistema de soporte o por correo electrónico.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuienesSomosPage;


