import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { admin } from '../admin/bridge'
import { isTouch } from '../device'
import { useSound } from '../audio/SoundContext'
import FullscreenButton from '../components/FullscreenButton'
import IslandArt from '../components/IslandArt'
import Mascot from '../components/Mascot'
import SoundButton from '../components/SoundButton'
import Stars from '../components/Stars'
import { ISLANDS } from '../islands'
import { createScene } from './map/scene'
import { createWater } from './map/water'

/** Лучшие звёзды по режиму — максимум по всем уровням */
function bestStars(summary, mode) {
  return summary.filter((s) => s.mode === mode).reduce((m, s) => Math.max(m, s.best), 0)
}

/** Перспектива: остров ближе к нижнему краю — крупнее */
const islandScale = (y) => 0.74 + (y / 100) * 0.4

/** Вентилятор: сдувает тучи. При нажатии раскручивается, увеличивается и сдвигается вправо-вверх */
function Fan({ onBlow }) {
  const [active, setActive] = useState(false)
  const click = () => {
    if (active) return
    setActive(true)
    onBlow()
    setTimeout(() => setActive(false), 3000)
  }
  return (
    <motion.button
      className={`fan ${active ? 'fan--on' : ''}`}
      onClick={click}
      aria-label="Разогнать тучи"
      title="Разогнать тучи"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      animate={active ? { scale: 1.45, x: 36, y: -36 } : { scale: 1, x: 0, y: 0 }}
      transition={{ type: 'spring', stiffness: 160, damping: 14 }}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <circle cx="50" cy="50" r="46" fill="#fff" stroke="#2b2d42" strokeWidth="4" />
        <circle cx="50" cy="50" r="40" fill="none" stroke="#8ecae6" strokeWidth="3" strokeDasharray="6 8" />
        <g className="fan__blades">
          {[0, 120, 240].map((a) => (
            <path
              key={a}
              d="M50 50 C 58 38, 74 30, 80 44 C 82 52, 62 56, 50 50 Z"
              fill="#1982c4"
              stroke="#2b2d42"
              strokeWidth="2.5"
              transform={`rotate(${a} 50 50)`}
            />
          ))}
          <circle cx="50" cy="50" r="7" fill="#ffca3a" stroke="#2b2d42" strokeWidth="2.5" />
        </g>
      </svg>
    </motion.button>
  )
}

