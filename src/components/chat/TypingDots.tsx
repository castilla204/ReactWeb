export function TypingDots({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-hidden>
      {[0, 120, 240].map((delay) => (
        <span
          key={delay}
          className="h-1.5 w-1.5 rounded-full bg-current opacity-70 animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}
