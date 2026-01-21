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
      icons={false}
      style={{ zIndex: 9999 }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-900 group-[.toaster]:border group-[.toaster]:border-gray-200 group-[.toaster]:shadow-md group-[.toaster]:rounded-lg group-[.toaster]:px-4 group-[.toaster]:py-3 group-[.toaster]:text-sm",
          error: 
            "group-[.toaster]:bg-white group-[.toaster]:border-red-300 group-[.toaster]:text-red-800",
          success: 
            "group-[.toaster]:bg-white group-[.toaster]:border-green-300 group-[.toaster]:text-green-800",
          info: 
            "group-[.toaster]:bg-white group-[.toaster]:border-blue-300 group-[.toaster]:text-blue-800",
          warning: 
            "group-[.toaster]:bg-white group-[.toaster]:border-amber-300 group-[.toaster]:text-amber-800",
          description: 
            "group-[.toast]:text-gray-600 group-[.toast]:text-sm group-[.toast]:mt-1",
          title: 
            "group-[.toast]:font-medium group-[.toast]:text-sm group-[.toast]:leading-normal",
          actionButton:
            "group-[.toast]:bg-gray-900 group-[.toast]:text-white group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium group-[.toast]:hover:bg-gray-800 group-[.toast]:transition-colors",
          cancelButton:
            "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-700 group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium group-[.toast]:hover:bg-gray-200 group-[.toast]:transition-colors",
          closeButton:
            "group-[.toast]:text-gray-400 group-[.toast]:hover:text-gray-600 group-[.toast]:hover:bg-gray-100 group-[.toast]:rounded-md group-[.toast]:transition-all",
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

