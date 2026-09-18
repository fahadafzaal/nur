/**
 * The sparkling starfield that sits behind every screen in NUR.
 *
 * Two layers, per the brand spec: small twinkling dots, plus occasional
 * 4-point sparkle stars — each on its own randomised timing so the sky
 * never pulses in unison.
 *
 * Positions come from a seeded PRNG evaluated at module scope, so the
 * server and the client generate byte-identical markup. Using Math.random()
 * here would produce a hydration mismatch on every load.
 */

type Star = {
  x: number;
  y: number;
  size: number;
  dur: number;
  delay: number;
  min: number;
  max: number;
};

type Sparkle = Omit<Star, "min"> & { rotate: number };

/** Small, fast, deterministic PRNG (mulberry32). */
function mulberry32(seed: number) {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Where the lantern sits on the splash screen, in viewport percentages.
 * Stars near it are brightened so the Fanous genuinely appears to light
 * the sky around it rather than floating on top of a flat backdrop.
 */
const LIGHT_SOURCE = { x: 50, y: 42, radius: 30 };

function proximityBoost(x: number, y: number) {
  const dx = x - LIGHT_SOURCE.x;
  const dy = y - LIGHT_SOURCE.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance > LIGHT_SOURCE.radius) return 0;
  // 1 at the centre, easing to 0 at the edge of the lit radius.
  return (1 - distance / LIGHT_SOURCE.radius) ** 2;
}

const STAR_COUNT = 140;
const SPARKLE_COUNT = 12;

const random = mulberry32(0x6e7572); // "nur"

const STARS: Star[] = Array.from({ length: STAR_COUNT }, () => {
  const x = random() * 100;
  const y = random() * 100;
  const boost = proximityBoost(x, y);
  return {
    x,
    y,
    size: 0.8 + random() * 1.8,
    dur: 2.6 + random() * 5.4,
    delay: random() * -8,
    min: 0.08 + boost * 0.2,
    max: 0.35 + random() * 0.4 + boost * 0.45,
  };
});

const SPARKLES: Sparkle[] = Array.from({ length: SPARKLE_COUNT }, () => {
  const x = random() * 100;
  const y = random() * 100;
  return {
    x,
    y,
    size: 7 + random() * 9,
    dur: 4.5 + random() * 5,
    delay: random() * -10,
    max: 0.4 + random() * 0.35 + proximityBoost(x, y) * 0.5,
    rotate: random() * 90,
  };
});

/** A classic 4-point sparkle with concave sides. */
const SPARKLE_PATH =
  "M12 0 C12.6 6.4 17.6 11.4 24 12 C17.6 12.6 12.6 17.6 12 24 C11.4 17.6 6.4 12.6 0 12 C6.4 11.4 11.4 6.4 12 0 Z";

export default function Starfield({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden ${className}`}
    >
      {/* A faint warm lift in the sky where the lantern hangs. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 45% at 50% 42%, rgba(201,162,39,0.10) 0%, rgba(201,162,39,0.03) 45%, transparent 75%)",
        }}
      />

      {STARS.map((star, i) => (
        <span
          key={`s${i}`}
          className="nur-star"
          style={
            {
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              "--dur": `${star.dur}s`,
              "--delay": `${star.delay}s`,
              "--star-min": star.min,
              "--star-max": star.max,
            } as React.CSSProperties
          }
        />
      ))}

      {SPARKLES.map((sparkle, i) => (
        <svg
          key={`k${i}`}
          className="nur-sparkle"
          viewBox="0 0 24 24"
          style={
            {
              left: `${sparkle.x}%`,
              top: `${sparkle.y}%`,
              width: `${sparkle.size}px`,
              height: `${sparkle.size}px`,
              rotate: `${sparkle.rotate}deg`,
              "--dur": `${sparkle.dur}s`,
              "--delay": `${sparkle.delay}s`,
              "--star-max": sparkle.max,
            } as React.CSSProperties
          }
        >
          <path d={SPARKLE_PATH} fill="currentColor" />
        </svg>
      ))}
    </div>
  );
}
