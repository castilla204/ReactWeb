import React from 'react';
import { HP_HERO_COVERAGE } from '../constants/homepageTypography';

interface HomepageHeroTrustLinesProps {
  className?: string;
}

/** Línea de cobertura bajo el CTA del hero */
export const HomepageHeroTrustLines: React.FC<HomepageHeroTrustLinesProps> = ({
  className = 'mt-4',
}) => (
  <p className={`text-xs leading-snug text-[#6a6a6a] ${className}`} role="status">
    Más de{' '}
    <span className="font-medium text-brand">{HP_HERO_COVERAGE.countriesMin}</span> países
    <span className="mx-2 text-[#d4d4d4]" aria-hidden>
      ·
    </span>
    Más de{' '}
    <span className="font-medium text-brand">{HP_HERO_COVERAGE.expertsMin}</span> expertos
  </p>
);
