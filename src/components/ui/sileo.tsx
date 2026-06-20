import 'sileo/styles.css';
import './../../styles/sileo-theme.css';
import { Toaster as SileoToaster } from 'sileo';

/**
 * Contenedor de toasts de la app, ahora servido por Sileo (físicos / opinionated).
 * Reemplaza al antiguo Toaster de sonner. La posición se mantiene arriba a la derecha.
 * `options` fija defaults globales para todos los toasts.
 */
const Toaster = () => {
  return (
    <SileoToaster
      position="top-right"
      theme="light"
      options={{ roundness: 18 }}
    />
  );
};

export { Toaster };
