import React, { type ReactNode } from 'react';
import { HomepageDesktopTrustWave } from '../HomepageDesktopTrustWave';

interface HomePageShellProps {
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
 * Móvil: scroll natural de página (patrón marketplace). Search/tabs sticky en
 * AirbnbSearchBar; hero scrollea away; solo las cards se desplazan con el gesto
 * vertical del documento — sin scroll anidado ni "cajón" interno.
 *
 * Desktop: flujo en bloque con sombra del panel de servicios.
 */
export const HomePageShell: React.FC<HomePageShellProps> = ({
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
          'min-h-[100dvh] bg-white pb-[calc(65px+env(safe-area-inset-bottom,0px))]',
          'md:min-h-screen md:pb-0',
          rootClassName,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {searchBar}
        {hero}

        <div
          data-services-section
          id="servicios-grid"
          className="relative z-20 pt-0 pb-1 md:-mt-32 md:pb-10"
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
