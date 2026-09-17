import { motion } from 'motion/react'
import { useSound } from '../audio/SoundContext'

/**
 * Кнопка «Назад»: деревянная табличка со стрелкой. Цвет дерева/акцента — из темы острова
 * через CSS-переменную --accent на .island-screen.
 */
export default function BackButton({ onClick, label = 'Назад' }) {
  const { play } = useSound()
  return (
    <motion.button
      className="back-btn"
      onClick={() => {
        play('click')
        onClick()
      }}
      whileTap={{ scale: 0.9, y: 3 }}
      whileHover={{ scale: 1.06, y: -2 }}
      aria-label={label}
      title={label}
    >
      <svg viewBox="0 0 120 80" width="100%" height="100%" aria-hidden>
        <defs>
          <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c98a4b" />
            <stop offset="0.5" stopColor="#a86a33" />
            <stop offset="1" stopColor="#7d4a1f" />
          </linearGradient>
        </defs>
        {/* доска с закруглёнными краями, «прожилки» дерева */}
        <path d="M12 12 h96 a10 10 0 0 1 10 10 v36 a10 10 0 0 1 -10 10 h-96 a10 10 0 0 1 -10 -10 v-36 a10 10 0 0 1 10 -10 z" fill="url(#wood)" stroke="#4a2b10" strokeWidth="4" />
        <path d="M14 26 q30 4 60 0 t32 2 M14 44 q40 -5 70 0 t22 -2 M14 60 q30 3 60 0" fill="none" stroke="rgba(74,43,16,0.35)" strokeWidth="2" strokeLinecap="round" />
        {/* гвоздики */}
        {[[16, 16], [104, 16], [16, 64], [104, 64]].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r="3.2" fill="#e9d9c3" stroke="#4a2b10" strokeWidth="1.5" />
        ))}
        {/* стрелка */}
        <path d="M78 40 H46 M58 26 L44 40 L58 54" fill="none" stroke="#fff3d6" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M78 40 H46 M58 26 L44 40 L58 54" fill="none" stroke="var(--accent, #e76f51)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </motion.button>
  )
}
