import { SileoPageLoader } from './ui/sileo-loader';

/** Fallback unificado mientras carga un chunk de ruta. */
export const PageRouteFallback: React.FC = () => (
  <SileoPageLoader message="Preparando página…" className="bg-[#fafafa]" />
);
