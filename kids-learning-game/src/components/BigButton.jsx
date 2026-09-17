import { motion } from 'motion/react'
import { useSound } from '../audio/SoundContext'

/** Крупная кнопка для детских пальцев. color: yellow | green | blue | pink */
export default function BigButton({ children, onClick, color = 'yellow', className = '', ...rest }) {
  const { play } = useSound()
  return (
    <motion.button
      className={`big-btn big-btn--${color} ${className}`}
      onClick={(e) => {
        play('click')
        onClick?.(e)
      }}
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.04 }}
      {...rest}
    >
      {children}
    </motion.button>
  )
}
