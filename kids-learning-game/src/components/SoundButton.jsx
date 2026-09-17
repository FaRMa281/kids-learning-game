import { motion } from 'motion/react'
import { useSound } from '../audio/SoundContext'

export default function SoundButton() {
  const { muted, toggleMuted } = useSound()
  return (
    <motion.button
      className="round-btn sound-btn"
      onClick={toggleMuted}
      whileTap={{ scale: 0.85 }}
      whileHover={{ scale: 1.08 }}
      aria-label={muted ? 'Включить звук' : 'Выключить звук'}
      title={muted ? 'Включить звук' : 'Выключить звук'}
    >
      {muted ? '🔇' : '🔊'}
    </motion.button>
  )
}
