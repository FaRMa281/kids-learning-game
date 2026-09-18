import { animate, motion, useMotionValue, useSpring, useTransform, useVelocity } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useSound } from '../audio/SoundContext'

/**
 * Горизонтальный пейджер экранов уровней: свайп пальцем/мышью с пружиной, 3D-стрелки,
 * пагинация-«жемчужины». Карточки наклоняются по направлению движения (по скорости трека).
 *
 * pages: [{ id, title, sub, levels }]; renderCard(level, index, tilt) → карточка
 */
export default function PagedLevels({ pages, renderCard, initial = 0, onPageChange }) {
  const { play } = useSound()
  const ref = useRef(null)
  const [W, setW] = useState(0)
  const [page, setPage] = useState(initial)
  const x = useMotionValue(0)
  const vel = useVelocity(x)
  const tilt = useSpring(useTransform(vel, [-2000, 0, 2000], [7, 0, -7]), { stiffness: 220, damping: 22 })

  // ширина одной страницы = ширина контейнера
  useEffect(() => {
    const el = ref.current
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    setW(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  const goTo = (p, velocity = 0) => {
    const next = Math.max(0, Math.min(pages.length - 1, p))
    if (next !== page) play('click')
    setPage(next)
    onPageChange?.(next)
    animate(x, -next * W, { type: 'spring', stiffness: 260, damping: 30, velocity })
  }

  useEffect(() => {
    x.set(-page * W)
  }, [W]) // eslint-disable-line react-hooks/exhaustive-deps

  const onDragEnd = (_e, info) => {
    const swipe = info.offset.x + info.velocity.x * 0.25
    if (swipe < -W * 0.2) goTo(page + 1, info.velocity.x)
    else if (swipe > W * 0.2) goTo(page - 1, info.velocity.x)
    else goTo(page, info.velocity.x)
  }

  return (
    <div className="pager" ref={ref}>
      <motion.div
        className="pager__track"
        style={{ x, width: `${pages.length * 100}%` }}
        drag="x"
        dragConstraints={{ left: -(pages.length - 1) * W, right: 0 }}
        dragElastic={0.12}
        dragMomentum={false}
        onDragEnd={onDragEnd}
      >
        {pages.map((pg, pi) => (
          <section key={pg.id} className={`pager__page ${pi === page ? 'pager__page--active' : ''}`} style={{ width: W || undefined }} aria-hidden={pi !== page}>
            <header className="pager__head">
              <span className="pager__title">{pg.title}</span>
              <span className="pager__sub">{pg.sub}</span>
            </header>
            <div className="level-grid level-grid--6">{pg.levels.map((lv, i) => renderCard(lv, i, tilt, pi === page))}</div>
          </section>
        ))}
      </motion.div>

      <button className="pager__arrow pager__arrow--left" onClick={() => goTo(page - 1)} disabled={page === 0} aria-label="Предыдущий экран">
        <span>‹</span>
      </button>
      <button className="pager__arrow pager__arrow--right" onClick={() => goTo(page + 1)} disabled={page === pages.length - 1} aria-label="Следующий экран">
        <span>›</span>
      </button>

      <div className="pearls" role="tablist">
        {pages.map((pg, i) => (
          <button key={pg.id} role="tab" aria-selected={i === page} className={`pearl ${i === page ? 'pearl--on' : ''}`} onClick={() => goTo(i)} aria-label={pg.title} />
        ))}
      </div>
    </div>
  )
}
