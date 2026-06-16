export function TypingDots({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-hidden>
      {[0, 160, 320].map((delay) => (
        <span
          key={delay}
          className="chat-typing-dot h-1.5 w-1.5 rounded-full bg-current"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}
