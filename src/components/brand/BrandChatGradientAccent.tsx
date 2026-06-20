import React from 'react';
import { cn } from '../../lib/utils';
import {
  SD_BRAND_CHAT_GRADIENT_LINE_SUBTLE,
  SD_BRAND_CHAT_GRADIENT_WASH_SUBTLE,
  SD_BRAND_BLUE_GRADIENT_LINE_SUBTLE,
  SD_BRAND_BLUE_GRADIENT_WASH_SUBTLE,
} from '../../constants/homepageTypography';

type BrandChatGradientAccentProps = {
  /**
   * `line` — franja de 1px en el borde superior.
   * `header` — lavado horizontal en todo el contenedor + línea inferior (como cabecera del chat).
   */
  placement?: 'line' | 'header';
  /**
   * `amber` — acento ámbar→azul del asistente (por defecto).
   * `blue` — degradado solo azul (azul claro→azul marca).
   */
  tone?: 'amber' | 'blue';
  /** En `header`, dibuja la línea inferior de 1px (por defecto sí). */
  withLine?: boolean;
  className?: string;
};

/** Acento de marca — línea y/o lavado muy sutil (ámbar→azul o solo azul). */
export function BrandChatGradientAccent({
  placement = 'line',
  tone = 'amber',
  withLine = true,
  className,
}: BrandChatGradientAccentProps) {
  const washBg =
    tone === 'blue' ? SD_BRAND_BLUE_GRADIENT_WASH_SUBTLE : SD_BRAND_CHAT_GRADIENT_WASH_SUBTLE;
  const lineBg =
    tone === 'blue' ? SD_BRAND_BLUE_GRADIENT_LINE_SUBTLE : SD_BRAND_CHAT_GRADIENT_LINE_SUBTLE;

  if (placement === 'header') {
    return (
      <>
        <div
          aria-hidden
          className={cn('pointer-events-none absolute inset-0', className)}
          style={{ background: washBg }}
        />
        {withLine ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
            style={{ background: lineBg }}
          />
        ) : null}
      </>
    );
  }

  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-x-0 top-0 z-[1] h-px', className)}
      style={{ background: lineBg }}
    />
  );
}
