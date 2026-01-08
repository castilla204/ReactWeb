import React, { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { HelpCircle } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: '¿Cómo funciona la verificación de expertos?',
    answer: 'Todos nuestros expertos pasan por un proceso riguroso de verificación que incluye validación de identidad, verificación de credenciales profesionales y revisión de experiencia. Solo los expertos verificados pueden ofrecer servicios en nuestra plataforma, garantizando la máxima confiabilidad para nuestros usuarios.'
  },
  {
    id: '2',
    question: '¿Cómo se procesan los pagos?',
    answer: 'Utilizamos Stripe, una plataforma de pagos segura y confiable. El pago se mantiene en custodia hasta que el servicio se complete satisfactoriamente. Una vez que confirmes que el servicio se realizó correctamente, el experto recibirá el pago. Esto te protege y garantiza que solo pagas por servicios completados.'
  },
  {
    id: '3',
    question: '¿Puedo cancelar un servicio contratado?',
    answer: 'Sí, puedes cancelar un servicio antes de que el experto lo acepte sin ningún costo. Si el experto ya ha aceptado, puedes cancelar según nuestras políticas de cancelación. Si el experto ya ha comenzado el trabajo, se aplicarán las políticas de reembolso correspondientes. Siempre puedes contactar con nuestro equipo de soporte para resolver cualquier situación.'
  },
  {
    id: '4',
    question: '¿Qué pasa si no estoy satisfecho con el servicio?',
    answer: 'Tu satisfacción es nuestra prioridad. Si no estás contento con el servicio recibido, puedes abrir una disputa a través de nuestro sistema. Nuestro equipo revisará el caso y trabajará contigo y con el experto para encontrar una solución justa. En casos apropiados, podemos procesar reembolsos parciales o completos.'
  },
  {
    id: '5',
    question: '¿Cómo puedo convertirme en experto?',
    answer: 'Para convertirte en experto, necesitas crear una cuenta y completar el proceso de registro como experto. Deberás proporcionar información sobre tu experiencia, credenciales profesionales y completar la verificación de identidad. Una vez aprobado, podrás crear servicios y comenzar a recibir solicitudes de clientes.'
  },
  {
    id: '6',
    question: '¿Cuánto tiempo tarda un experto en responder?',
    answer: 'Los expertos suelen responder en un plazo de 24 horas. Sin embargo, esto puede variar según la categoría de servicio y la disponibilidad del experto. Puedes ver el tiempo promedio de respuesta en el perfil de cada experto antes de contratar sus servicios.'
  },
  {
    id: '7',
    question: '¿Hay algún costo por usar la plataforma?',
    answer: 'Para los clientes, no hay costos ocultos. Solo pagas el precio acordado con el experto por el servicio. La plataforma cobra una pequeña comisión al experto por cada transacción completada, lo que nos permite mantener y mejorar nuestros servicios.'
  },
  {
    id: '8',
    question: '¿Cómo puedo contactar con el soporte?',
    answer: 'Puedes contactar con nuestro equipo de soporte a través del chat en la plataforma, por correo electrónico o utilizando el sistema de mensajería dentro de cada búsqueda o servicio contratado. Estamos disponibles para ayudarte con cualquier pregunta o problema que puedas tener.'
  }
];

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
        {faqData.map((item) => (
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