export default function MapScreen({ summary, apiOk, onPickIsland }) {
  const { play, setWantMusic } = useSound()
  const canvasRef = useRef(null)
  const waterRef = useRef(null)
  const sceneRef = useRef(null)
  const darkRef = useRef(null)
  const flashRef = useRef(null)
  const floatRefs = useRef([]) // .island__float на каждый остров
  const rootRef = useRef(null)
  const playRef = useRef(play)
  useEffect(() => {
    playRef.current = play
  }, [play])

  useEffect(() => {
    setWantMusic(true)
    return () => setWantMusic(false)
  }, [setWantMusic])

  useEffect(() => {
    const canvas = canvasRef.current
    const water = createWater(waterRef.current)
    const scene = createScene(canvas, {
      water,
      onThunder: () => playRef.current('thunder'),
      onOverlay: (dark, flash) => {
        if (darkRef.current) darkRef.current.style.opacity = dark
        if (flashRef.current) flashRef.current.style.opacity = flash
      },
    })

    // положения островов в px — для пены под ними и обхода корабликами
    const measure = () => {
      const rect = canvas.getBoundingClientRect()
      scene.setIslands(
        floatRefs.current.filter(Boolean).map((el) => {
          const land = el.querySelector('.island__land').getBoundingClientRect()
          // ватерлиния острова: эллипс на 72% высоты картинки, шириной ~88% (см. IslandArt)
          return {
            x: land.left + land.width / 2 - rect.left,
            y: land.top + land.height * 0.72 - rect.top - land.height * 0.35,
            r: land.width * 0.44,
            h: land.height,
          }
        }),
      )
    }

    sceneRef.current = scene
    scene.start()
    admin.set('scene', scene)
    if (import.meta.env.DEV) window.__scene = scene
    measure()
    const measureTimer = setTimeout(measure, 800) // после анимации появления
    window.addEventListener('resize', measure)

    // в шторм острова и пальмы качаются сильнее: амплитуда — CSS-переменные, меняются плавно с уровнем
    const root = rootRef.current
    const stormPoll = setInterval(() => {
      const l = scene.weather.level
      if (!root) return
      root.style.setProperty('--sway', (3 + l * 9).toFixed(2))
      root.style.setProperty('--float-amp', (7 + l * 7).toFixed(1) + 'px')
      root.style.setProperty('--float-rot', (1 + l * 1.8).toFixed(2) + 'deg')
    }, 100)

    return () => {
      clearInterval(stormPoll)
      clearTimeout(measureTimer)
      window.removeEventListener('resize', measure)
      admin.set('scene', null)
      scene.destroy()
      water.destroy()
    }
  }, [])

  return (
    <div
      className="screen map"
      ref={rootRef}
      onPointerDown={(e) => {
        // тап по пустой воде: если рядом кораблик — подпрыгнет (зона попадания шире для пальца)
        if (e.target !== canvasRef.current && e.target !== waterRef.current && e.target !== rootRef.current) return
        const rect = canvasRef.current.getBoundingClientRect()
        if (sceneRef.current?.tapAt(e.clientX - rect.left, e.clientY - rect.top, isTouch() ? 52 : 30)) play('pop')
      }}
    >
      <canvas ref={waterRef} className="scene-water" aria-hidden />
      <canvas ref={canvasRef} className="scene-canvas" aria-hidden />

      <header className="topbar topbar--map">
        <h1 className="title title--map">🏝️ Острова знаний</h1>
        <div className="topbar__actions">
          <FullscreenButton />
          <SoundButton />
        </div>
      </header>

      {ISLANDS.map((isl, i) => {
        const stars = bestStars(summary, isl.id)
        return (
          <motion.button
            key={isl.id}
            className="island"
            style={{
              left: `${isl.pos.x}%`,
              top: `${isl.pos.y}%`,
              '--island-color': isl.color,
              '--island-scale': islandScale(isl.pos.y),
              zIndex: 3 + Math.round(isl.pos.y / 10),
            }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.12, type: 'spring', stiffness: 220, damping: 14 }}
            whileHover={{ scale: 1.05, y: 3 }}
            whileTap={{ scale: 0.95, y: 8 }}
            onPointerDown={(e) => {
              // импульс на воде под островом
              const canvas = canvasRef.current
              const land = e.currentTarget.querySelector('.island__land')
              if (!canvas || !land) return
              const rect = canvas.getBoundingClientRect()
              const lr = land.getBoundingClientRect()
              sceneRef.current?.ripple(lr.left + lr.width / 2 - rect.left, lr.top + lr.height * 0.72 - rect.top)
            }}
            onClick={() => {
              play('click')
              onPickIsland(isl.id)
            }}
          >
            <span
              className="island__float"
              style={{ '--float-delay': `${-i * 1.3}s`, '--float-dur': `${4.6 + (i % 3) * 0.7}s` }}
              ref={(el) => (floatRefs.current[i] = el)}
            >
              <span className="island__land">
                <IslandArt color={isl.color} />
                <span className="island__icon">{isl.icon}</span>
              </span>
              <span className="island__label">{isl.title}</span>
              <Stars filled={stars} size={22} />
            </span>
          </motion.button>
        )
      })}

      {/* затемнение и вспышка грозы — поверх островов, управляются сценой напрямую */}
      <div ref={darkRef} className="scene-dark" aria-hidden />
      <div ref={flashRef} className="scene-flash" aria-hidden />

      <Fan
        onBlow={() => {
          play('wind')
          sceneRef.current?.blow()
        }}
      />

      <Mascot
        text={apiOk === false && import.meta.env.VITE_API_URL ? 'Сервер спит, но звёзды я запомню!' : 'Привет! Выбери остров!'}
        className="mascot--corner"
      />
    </div>
  )
}
