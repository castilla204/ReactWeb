import React, { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { HelpCircle } from 'lucide-react';

import { FAQ_ITEMS } from '../content/faqContent';

export const FAQ: React.FC = () => {
  const [value, setValue] = useState<string | undefined>(undefined);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4">
      {/* Header con menos espacio arriba */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <HelpCircle className="w-6 h-6 text-blue-600" />
          <h2 className="text-3xl font-bold text-gray-900">
            Preguntas Frecuentes
          </h2>
        </div>
        <p className="text-gray-600 text-sm">
          Encuentra respuestas a las preguntas más comunes sobre nuestra plataforma
        </p>
      </div>

      {/* Acordeón de preguntas */}
      <Accordion 
        type="single" 
        collapsible 
        value={value}
        onValueChange={setValue}
        className="w-full space-y-3"
      >
        {FAQ_ITEMS.map((item) => (
          <AccordionItem 
            key={item.id} 
            value={item.id}
            className="border border-gray-200 rounded-lg px-5 bg-white hover:bg-gray-50 transition-colors shadow-sm"
          >
            <AccordionTrigger className="text-left font-semibold text-gray-900 hover:no-underline py-4 text-base">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-gray-700 leading-relaxed pb-4 text-sm">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Footer opcional */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          ¿No encuentras la respuesta que buscas?{' '}
          <a 
            href="#" 
            className="text-blue-600 hover:text-blue-700 underline font-medium"
            onClick={(e) => {
              e.preventDefault();
              // Aquí puedes agregar lógica para abrir un modal de contacto o redirigir
            }}
          >
            Contáctanos
          </a>
        </p>
      </div>
    </div>
  );
};

