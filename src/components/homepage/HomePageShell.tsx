import React, { type ReactNode } from 'react';
import { MOBILE_CONTENT_PADDING_BOTTOM_CLASS } from '../../constants/homepageTypography';
import { HomepageDesktopTrustWave } from '../HomepageDesktopTrustWave';

interface HomePageShellProps {
  /** Franja opcional arriba de todo (p. ej. atajo al panel para expertos). */
  topStrip?: ReactNode;
  searchBar: ReactNode;
  hero: ReactNode;
  services: ReactNode;
  bottomBar?: ReactNode;
  desktopFooter?: ReactNode;
  /** @deprecated — la ola de transición ahora vive dentro de HomepageDesktopKayak */
  desktopTrustShelf?: ReactNode;
  /** Atributos del contenedor raíz (p. ej. role/status en skeleton de ruta). */
  rootProps?: React.HTMLAttributes<HTMLDivElement>;
}

/**
 * Layout compartido home móvil + desktop.
 *
 * Móvil: scroll natural de página (patrón marketplace). Search sticky en
 * AirbnbSearchBar; hero + tabs de categoría scrollean; cards en el muro.
 * Sin min-h en móvil: evita hueco muerto sobre la tab bar cuando el contenido
 * no llena el viewport.
 *
 * Desktop: flujo en bloque con sombra del panel de servicios.
 */
export const HomePageShell: React.FC<HomePageShellProps> = ({
  topStrip,
  searchBar,
  hero,
  services,
  bottomBar,
  desktopFooter,
  desktopTrustShelf,
  rootProps,
}) => {
  const { className: rootClassName, ...restRootProps } = rootProps ?? {};

  return (
    <>
      <div
        {...restRootProps}
        className={[
          MOBILE_CONTENT_PADDING_BOTTOM_CLASS,
          'bg-white',
          'md:min-h-screen md:pb-0',
          rootClassName,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {topStrip}
        {searchBar}
        {hero}

        <div
          data-services-section
          id="servicios-grid"
          className="relative z-20 pt-0 pb-0 md:-mt-32 md:pb-10"
        >
          <HomepageDesktopTrustWave />
          <div className="bg-white">{services}</div>
        </div>

        {desktopFooter}
      </div>
      {bottomBar}
    </>
  );
};

export default HomePageShell;
