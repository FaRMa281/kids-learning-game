import { useId } from 'react'

/** осветлить/затемнить #rrggbb на k (−1..1) */
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16)
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + (k > 0 ? (255 - c) * k : c * k))))
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`
}

/**
 * Остров в 2.5D: тень на воде, песчаная отмель и пляж, скалы, объёмный купол в цвете острова,
 * трава и пальмы (качаются CSS-анимацией .isl__palm / .isl__grass; в шторм — сильнее).
 * viewBox 200×150, ватерлиния ≈ y 108.
 */
export default function IslandArt({ color = '#8ac926' }) {
  const id = useId().replace(/:/g, '')
  const top = shade(color, 0.35)
  const side = shade(color, -0.28)
  return (
    <svg className="isl" viewBox="0 0 200 150" aria-hidden>
      <defs>
        <radialGradient id={`dome-${id}`} cx="38%" cy="28%" r="80%">
          <stop offset="0" stopColor={top} />
          <stop offset="0.55" stopColor={color} />
          <stop offset="1" stopColor={side} />
        </radialGradient>
        <linearGradient id={`sand-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbeec4" />
          <stop offset="1" stopColor="#e2c27a" />
        </linearGradient>
        <linearGradient id={`rock-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b3bcc7" />
          <stop offset="1" stopColor="#6f7a88" />
        </linearGradient>
        <filter id={`blur-${id}`} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {/* тень на воде */}
      <ellipse cx="104" cy="130" rx="92" ry="13" fill="rgba(0,25,70,0.38)" filter={`url(#blur-${id})`} />
      {/* отмель под водой */}
      <ellipse cx="100" cy="118" rx="96" ry="21" fill="#9fe3ef" opacity="0.6" />
      {/* пляж */}
      <ellipse cx="100" cy="108" rx="88" ry="24" fill={`url(#sand-${id})`} stroke="#c9a45c" strokeWidth="1.5" />
      <ellipse cx="96" cy="104" rx="70" ry="15" fill="#fff6d8" opacity="0.55" />

      {/* скалы */}
      <path d="M26 100 L36 72 L52 66 L64 80 L68 100 Z" fill={`url(#rock-${id})`} stroke="#4f5865" strokeWidth="1.5" />
      <path d="M36 72 L52 66 L58 82 L44 88 Z" fill="#d6dde6" opacity="0.7" />
      <path d="M150 102 L158 84 L172 80 L182 92 L184 102 Z" fill={`url(#rock-${id})`} stroke="#4f5865" strokeWidth="1.5" />
      <path d="M158 84 L172 80 L174 90 L162 92 Z" fill="#d6dde6" opacity="0.6" />

      {/* купол острова */}
      <path
        d="M34 100 C 34 58, 66 34, 100 34 C 134 34, 166 58, 166 100 Z"
        fill={`url(#dome-${id})`}
        stroke={shade(color, -0.45)}
        strokeWidth="2.5"
      />
      {/* обрыв справа — тень */}
      <path d="M118 36 C 148 46, 166 70, 166 100 L 146 100 C 146 72, 134 50, 118 36 Z" fill="rgba(0,0,0,0.16)" />
      {/* блик слева-сверху */}
      <path d="M60 52 C 70 42, 86 38, 100 38 C 88 42, 76 50, 66 62 Z" fill="rgba(255,255,255,0.35)" />

      {/* трава */}
      <g className="isl__grass" stroke="#2e7d32" strokeWidth="2.2" strokeLinecap="round" fill="none">
        <path d="M74 98 q2 -9 6 -14 M80 99 q0 -8 3 -12 M86 99 q-1 -7 -5 -11" />
        <path d="M118 99 q2 -8 6 -12 M124 100 q0 -7 3 -10 M130 99 q-2 -7 -6 -10" />
      </g>

      {/* большая пальма справа */}
      <g className="isl__palm" style={{ transformOrigin: '148px 98px' }}>
        <path d="M148 98 C 150 82, 152 66, 160 50" stroke="#7a4a1e" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M148 98 C 150 82, 152 66, 160 50" stroke="#b07a3c" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray="3 5" />
        <g transform="translate(160 50)">
          {[-150, -110, -70, -30, 10, 40].map((a) => (
            <path
              key={a}
              d="M0 0 C 8 -6, 24 -6, 30 2 C 22 4, 12 6, 0 4 Z"
              fill={a % 80 === 10 ? '#43a047' : '#2e7d32'}
              stroke="#1b5e20"
              strokeWidth="1"
              transform={`rotate(${a})`}
            />
          ))}
          <circle cx="0" cy="3" r="3.2" fill="#8d5a2b" />
          <circle cx="-5" cy="4" r="3" fill="#a0672f" />
        </g>
      </g>
      {/* маленькая пальма слева */}
      <g className="isl__palm isl__palm--small" style={{ transformOrigin: '56px 100px' }}>
        <path d="M56 100 C 55 90, 52 80, 46 72" stroke="#7a4a1e" strokeWidth="4" fill="none" strokeLinecap="round" />
        <g transform="translate(46 72) scale(0.62)">
          {[-160, -120, -80, -40, 0, 30].map((a) => (
            <path key={a} d="M0 0 C 8 -6, 24 -6, 30 2 C 22 4, 12 6, 0 4 Z" fill="#388e3c" stroke="#1b5e20" strokeWidth="1.2" transform={`rotate(${a})`} />
          ))}
        </g>
      </g>
    </svg>
  )
}
