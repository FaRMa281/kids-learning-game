import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { isMusicPlaying, playMusic, sfx, speak, stopMusic, stopSpeaking, unlockAudio } from './engine'

const SoundContext = createContext(null)
const STORAGE_KEY = 'kids-learning:muted'

export function SoundProvider({ children }) {
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })
  const [unlocked, setUnlocked] = useState(false)
  // где сейчас хотим музыку (карта — да, внутри уровня — нет)
  const [wantMusic, setWantMusic] = useState(false)

  // первый жест пользователя разблокирует AudioContext
  useEffect(() => {
    const unlock = () => {
      unlockAudio()
      setUnlocked(true)
    }
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  // вкладка скрыта / окно свёрнуто → музыка и озвучка молчат
  const [visible, setVisible] = useState(() => !document.hidden)
  useEffect(() => {
    const onVis = () => {
      setVisible(!document.hidden)
      if (document.hidden) stopSpeaking()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  useEffect(() => {
    if (!unlocked) return
    if (wantMusic && !muted && visible) playMusic()
    else if (isMusicPlaying()) stopMusic()
  }, [wantMusic, muted, unlocked, visible])

  const toggleMuted = useCallback(() => {
    setMuted((m) => {
      const next = !m
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      if (next) stopSpeaking()
      return next
    })
  }, [])

  const play = useCallback(
    (name, ...args) => {
      if (muted) return
      unlockAudio() // на всякий случай: если контекст «уснул» (мобильные браузеры), будим внутри жеста
      sfx[name]?.(...args)
    },
    [muted],
  )

  const say = useCallback(
    (text, lang, opts) => {
      if (muted) return
      speak(text, lang, opts)
    },
    [muted],
  )

  return (
    <SoundContext.Provider value={{ muted, toggleMuted, play, say, setWantMusic }}>
      {children}
    </SoundContext.Provider>
  )
}

export function useSound() {
  return useContext(SoundContext)
}
