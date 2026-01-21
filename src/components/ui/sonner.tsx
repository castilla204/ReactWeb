import React from "react"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-right"
      richColors
      closeButton
      expand={false}
      duration={4000}
      gap={8}
      style={{ zIndex: 9999 }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white/95 group-[.toaster]:text-gray-900 group-[.toaster]:border group-[.toaster]:shadow-lg group-[.toaster]:shadow-black/5 group-[.toaster]:rounded-xl group-[.toaster]:backdrop-blur-xl group-[.toaster]:ring-1 group-[.toaster]:ring-black/5 group-[.toaster]:px-3 group-[.toaster]:py-2.5 group-[.toaster]:text-sm",
          error: 
            "group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-red-50 group-[.toaster]:to-red-100/80 group-[.toaster]:border-red-200/80 group-[.toaster]:text-red-900 group-[.toaster]:shadow-red-500/10",
          success: 
            "group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-green-50 group-[.toaster]:to-emerald-50/80 group-[.toaster]:border-green-200/80 group-[.toaster]:text-green-900 group-[.toaster]:shadow-green-500/10",
          info: 
            "group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-blue-50 group-[.toaster]:to-cyan-50/80 group-[.toaster]:border-blue-200/80 group-[.toaster]:text-blue-900 group-[.toaster]:shadow-blue-500/10",
          warning: 
            "group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-amber-50 group-[.toaster]:to-yellow-50/80 group-[.toaster]:border-amber-200/80 group-[.toaster]:text-amber-900 group-[.toaster]:shadow-amber-500/10",
          description: 
            "group-[.toast]:text-gray-600 group-[.toast]:text-xs group-[.toast]:mt-0.5",
          title: 
            "group-[.toast]:font-semibold group-[.toast]:text-sm group-[.toast]:leading-tight",
          actionButton:
            "group-[.toast]:bg-gray-900 group-[.toast]:text-white group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium group-[.toast]:hover:bg-gray-800 group-[.toast]:transition-colors",
          cancelButton:
            "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-700 group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium group-[.toast]:hover:bg-gray-200 group-[.toast]:transition-colors",
          closeButton:
            "group-[.toast]:text-gray-400 group-[.toast]:hover:text-gray-600 group-[.toast]:hover:bg-gray-100/80 group-[.toast]:rounded-full group-[.toast]:transition-all",
        },
        style: {
          background: 'transparent',
          color: 'inherit',
          maxWidth: '320px',
          width: '100%',
        }
      }}
      {...props}
    />
  )
}

export { Toaster }

