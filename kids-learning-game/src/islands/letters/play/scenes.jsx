import { forwardRef } from 'react'

/**
 * Три сцены 3-го экрана. Каждая = фон (слои CSS/SVG с анимацией) + «приёмник» (слот):
 *   pier   — бухта с водой, причал, катер с флагом-слотом; токены на спасательных кругах
 *   chest  — берег, пальма, сундук; токены — мыльные пузыри; слот — корзина
 *   sunken — под водой: каустика, водоросли, рыбки; токены — ракушки; слот — сундук с сокровищами
 *
 * Слот принимает: filled (сколько собрано), slots (сколько ячеек для sequence), letters (что уже в слоте),
 * celebrate (победа: гудок/дым/сияние).
 */

// ---------------------------------------------------------------- ПРИЧАЛ
export const PierScene = forwardRef(function PierScene({ filled, slots, letters, celebrate, children }, slotRef) {
  return (
    <div className="stage stage--pier">
      <div className="pier__sky" />
      <div className="pier__sun" />
      <div className="pier__cloud pier__cloud--1">☁️</div>
      <div className="pier__cloud pier__cloud--2">☁️</div>
      <div className="pier__sea">
        <div className="wave wave--a" />
        <div className="wave wave--b" />
        <div className="wave wave--c" />
      </div>
      <div className="pier__dock">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className="pier__plank" />
        ))}
        <span className="pier__pole pier__pole--1" />
        <span className="pier__pole pier__pole--2" />
      </div>
      {/* катер у причала */}
      <div className={`boat ${celebrate ? 'boat--yay' : ''}`}>
        <div className="boat__smoke">
          <i />
          <i />
          <i />
        </div>
        <svg viewBox="0 0 220 120" className="boat__svg" aria-hidden>
          <defs>
            <linearGradient id="hullG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ff7b7b" />
              <stop offset="1" stopColor="#c62828" />
            </linearGradient>
          </defs>
          <path d="M10 70 Q20 62 40 64 H200 Q214 64 210 76 L196 104 H30 Q12 104 10 86 Z" fill="url(#hullG)" stroke="#5a1a1a" strokeWidth="3" />
          <path d="M20 84 H198" stroke="#fff" strokeWidth="4" opacity="0.8" />
          <rect x="70" y="30" width="80" height="36" rx="8" fill="#f8f9fa" stroke="#5a1a1a" strokeWidth="3" />
          <rect x="80" y="38" width="16" height="14" rx="4" fill="#8ecae6" />
          <rect x="104" y="38" width="16" height="14" rx="4" fill="#8ecae6" />
          <rect x="128" y="38" width="16" height="14" rx="4" fill="#8ecae6" />
          <rect x="150" y="14" width="14" height="22" rx="3" fill="#ffca3a" stroke="#5a1a1a" strokeWidth="3" />
          <path d="M40 66 V22" stroke="#5a1a1a" strokeWidth="4" strokeLinecap="round" />
        </svg>
        {/* флаг-слот на мачте */}
        <div ref={slotRef} className={`slot slot--flag ${filled ? 'slot--filled' : ''} ${celebrate ? 'slot--yay' : ''}`}>
          <SlotContent slots={slots} letters={letters} placeholder="?" />
        </div>
      </div>
      {children}
    </div>
  )
})

