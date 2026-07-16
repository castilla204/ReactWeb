import React from 'react';
import { cn } from '../../lib/utils';

type SupportChatAssistantIconProps = {
  className?: string;
};

/** Marca del asistente: chispa de cuatro puntas — inteligencia, no globo de chat genérico. */
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
        d="M12 2.5c.6 4.68 1.1 5.18 5.78 5.78-4.68.6-5.18 1.1-5.78 5.78-.6-4.68-1.1-5.18-5.78-5.78 4.68-.6 5.18-1.1 5.78-5.78Z"
        fill="currentColor"
      />
      <path
        d="M17.5 15.4c.32 2.5.58 2.76 3.08 3.08-2.5.32-2.76.58-3.08 3.08-.32-2.5-.58-2.76-3.08-3.08 2.5-.32 2.76-.58 3.08-3.08Z"
        fill="currentColor"
      />
    </svg>
  );
}
