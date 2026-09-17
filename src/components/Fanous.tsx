/**
 * The Fanous — NUR's signature element.
 *
 * Built as a single inline SVG rather than an image so every part can be
 * animated independently, per §4 of the project documentation:
 *
 *   · a mashrabiya-style geometric lattice (repeating khatam stars)
 *   · three overlapping flames, each on its own irregular timing
 *   · light rays rotating behind the lattice, so the metalwork cuts them
 *     into moving shafts instead of a faked uniform glow
 *   · embers rising out of the crown and fading, staggered
 *   · a slow sway pivoting at the hook, as if hanging from a chain
 *   · a warm glow pooled on the ground beneath it
 *
 * Purely decorative, so it is hidden from assistive technology.
 */

const RAY_COUNT = 14;

const EMBERS = [
  { x: 112, y: 132, r: 1.9, drift: -13, dur: 4.6, delay: 0 },
  { x: 126, y: 138, r: 1.4, drift: 9, dur: 5.4, delay: -1.3 },
  { x: 119, y: 126, r: 2.2, drift: 4, dur: 4.1, delay: -2.6 },
  { x: 132, y: 134, r: 1.2, drift: 15, dur: 5.9, delay: -0.7 },
  { x: 106, y: 136, r: 1.6, drift: -8, dur: 5.1, delay: -3.4 },
  { x: 123, y: 143, r: 1.1, drift: 12, dur: 4.4, delay: -4.1 },
  { x: 114, y: 129, r: 1.5, drift: -4, dur: 6.2, delay: -2.0 },
];

/** Lantern body silhouette — reused as fill, clip path and outline. */
const BODY_PATH =
  "M80,100 C64,124 60,146 62,168 C64,206 76,244 88,270 L152,270 C164,244 176,206 178,168 C180,146 176,124 160,100 Z";

