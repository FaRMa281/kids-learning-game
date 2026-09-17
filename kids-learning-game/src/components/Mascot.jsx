import { motion } from 'motion/react'

const ANIM = {
  idle: { y: [0, -8, 0], rotate: 0, transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } },
  happy: {
    y: [0, -60, 0, -30, 0],
    rotate: [0, -12, 12, -6, 0],
    transition: { duration: 0.9, ease: 'easeOut' },
  },
  oops: { x: [0, -10, 10, -6, 0], rotate: [0, -6, 6, 0], transition: { duration: 0.5 } },
  talk: { scale: [1, 1.06, 1], transition: { duration: 0.5, repeat: 3 } },
}

/**
 * Луми — персонаж-проводник. mood: idle | happy | oops | talk
 * Ключ на motion.div сбрасывает анимацию при смене mood, чтобы happy проигрывался каждый раз.
 */
export default function Mascot({ mood = 'idle', bump = 0, text, size = 140, className = '' }) {
  const happy = mood === 'happy'
  return (
    <div className={`mascot ${className}`}>
      {text && (
        <motion.div
          key={text}
          className="mascot__bubble"
          initial={{ opacity: 0, scale: 0.7, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        >
          {text}
        </motion.div>
      )}
      <motion.svg
        key={`${mood}-${bump}`}
        width={size}
        height={size}
        viewBox="0 0 120 120"
        animate={ANIM[mood] ?? ANIM.idle}
        style={{ originY: 1 }}
      >
        {/* тень */}
        <ellipse cx="60" cy="112" rx="34" ry="6" fill="rgba(0,0,0,.12)" />
        {/* тело */}
        <circle cx="60" cy="64" r="44" fill="#FFB703" />
        <circle cx="60" cy="72" r="30" fill="#FFD166" />
        {/* хохолок */}
        <path d="M60 20 Q52 6 44 12 Q56 10 60 20 Z" fill="#FB8500" />
        <path d="M60 20 Q64 4 74 10 Q64 10 60 20 Z" fill="#FB8500" />
        {/* глаза */}
        <ellipse cx="45" cy="58" rx="9" ry={happy ? 4 : 11} fill="#fff" />
        <ellipse cx="75" cy="58" rx="9" ry={happy ? 4 : 11} fill="#fff" />
        {!happy && (
          <>
            <circle cx="47" cy="60" r="5" fill="#2B2D42" />
            <circle cx="77" cy="60" r="5" fill="#2B2D42" />
            <circle cx="49" cy="58" r="1.8" fill="#fff" />
            <circle cx="79" cy="58" r="1.8" fill="#fff" />
          </>
        )}
        {/* щёчки */}
        <circle cx="36" cy="74" r="6" fill="#FF7B9C" opacity=".7" />
        <circle cx="84" cy="74" r="6" fill="#FF7B9C" opacity=".7" />
        {/* рот */}
        {mood === 'oops' ? (
          <ellipse cx="60" cy="82" rx="6" ry="4" fill="#2B2D42" />
        ) : (
          <path
            d={happy ? 'M44 78 Q60 100 76 78 Z' : 'M48 80 Q60 92 72 80'}
            stroke="#2B2D42"
            strokeWidth="4"
            strokeLinecap="round"
            fill={happy ? '#2B2D42' : 'none'}
          />
        )}
        {/* лапки */}
        <ellipse cx="30" cy="96" rx="10" ry="7" fill="#FB8500" />
        <ellipse cx="90" cy="96" rx="10" ry="7" fill="#FB8500" />
      </motion.svg>
    </div>
  )
}
