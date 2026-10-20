interface HangerIconProps {
  className?: string;
}

/** Inline hanger glyph — lucide has no hanger in this version. */
export default function HangerIcon({ className }: HangerIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 12V9.4a1.7 1.7 0 1 1 1.7-1.7" />
      <path d="M3.5 16.3 12 9.7l8.5 6.6" />
      <path d="M3.5 16.3h17" />
    </svg>
  );
}
