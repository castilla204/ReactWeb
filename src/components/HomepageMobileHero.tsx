import React from 'react';
import { MapPin } from 'lucide-react';

import {
  ESCROW_HERO_MOBILE_LEAD,
  MOBILE_HERO_CARD_SUBLINE,
  MOBILE_HERO_LOCATION_BADGE,
} from '../constants/escrowCopy';
import {
  HP_MOBILE_HERO_PEEK_RESERVE_CLASS,
  HP_MOBILE_HERO_SECTION_CLASS,
  HP_MOBILE_TABS_NAV_CLASS,
  HP_MOBILE_TABS_SCROLLER_CLASS,
} from '../constants/homepageMobileRhythm';
import { HP_FONT } from '../constants/homepageTypography';
import {
  LAYERED_CARD_BACK_INSET_X,
  LAYERED_CARD_BACK_PEEK_PX,
  LayeredHookCard,
} from './ui/LayeredHookCard';

const MOBILE_HERO_TITLE = 'Revisado por un experto';

/** Placeholder skeleton — misma silueta que la tarjeta hero + tabs. */
export const HomepageMobileHeroPlaceholder: React.FC = () => (
  <>
    <section
      data-homepage-hero
      className={HP_MOBILE_HERO_SECTION_CLASS}
      aria-hidden
    >
      <div className="relative">
        <div
          className="absolute top-0 rounded-[16px] bg-line-soft min-[390px]:rounded-[20px]"
          style={{
            left: LAYERED_CARD_BACK_INSET_X,
            right: LAYERED_CARD_BACK_INSET_X,
            height: `calc(100% + ${LAYERED_CARD_BACK_PEEK_PX}px)`,
          }}
        />
        <div className="relative z-[1] rounded-[18px] bg-line px-4 py-3.5 min-[390px]:rounded-[20px] min-[390px]:px-5 min-[390px]:py-4">
          <div className="h-4 w-32 rounded-md bg-line-soft" />
          <div className="mt-0.5 h-3 w-40 rounded-md bg-line-soft" />
          <div className="mt-3 h-6 w-28 rounded-full bg-line-soft" />
        </div>
      </div>
      <div aria-hidden className={HP_MOBILE_HERO_PEEK_RESERVE_CLASS} />
    </section>
    <nav className={HP_MOBILE_TABS_NAV_CLASS} aria-hidden>
      <div className={HP_MOBILE_TABS_SCROLLER_CLASS}>
        {[88, 56, 48].map((w) => (
          <div key={w} className="h-4 self-center rounded-sm bg-line-soft" style={{ width: w }} />
        ))}
        <span
          role="presentation"
          aria-hidden
          className="mx-0.5 w-px shrink-0 self-center bg-line"
          style={{ height: '1.25rem' }}
        />
        {[64, 76].map((w) => (
          <div key={`d-${w}`} className="h-4 self-center rounded-sm bg-line-soft/80" style={{ width: w }} />
        ))}
      </div>
    </nav>
  </>
);

/** Hero móvil — tarjeta sobre blanco compartido con categorías y muro. */
export const HomepageMobileHero: React.FC = () => (
  <section data-homepage-hero className={HP_MOBILE_HERO_SECTION_CLASS}>
    <div style={{ fontFamily: HP_FONT }}>
      <LayeredHookCard
        peekReserveClass={HP_MOBILE_HERO_PEEK_RESERVE_CLASS}
        title={
          <>
            {MOBILE_HERO_TITLE}
            <span className="sr-only">. {ESCROW_HERO_MOBILE_LEAD}</span>
          </>
        }
        subtitle={MOBILE_HERO_CARD_SUBLINE}
        badge={
          <>
            <MapPin
              className="h-3 w-3 shrink-0 min-[390px]:h-3.5 min-[390px]:w-3.5"
              strokeWidth={2.25}
              aria-hidden
            />
            {MOBILE_HERO_LOCATION_BADGE}
          </>
        }
      />
    </div>
  </section>
);
