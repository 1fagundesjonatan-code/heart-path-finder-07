export function BrandMark({ className }: { className?: string }) {
  return (
    <svg role="img" aria-label="The Self Map" viewBox="0 0 32 32" fill="none" className={className}>
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M16 6.5l2.4 7.1 7.1 2.4-7.1 2.4-2.4 7.1-2.4-7.1-7.1-2.4 7.1-2.4z"
        fill="currentColor"
      />
    </svg>
  );
}
