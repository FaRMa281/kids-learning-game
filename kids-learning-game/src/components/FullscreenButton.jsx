import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { canFullscreen, enterFullscreen, exitFullscreen, isStandalone } from '../device'

/** Кнопка «во весь экран» — на всех экранах; в установленном PWA скрыта (там и так весь экран) */
export default function FullscreenButton() {
  const [on, setOn] = useState(() => !!document.fullscreenElement)
  useEffect(() => {
    const h = () => setOn(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', h)
    return () => document.removeEventListener('fullscreenchange', h)
  }, [])
  if (!canFullscreen() || isStandalone()) return null
  return (
    <motion.button
      className="round-btn fs-btn"
      whileTap={{ scale: 0.85 }}
      whileHover={{ scale: 1.08 }}
      onClick={() => (on ? exitFullscreen() : enterFullscreen())}
      aria-label={on ? 'Выйти из полного экрана' : 'На весь экран'}
      title={on ? 'Выйти из полного экрана' : 'На весь экран'}
    >
      {on ? '🡼' : '⛶'}
    </motion.button>
  )
}
