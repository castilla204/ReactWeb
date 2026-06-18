export interface SobreValor {
  titulo: string;
  texto: string;
}

export const SOBRE_INTRO =
  'En inspecciono.com nos dedicamos a facilitar la verificación profesional de servicios y productos, conectando a usuarios que necesitan inspecciones con expertos cualificados en diversas áreas.';

export const SOBRE_MISION =
  'Nuestra misión es proporcionar un servicio confiable y eficiente que permita a los usuarios verificar la calidad y autenticidad de servicios antes de realizar una compra o contratación. Creemos en la transparencia y en ayudar a las personas a tomar decisiones informadas.';

export const SOBRE_VALORES: SobreValor[] = [
  { titulo: 'Transparencia', texto: 'Proporcionamos información clara y honesta sobre nuestros servicios.' },
  { titulo: 'Calidad', texto: 'Trabajamos solo con expertos verificados y cualificados.' },
  { titulo: 'Confianza', texto: 'Construimos relaciones duraderas basadas en la confianza mutua.' },
  { titulo: 'Innovación', texto: 'Utilizamos tecnología avanzada para mejorar continuamente nuestros servicios.' },
];
