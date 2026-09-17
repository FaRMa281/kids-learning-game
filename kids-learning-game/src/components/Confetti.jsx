import { AnimatePresence, motion } from 'motion/react'
import { useMemo } from 'react'

const COLORS = ['#FF595E', '#FFCA3A', '#8AC926', '#1982C4', '#6A4C93', '#FF7B9C']
const SHAPES = ['●', '★', '■', '▲', '♥']

/** Взрыв конфетти из центра экрана. burst — любое значение; новое значение = новый взрыв */
export default function Confetti({ burst, count = 45 }) {
  const pieces = useMemo(() => {
    if (!burst) return []
    return Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4
      const dist = 180 + Math.random() * 260
      return {
        id: `${burst}-${i}`,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist * 0.7 - 100,
        color: COLORS[i % COLORS.length],
        shape: SHAPES[i % SHAPES.length],
        rot: Math.random() * 720 - 360,
        size: 18 + Math.random() * 20,
      }
    })
  }, [burst, count])

  return (
    <div className="confetti-layer" aria-hidden>
      <AnimatePresence>
        {pieces.map((p) => (
          <motion.span
            key={p.id}
            className="confetti-piece"
            style={{ color: p.color, fontSize: p.size }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.5 }}
            animate={{ x: p.x, y: [p.y, p.y + 400], opacity: [1, 1, 0], rotate: p.rot, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: 'easeOut' }}
          >
            {p.shape}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  )
}