export default function Fanous({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 240 400"
      className={className}
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* Brass, with a sheen running across it. */}
        <linearGradient id="nur-brass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7d6316" />
          <stop offset="32%" stopColor="#f5d98a" />
          <stop offset="58%" stopColor="#c9a227" />
          <stop offset="100%" stopColor="#7d6316" />
        </linearGradient>

        <radialGradient id="nur-halo-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f5d98a" stopOpacity="0.5" />
          <stop offset="38%" stopColor="#c9a227" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#c9a227" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="nur-interior" cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor="#f5d98a" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#c9a227" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#c9a227" stopOpacity="0.06" />
        </radialGradient>

        <radialGradient id="nur-ground" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f5d98a" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#c9a227" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="nur-flame-outer" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#c9a227" stopOpacity="0.15" />
          <stop offset="45%" stopColor="#c9a227" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#f5d98a" stopOpacity="0.9" />
        </linearGradient>

        <linearGradient id="nur-flame-mid" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#f5d98a" stopOpacity="0.4" />
          <stop offset="60%" stopColor="#f5d98a" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#fff6e0" />
        </linearGradient>

        {/* The mashrabiya lattice: interlocking eight-point khatam stars. */}
        <pattern
          id="nur-mashrabiya"
          width="30"
          height="30"
          patternUnits="userSpaceOnUse"
        >
          <g
            fill="none"
            stroke="url(#nur-brass)"
            strokeWidth="1.1"
            strokeLinejoin="round"
          >
            <path d="M15,2 L28,15 L15,28 L2,15 Z" />
            <path d="M6.5,6.5 H23.5 V23.5 H6.5 Z" />
            <path d="M15,2 V0 M15,28 V30 M2,15 H0 M28,15 H30" />
          </g>
          <circle cx="15" cy="15" r="1.6" fill="#c9a227" opacity="0.5" />
        </pattern>

        <clipPath id="nur-body-clip">
          <path d={BODY_PATH} />
        </clipPath>

        <filter id="nur-soft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.2" />
        </filter>

        <filter id="nur-flame-glow" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="4.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ---- Ground: the pool of warm light beneath the lantern ---- */}
      <ellipse
        className="nur-ground-glow"
        cx="120"
        cy="322"
        rx="88"
        ry="15"
        fill="url(#nur-ground)"
      />

      {/* ---- Rays escaping outward, blurred and turning slowly ---- */}
      <g className="nur-rays" filter="url(#nur-soft)">
        <g className="nur-rays-inner">
          {Array.from({ length: RAY_COUNT }, (_, i) => (
            <path
              key={i}
              d="M120,186 L110,-40 L130,-40 Z"
              fill="url(#nur-flame-outer)"
              opacity="0.5"
              transform={`rotate(${(360 / RAY_COUNT) * i} 120 186)`}
            />
          ))}
        </g>
      </g>

      {/* ---- Halo ---- */}
      <circle
        className="nur-halo"
        cx="120"
        cy="186"
        r="120"
        fill="url(#nur-halo-grad)"
      />

      {/* ---- The lantern itself, swaying from the hook ---- */}
      <g className="nur-sway">
        {/* Chain and hook */}
        <g
          fill="none"
          stroke="url(#nur-brass)"
          strokeWidth="2.2"
          strokeLinecap="round"
        >
          <circle cx="120" cy="9" r="7" />
          <ellipse cx="120" cy="21" rx="3.6" ry="5.5" />
          <ellipse cx="120" cy="30" rx="3.6" ry="5.5" />
          <ellipse cx="120" cy="39" rx="3.6" ry="5.5" />
        </g>

        {/* Finial */}
        <path
          d="M120,44 L127,56 L120,68 L113,56 Z"
          fill="url(#nur-brass)"
        />

        {/* Crown */}
        <path
          d="M80,100 C86,82 100,66 120,62 C140,66 154,82 160,100"
          fill="none"
          stroke="url(#nur-brass)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M80,100 C86,82 100,66 120,62 C140,66 154,82 160,100 Z"
          fill="#15131f"
          opacity="0.85"
        />
        <path
          d="M92,92 C98,80 108,72 120,69 C132,72 142,80 148,92"
          fill="none"
          stroke="url(#nur-brass)"
          strokeWidth="1.2"
          opacity="0.8"
        />

        {/* Interior: dark glass, then light, rays and flames clipped to it */}
        <g clipPath="url(#nur-body-clip)">
          <path d={BODY_PATH} fill="#15131f" />
          <path d={BODY_PATH} fill="url(#nur-interior)" />

          <g className="nur-rays">
            <g className="nur-rays-inner">
              {Array.from({ length: RAY_COUNT }, (_, i) => (
                <path
                  key={i}
                  d="M120,186 L112,-40 L128,-40 Z"
                  fill="#f5d98a"
                  opacity="0.55"
                  transform={`rotate(${(360 / RAY_COUNT) * i} 120 186)`}
                />
              ))}
            </g>
          </g>

          {/* Three flames, three rhythms */}
          <g filter="url(#nur-flame-glow)">
            <path
              className="nur-flame-a"
              d="M120,214 C100,206 96,186 106,168 C112,157 118,150 120,142 C122,150 128,157 134,168 C144,186 140,206 120,214 Z"
              fill="url(#nur-flame-outer)"
            />
            <path
              className="nur-flame-b"
              d="M120,212 C108,205 105,190 112,176 C116,168 119,162 120,156 C121,162 124,168 128,176 C135,190 132,205 120,212 Z"
              fill="url(#nur-flame-mid)"
            />
            <path
              className="nur-flame-c"
              d="M120,210 C114,205 112,195 116,186 C118,181 119,177 120,173 C121,177 122,181 124,186 C128,195 126,205 120,210 Z"
              fill="#fff8e7"
            />
          </g>

          {/* The lattice the light passes through */}
          <path d={BODY_PATH} fill="url(#nur-mashrabiya)" opacity="0.9" />
        </g>

        {/* Body outline and rims */}
        <path
          d={BODY_PATH}
          fill="none"
          stroke="url(#nur-brass)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M78,100 H162"
          stroke="url(#nur-brass)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M86,270 H154"
          stroke="url(#nur-brass)"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Base */}
        <path
          d="M88,270 L152,270 L163,292 L77,292 Z"
          fill="#15131f"
          stroke="url(#nur-brass)"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <rect
          x="72"
          y="292"
          width="96"
          height="10"
          rx="4"
          fill="url(#nur-brass)"
        />

        {/* Embers */}
        <g>
          {EMBERS.map((ember, i) => (
            <circle
              key={i}
              className="nur-ember"
              cx={ember.x}
              cy={ember.y}
              r={ember.r}
              fill="#f5d98a"
              style={
                {
                  "--drift": `${ember.drift}px`,
                  "--dur": `${ember.dur}s`,
                  "--delay": `${ember.delay}s`,
                } as React.CSSProperties
              }
            />
          ))}
        </g>
      </g>
    </svg>
  );
}
