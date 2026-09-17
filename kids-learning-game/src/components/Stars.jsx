import { motion } from 'motion/react'
import { useId } from 'react'

const PATH = 'M50 6 L61 37 L94 38 L68 58 L78 92 L50 72 L22 92 L32 58 L6 38 L39 37 Z'

/** одна звезда: золотой градиент, обводка, блик и бегущее сияние; пустая — полупрозрачная */
function Star({ on, size }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg className={`star ${on ? 'star--on' : ''}`} width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff2a8" />
          <stop offset="0.5" stopColor="#ffca3a" />
          <stop offset="1" stopColor="#f59f00" />
        </linearGradient>
        <linearGradient id={`s${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="rgba(255,255,255,0)" />
          <stop offset="0.5" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="1" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <clipPath id={`c${id}`}>
          <path d={PATH} />
        </clipPath>
      </defs>
      <path
        d={PATH}
        fill={on ? `url(#g${id})` : 'rgba(255,255,255,0.5)'}
        stroke={on ? '#b8720a' : 'rgba(35,48,71,0.3)'}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      {on && (
        <>
          <ellipse cx="42" cy="34" rx="9" ry="5" fill="rgba(255,255,255,0.6)" transform="rotate(-30 42 34)" />
          <rect className="star__shine" x="-60" y="0" width="40" height="100" fill={`url(#s${id})`} clipPath={`url(#c${id})`} />
        </>
      )}
    </svg>
  )
}

/** Три звезды, из них `filled` закрашены. animated — появляются по очереди */
export default function Stars({ filled = 0, size = 48, animated = false, onStar }) {
  return (
    <div className="stars">
      {[0, 1, 2].map((i) => {
        const on = i < filled
        return (
          <motion.span
            key={i}
            className="stars__slot"
            style={{ animationDelay: `${i * 0.4}s` }}
            initial={animated ? { scale: 0, rotate: -90 } : false}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: animated ? 0.3 + i * 0.35 : 0, type: 'spring', stiffness: 300, damping: 12 }}
            onAnimationComplete={() => animated && on && onStar?.(i)}
          >
            <Star on={on} size={size} />
          </motion.span>
        )
      })}
    </div>
  )
}
