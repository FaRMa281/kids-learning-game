import { motion } from 'motion/react'
import { useViewport } from '../device'

/** На телефоне в портретной ориентации закрываем игру просьбой повернуть устройство */
export default function RotateOverlay() {
  const vp = useViewport()
  if (!vp.portraitPhone) return null
  return (
    <div className="rotate">
      <motion.div
        className="rotate__phone"
        animate={{ rotate: [0, 0, -90, -90, 0] }}
        transition={{ duration: 3.2, times: [0, 0.2, 0.5, 0.8, 1], repeat: Infinity, ease: 'easeInOut' }}
      >
        📱
      </motion.div>
      <div className="rotate__title">Поверни телефон</div>
      <div className="rotate__sub">Играть удобнее, когда экран лежит боком</div>
    </div>
  )
}
