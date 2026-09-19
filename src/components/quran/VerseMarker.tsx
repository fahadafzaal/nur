import { toArabicDigits } from "@/lib/quran-audio";

/**
 * End-of-verse marker: the verse number inside an eight-point star.
 * Drawn as SVG rather than the ornate-parenthesis characters, whose
 * orientation in right-to-left text varies between fonts and browsers.
 */
export default function VerseMarker({ n }: { n: number }) {
  return (
    <span
      aria-label={`verse ${n}`}
      className="relative mx-1.5 inline-flex h-[1.35em] w-[1.35em] shrink-0 items-center justify-center align-middle"
    >
      <svg
        viewBox="0 0 40 40"
        className="text-gold/70 absolute inset-0"
        aria-hidden="true"
      >
        <path
          d="M20 2 L25.5 9 L34 8 L33 16.5 L38 20 L33 23.5 L34 32 L25.5 31 L20 38 L14.5 31 L6 32 L7 23.5 L2 20 L7 16.5 L6 8 L14.5 9 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      <span className="text-gold-light relative text-[0.42em] leading-none">
        {toArabicDigits(n)}
      </span>
    </span>
  );
}
