import React from 'react';
import { Toaster as Sonner } from 'sonner';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { TOAST_THEME } from '../../constants/toastTheme';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const iconClass = 'h-[18px] w-[18px] shrink-0';

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group hp-toaster"
      position="top-right"
      closeButton
      expand={false}
      duration={4000}
      gap={10}
      offset={{ top: 16, right: 16 }}
      visibleToasts={3}
      style={{ zIndex: 9999, fontFamily: TOAST_THEME.font }}
      icons={{
        success: <CheckCircle2 className={iconClass} strokeWidth={2} />,
        info: <Info className={iconClass} strokeWidth={2} />,
        warning: <AlertTriangle className={iconClass} strokeWidth={2} />,
        error: <AlertCircle className={iconClass} strokeWidth={2} />,
      }}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            'hp-toast group toast group-[.toaster]:bg-white group-[.toaster]:text-[#222222] group-[.toaster]:border group-[.toaster]:border-[#ebebeb] group-[.toaster]:shadow-[0_2px_14px_rgba(15,23,42,0.07)] group-[.toaster]:rounded-2xl group-[.toaster]:px-4 group-[.toaster]:py-3.5',
          title:
            'group-[.toast]:font-semibold group-[.toast]:text-sm group-[.toast]:leading-5 group-[.toast]:text-[#222222] group-[.toast]:tracking-[-0.01em]',
          description:
            'group-[.toast]:text-xs group-[.toast]:leading-4 group-[.toast]:text-[#6a6a6a] group-[.toast]:mt-0.5',
          actionButton:
            'group-[.toast]:bg-brand group-[.toast]:text-white group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-xs group-[.toast]:font-semibold group-[.toast]:hover:bg-brand-hover group-[.toast]:transition-colors',
          cancelButton:
            'group-[.toast]:bg-[#fafafa] group-[.toast]:text-[#222222] group-[.toast]:border group-[.toast]:border-[#ebebeb] group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-xs group-[.toast]:font-medium group-[.toast]:hover:bg-white group-[.toast]:transition-colors',
          closeButton:
            'group-[.toast]:text-[#737373] group-[.toast]:hover:text-[#222222] group-[.toast]:hover:bg-[#f5f5f5] group-[.toast]:rounded-lg group-[.toast]:border-0 group-[.toast]:transition-all',
          success: 'hp-toast--success',
          error: 'hp-toast--error',
          info: 'hp-toast--info',
          warning: 'hp-toast--warning',
        },
        style: {
          background: 'transparent',
          color: 'inherit',
          maxWidth: `${TOAST_THEME.width}px`,
          width: '100%',
          fontFamily: TOAST_THEME.font,
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
