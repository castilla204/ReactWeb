import React from 'react';
import { HP_HERO_COVERAGE } from '../constants/homepageTypography';

interface HomepageHeroTrustLinesProps {
  className?: string;
}

/**
 * Cobertura bajo el CTA del hero desktop únicamente.
 * Copy compacto (50+ · 500+) para una sola línea sin repetir "Más de".
 */
export const HomepageHeroTrustLines: React.FC<HomepageHeroTrustLinesProps> = ({
  className = 'mt-4',
}) => (
  <p
    className={`hidden md:block text-xs leading-snug text-[#6a6a6a] ${className}`}
    role="status"
  >
    <span className="font-medium text-brand">{HP_HERO_COVERAGE.countriesMin}+</span> países
    <span className="mx-2 text-[#d4d4d4]" aria-hidden>
      ·
    </span>
    <span className="font-medium text-brand">{HP_HERO_COVERAGE.expertsMin}+</span> expertos
    verificados
  </p>
);
