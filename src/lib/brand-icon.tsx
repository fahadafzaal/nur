/**
 * NUR's app icon, drawn as SVG so every size Android and iOS ask for is
 * sharp: a gold eight-point star (the khatam from the Fanous lattice)
 * around a flame, on the ink background.
 *
 * `inset` shrinks the emblem toward the centre. Android "maskable" icons
 * may be cropped to a circle or squircle, so their artwork must sit inside
 * the central 80% safe zone.
 */
export function brandIconSvg(inset = 0) {
  const s = 1 - inset;
  const t = (50 * (1 - s)).toFixed(2);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#c9a227"/>
      <stop offset="0.5" stop-color="#f5d98a"/>
      <stop offset="1" stop-color="#c9a227"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="55%" r="50%">
      <stop offset="0" stop-color="#f5d98a" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#0b0a12" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100" height="100" fill="#0b0a12"/>
  <g transform="translate(${t} ${t}) scale(${s})">
    <circle cx="50" cy="54" r="40" fill="url(#glow)"/>
    <path d="M50 10 L61 27 L81 23 L77 43 L94 54 L77 65 L81 85 L61 81 L50 98 L39 81 L19 85 L23 65 L6 54 L23 43 L19 23 L39 27 Z"
          fill="none" stroke="url(#g)" stroke-width="3.2" stroke-linejoin="round"/>
    <path d="M50 76 C40 71 38 61 44 52 C47 47 49 43 50 36 C51 43 53 47 56 52 C62 61 60 71 50 76 Z" fill="url(#g)"/>
    <path d="M50 73 C46 70 45 65 47 60 C48 58 49.5 55 50 52 C50.5 55 52 58 53 60 C55 65 54 70 50 73 Z" fill="#fff6e0"/>
  </g>
</svg>`;
}

export function brandIconDataUrl(inset = 0) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(brandIconSvg(inset))}`;
}
