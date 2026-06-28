import 'sileo/styles.css';
import './../../styles/sileo-theme.css';
import { Toaster as SileoToaster } from 'sileo';
import { useMediaQuery } from '../../hooks/useMediaQuery';

/**
 * Contenedor de toasts de la app, ahora servido por Sileo (físicos / opinionated).
 * Reemplaza al antiguo Toaster de sonner. `options` fija defaults globales.
 *
 * Posición responsive: en escritorio se ancla arriba a la derecha; en móvil se
 * CENTRA. El pill "físico" de Sileo se dibuja con un <svg> de ancho HARDCODEADO
 * (350px, ver sileo-theme.css), que no encoge con el CSS. Anclado a la derecha,
 * en pantallas estrechas ese ancho fijo sobresalía por el lateral derecho y el
 * toast (sobre todo los de error, con mensajes largos) se perdía fuera de la
 * pantalla. Centrándolo, los 350px quedan dentro del viewport en cualquier
 * móvil normal (≥360px) y el mensaje completo es visible.
 */
const Toaster = () => {
  const isMobile = useMediaQuery('(max-width: 640px)');
  return (
    <SileoToaster
      position={isMobile ? 'top-center' : 'top-right'}
      theme="light"
      options={{ roundness: 18 }}
    />
  );
};

export { Toaster };
