import { motion, useMotionValue, useSpring, useTransform, useVelocity } from 'motion/react'
import { useRef } from 'react'

/**
 * Перетаскиваемый токен (буква на круге / пузырь / ракушка).
 * - захват: scale 1.12, наклон по скорости, «поп», след из искр (onTrail)
 * - отпустили: onDrop(token, point) решает; если не принято — сам пружинит на место (dragSnapToOrigin)
 * - тап без перетаскивания: onTap(token) — токен сам летит в слот (удобно на телефоне)
 */
export default function Token({ token, skin, delay = 0, disabled, onDrop, onTap, onGrab, onTrail, float = true, style }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const vx = useVelocity(x)
  const tilt = useSpring(useTransform(vx, [-1500, 0, 1500], [-14, 0, 14]), { stiffness: 300, damping: 20 })
  const dragged = useRef(false)
  const lastTrail = useRef(0)

  return (
    <motion.button
      type="button"
      className={`tok tok--${skin} ${token.kind ? `tok--${token.kind}` : ''} ${float ? 'tok--float' : ''} ${token.ring ? `tok--ring-${token.ring}` : ''}`}
      style={{ x, y, rotate: tilt, '--delay': `${delay}s`, ...style }}
      drag={!disabled}
      dragSnapToOrigin
      dragElastic={1}
      dragMomentum={false}
      whileDrag={{ scale: 1.12, zIndex: 20 }}
      whileTap={{ scale: 1.06 }}
      onDragStart={() => {
        dragged.current = true
        onGrab?.(token)
      }}
      onDrag={(_e, info) => {
        const now = performance.now()
        if (now - lastTrail.current > 45) {
          lastTrail.current = now
          onTrail?.(info.point)
        }
      }}
      onDragEnd={(_e, info) => {
        onDrop?.(token, info.point)
        setTimeout(() => (dragged.current = false), 50)
      }}
      onTap={() => {
        if (dragged.current || disabled) return
        onTap?.(token)
      }}
      aria-label={token.text}
    >
      {token.kind === 'piece' ? (
        // кусочек буквы: вся буква, обрезанная по горизонтальной полосе i из n
        <span
          className="tok__piece"
          style={{ clipPath: `inset(${(token.piece.i / token.piece.n) * 100}% 0 ${100 - ((token.piece.i + 1) / token.piece.n) * 100}% 0)` }}
        >
          {token.text}
        </span>
      ) : (
        <span className="tok__text">{token.text}</span>
      )}
      {token.pic && <span className="tok__pic">{token.pic}</span>}
    </motion.button>
  )
}
