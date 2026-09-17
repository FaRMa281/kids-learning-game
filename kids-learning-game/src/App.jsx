import { AnimatePresence, motion } from 'motion/react'
import { Suspense, useCallback, useEffect, useState } from 'react'
import AdminPanel from './admin/AdminPanel'
import { getSummary } from './api'
import { SoundProvider } from './audio/SoundContext'
import Preloader from './components/Preloader'
import RotateOverlay from './components/RotateOverlay'
import { ISLANDS } from './islands'
import MapScreen from './screens/MapScreen'

const screenAnim = {
  initial: { opacity: 0, scale: 1.08 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.94 },
  transition: { duration: 0.35, ease: 'easeInOut' },
}

/** что грузим на старте: шрифт и чанки всех островов — потом переходы мгновенные и работают офлайн */
const PRELOAD = [
  { label: 'Шрифты', run: () => document.fonts?.ready ?? Promise.resolve() },
  ...ISLANDS.map((isl) => ({ label: isl.title, run: isl.load })),
]

export default function App() {
  const [ready, setReady] = useState(false)
  const [islandId, setIslandId] = useState(null) // null = карта
  const [summary, setSummary] = useState([])
  const [apiOk, setApiOk] = useState(null)

  const refreshSummary = useCallback(() => {
    getSummary()
      .then((s) => {
        setSummary(s)
        setApiOk(Boolean(import.meta.env.VITE_API_URL))
      })
      .catch((e) => {
        // сервер недоступен — показываем локальный прогресс
        if (e?.local) setSummary(e.local)
        setApiOk(false)
      })
  }, [])

  useEffect(refreshSummary, [refreshSummary])

  const island = ISLANDS.find((i) => i.id === islandId)
  const goMap = () => setIslandId(null)

  let screen
  if (!island) {
    screen = <MapScreen summary={summary} apiOk={apiOk} onPickIsland={setIslandId} />
  } else {
    const Island = island.component
    screen = (
      <Suspense fallback={null}>
        <Island summary={summary} island={island} onBack={goMap} onProgressSaved={refreshSummary} />
      </Suspense>
    )
  }

  return (
    <SoundProvider>
      {ready ? (
        <AnimatePresence mode="wait">
          <motion.div key={islandId ?? 'map'} className="screen-wrap" {...screenAnim}>
            {screen}
          </motion.div>
        </AnimatePresence>
      ) : (
        <Preloader tasks={PRELOAD} onDone={() => setReady(true)} />
      )}
      <RotateOverlay />
      <AdminPanel onProgressCleared={refreshSummary} />
    </SoundProvider>
  )
}
