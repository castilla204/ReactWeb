import { Spinner } from "./ui/spinner";

interface StripeLoadingOverlayProps {
  isOpen: boolean;
  message?: string;
}

export function StripeLoadingOverlay({ isOpen, message = "Abriendo Stripe..." }: StripeLoadingOverlayProps) {
  // React manejará la eliminación del DOM cuando isOpen es false
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      data-stripe-loading-overlay="true"
    >
      <div className="flex flex-col items-center gap-4 p-8 bg-background rounded-lg border border-border shadow-lg">
        <Spinner size="lg" className="text-primary" />
        <p className="text-sm font-medium text-foreground">{message}</p>
      </div>
    </div>
  );
}

