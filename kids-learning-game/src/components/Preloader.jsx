import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import Mascot from './Mascot'

/**
 * Экран загрузки: грузит шрифт и чанки островов, показывает прогресс.
 * tasks: [{ label, run: () => Promise }] — выполняются параллельно, прогресс = доля завершённых.
 */
export default function Preloader({ tasks, onDone, minMs = 700 }) {
  const [done, setDone] = useState(0)
  const [label, setLabel] = useState(tasks[0]?.label ?? '')

  useEffect(() => {
    let alive = true
    const started = performance.now()
    let finished = 0
    Promise.all(
      tasks.map((task) =>
        Promise.resolve()
          .then(task.run)
          .catch(() => {}) // одна упавшая задача не должна вешать игру
          .then(() => {
            if (!alive) return
            finished += 1
            setDone(finished)
            setLabel(task.label)
          }),
      ),
    ).then(() => {
      const wait = Math.max(0, minMs - (performance.now() - started))
      setTimeout(() => alive && onDone(), wait)
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 100
  return (
    <div className="preloader">
      <Mascot mood="talk" text="Секундочку, готовлю острова…" size={150} />
      <div className="preloader__bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <motion.div className="preloader__fill" animate={{ width: `${pct}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
      </div>
      <div className="preloader__label">
        {label} · {pct}%
      </div>
    </div>
  )
}
