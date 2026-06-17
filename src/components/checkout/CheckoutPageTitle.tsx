interface CheckoutPageTitleProps {
  className?: string;
  title?: string;
  /** Desktop: subrayado fino sin animación ni glow. */
  variant?: 'default' | 'subtle';
}

/** Título de checkout — subrayado azul→ámbar bajo el texto. */
export function CheckoutPageTitle({
  className = '',
  title = 'Confirmar y pagar',
  variant = 'default',
}: CheckoutPageTitleProps) {
  const isSubtle = variant === 'subtle';
  return (
    <h1
      className={`relative inline-block font-display font-semibold leading-tight tracking-[-0.02em] text-[#1c1c1c] ${isSubtle ? 'pb-1' : 'pb-2'} ${className}`.trim()}
    >
      {title}
      <span
        aria-hidden
        className={isSubtle ? 'checkout-page-title-underline-subtle' : 'checkout-page-title-underline'}
      />
    </h1>
  );
}