// ---------------------------------------------------------------- СУНДУК
export const ChestScene = forwardRef(function ChestScene({ filled, slots, letters, celebrate, children }, slotRef) {
  return (
    <div className="stage stage--chest">
      <div className="beach__sky" />
      <div className="beach__sea" />
      <div className="beach__sand" />
      <svg className="beach__palm" viewBox="0 0 120 220" aria-hidden>
        <path d="M60 220 C 62 170, 66 120, 80 70" stroke="#7a4a1e" strokeWidth="12" fill="none" strokeLinecap="round" />
        <g transform="translate(80 70)" className="beach__leaves">
          {[-160, -120, -80, -40, 0, 30].map((a) => (
            <path key={a} d="M0 0 C 14 -12, 44 -12, 56 4 C 40 8, 20 12, 0 8 Z" fill="#2e7d32" stroke="#1b5e20" strokeWidth="2" transform={`rotate(${a})`} />
          ))}
          <circle cx="0" cy="6" r="7" fill="#8d5a2b" />
          <circle cx="-10" cy="8" r="6" fill="#a0672f" />
        </g>
      </svg>
      {/* сундук — источник пузырей */}
      <div className={`chest ${celebrate ? 'chest--yay' : ''}`}>
        <svg viewBox="0 0 160 120" className="chest__svg" aria-hidden>
          <rect x="10" y="50" width="140" height="62" rx="10" fill="#8d5a2b" stroke="#4a2b10" strokeWidth="4" />
          <rect x="10" y="50" width="140" height="14" fill="#6b3f18" />
          <path className="chest__lid" d="M10 52 Q10 18 80 18 Q150 18 150 52 Z" fill="#a86a33" stroke="#4a2b10" strokeWidth="4" />
          <rect x="68" y="56" width="24" height="20" rx="4" fill="#ffca3a" stroke="#4a2b10" strokeWidth="3" />
          <circle cx="80" cy="66" r="3" fill="#4a2b10" />
          <path d="M30 22 Q80 -10 130 22" stroke="#ffd166" strokeWidth="0" fill="none" />
        </svg>
        <div className="chest__glow" />
      </div>
      {/* корзина-слот */}
      <div ref={slotRef} className={`slot slot--basket ${filled ? 'slot--filled' : ''} ${celebrate ? 'slot--yay' : ''}`}>
        <svg viewBox="0 0 140 90" className="basket__svg" aria-hidden>
          <path d="M8 26 H132 L118 84 H22 Z" fill="#d9a066" stroke="#7a4a1e" strokeWidth="4" />
          <path d="M22 40 H118 M26 54 H114 M30 68 H110" stroke="#7a4a1e" strokeWidth="3" opacity="0.6" />
          <path d="M40 26 Q70 -10 100 26" stroke="#7a4a1e" strokeWidth="6" fill="none" strokeLinecap="round" />
        </svg>
        <div className="slot__inner">
          <SlotContent slots={slots} letters={letters} placeholder="" />
        </div>
      </div>
      {children}
    </div>
  )
})

// ---------------------------------------------------------------- ЗАТОНУВШИЙ ГОРОД
export const SunkenScene = forwardRef(function SunkenScene({ filled, slots, letters, celebrate, children }, slotRef) {
  return (
    <div className="stage stage--sunken">
      <div className="sea__deep" />
      <div className="caustic caustic--1" />
      <div className="caustic caustic--2" />
      <div className="sea__rays" />
      {['🐠', '🐟', '🐡', '🐙'].map((f, i) => (
        <span key={i} className={`fish fish--${i + 1}`}>
          {f}
        </span>
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} className="bubbleUp" style={{ '--i': i }} />
      ))}
      <div className="seabed">
        {Array.from({ length: 7 }, (_, i) => (
          <svg key={i} className="weed" style={{ '--i': i }} viewBox="0 0 40 160" aria-hidden>
            <path d="M20 160 C 10 120, 30 100, 20 60 C 12 30, 26 20, 20 0" stroke="#2a9d8f" strokeWidth="10" fill="none" strokeLinecap="round" />
          </svg>
        ))}
        <span className="ruin ruin--1" />
        <span className="ruin ruin--2" />
      </div>
      {/* сундук с сокровищами — слот */}
      <div ref={slotRef} className={`slot slot--treasure ${filled ? 'slot--filled' : ''} ${celebrate ? 'slot--yay' : ''}`}>
        <svg viewBox="0 0 160 120" aria-hidden>
          <rect x="10" y="50" width="140" height="62" rx="10" fill="#8d5a2b" stroke="#4a2b10" strokeWidth="4" />
          <path d="M10 52 Q10 18 80 18 Q150 18 150 52 Z" fill="#a86a33" stroke="#4a2b10" strokeWidth="4" />
          <rect x="68" y="56" width="24" height="20" rx="4" fill="#ffca3a" stroke="#4a2b10" strokeWidth="3" />
          <path d="M20 50 Q80 34 140 50" stroke="#ffd166" strokeWidth="6" fill="none" />
        </svg>
        <div className="slot__inner slot__inner--treasure">
          <SlotContent slots={slots} letters={letters} placeholder="" />
        </div>
      </div>
      {children}
    </div>
  )
})

/** содержимое слота: для sequence — ячейки по буквам, иначе — собранные буквы/счётчик */
function SlotContent({ slots, letters, placeholder }) {
  if (slots) {
    return (
      <span className="slot__cells">
        {Array.from({ length: slots }, (_, i) => (
          <span key={i} className={`slot__cell ${letters[i] ? 'slot__cell--on' : ''}`}>
            {letters[i] ?? ''}
          </span>
        ))}
      </span>
    )
  }
  if (letters.length) {
    return <span className="slot__letters">{letters.map((l, i) => <b key={i}>{l}</b>)}</span>
  }
  return <span className="slot__placeholder">{placeholder}</span>
}

export const SCENE_COMPONENTS = { pier: PierScene, chest: ChestScene, sunken: SunkenScene }
