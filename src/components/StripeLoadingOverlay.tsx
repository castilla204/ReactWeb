import { SileoFullscreenLoader } from "./ui/sileo-loader";

interface StripeLoadingOverlayProps {
  isOpen: boolean;
  message?: string;
}

export function StripeLoadingOverlay({ isOpen, message = "Abriendo Stripe…" }: StripeLoadingOverlayProps) {
  if (!isOpen) return null;

  return (
    <SileoFullscreenLoader message={message} className="bg-background/80" />
  );
}
