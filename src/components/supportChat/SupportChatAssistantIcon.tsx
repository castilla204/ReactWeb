import React from 'react';
import { cn } from '../../lib/utils';

type SupportChatAssistantIconProps = {
  className?: string;
};

/** Burbuja con líneas de texto — ayuda contextual, no icono genérico de chat. */
export function SupportChatAssistantIcon({ className }: SupportChatAssistantIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <path
        d="M19 4.5H5A2.5 2.5 0 0 0 2.5 7v8.5A2.5 2.5 0 0 0 5 18h2.75L11 20.8a.65.65 0 0 0 1-.52V18h7a2.5 2.5 0 0 0 2.5-2.5V7A2.5 2.5 0 0 0 19 4.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M8 9.25h8M8 12.25h5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
