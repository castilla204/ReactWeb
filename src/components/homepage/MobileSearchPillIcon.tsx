import React from 'react';
import { Map } from 'lucide-react';

import {
  HP_MOBILE_SEARCH_PILL_ICON_CLASS,
  HP_MOBILE_SEARCH_PILL_ICON_WRAP_CLASS,
} from '../../constants/homepageMobileRhythm';

/** Icono pill móvil — mapa de peritos (no pin de dirección delivery). */
export const MobileSearchPillIcon: React.FC = () => (
  <span className={HP_MOBILE_SEARCH_PILL_ICON_WRAP_CLASS} aria-hidden>
    <Map className={HP_MOBILE_SEARCH_PILL_ICON_CLASS} strokeWidth={2} />
  </span>
);
