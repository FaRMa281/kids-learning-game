import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { useRoundState } from '../common/useRoundState'
import IslandShell, { LessonFrame } from '../common/IslandShell'
import { pick } from '../common/phrases'
import { starsByMistakes, useLesson } from '../common/useLesson'
import { LEVELS, PALETTE, PHRASES, PICTURES } from './data'

export const MODE_ID = 'coloring'
const EMPTY = []

/** Рендер SVG-фигуры зоны/декора по описанию из data.js */
function Shape({ shape, ...rest }) {
  const { tag, ...attrs } = shape
  const Tag = tag
  return <Tag {...attrs} {...rest} />
}

function Picture({ picture, labelOf, filled, shakingZone, onZone }) {
  return (
    <svg className="coloring-svg" viewBox="0 0 400 300">
      {picture.zones.map((z) => {
        const done = filled.includes(z.id)
        return (
          <motion.g
            key={z.id}
            className={`zone ${done ? 'zone--done' : ''}`}
            onClick={() => onZone(z)}
            animate={shakingZone === z.id ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Shape
              shape={z.shape}
              fill={done ? PALETTE[z.key].hex : '#fff'}
              stroke="#2b2d42"
              strokeWidth="3"
              style={{ transition: 'fill .3s' }}
            />
            {!done && (
              <text x={z.label[0]} y={z.label[1]} className="zone__label" textAnchor="middle" dominantBaseline="central">
                {labelOf(z.key)}
              </text>
            )}
          </motion.g>
        )
      })}
      {picture.decor?.map((d, i) => (
        <Shape key={i} shape={d} pointerEvents="none" />
      ))}
    </svg>
  )
}

function Lesson({ level, onFinish, onBack }) {
  const pictures = useMemo(() => level.pictures.map((id) => PICTURES.find((p) => p.id === id)), [level])
  const lesson = useLesson({ total: pictures.length, onFinish, starsFn: starsByMistakes(level.stars), theme: level.theme })
  const { idx, setMascot, say, play } = lesson
  const picture = pictures[idx]

  // подпись для цвета: keys[i] → labels[i]
  const labelOf = (key) => level.labels[picture.keys.indexOf(key)]

  const [selected, setSelected] = useRoundState(idx, null)
  const [filled, setFilled] = useRoundState(idx, EMPTY)
  const [shakingZone, setShakingZone] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => setMascot('talk', PHRASES.start(picture.title), true), 400)
    return () => clearTimeout(t)
  }, [idx, picture, setMascot])

  const pickColor = (key) => {
    play('click')
    setSelected(key)
    const label = labelOf(key)
    setMascot('talk', PHRASES.picked(label, key))
    say(`${label}, ${PALETTE[key].ru}`)
  }

  const onZone = (z) => {
    if (lesson.locked || filled.includes(z.id)) return
    if (!selected) {
      setMascot('talk', PHRASES.pickFirst, true)
      return
    }
    if (z.key === selected) {
      const next = [...filled, z.id]
      setFilled(next)
      const left = picture.zones.length - next.length
      if (left === 0) lesson.correct()
      else {
        lesson.partial()
        if (left <= 3) setMascot('talk', PHRASES.more(left))
      }
    } else {
      setShakingZone(z.id)
      setTimeout(() => setShakingZone(null), 450)
      lesson.wrong(undefined, pick(PHRASES.wrong))
    }
  }

  const progressText = `${filled.length} / ${picture.zones.length}`

  return (
    <LessonFrame lesson={lesson} onBack={onBack} dots={pictures.map((p) => p.title[0])} className="lesson--coloring">
      <AnimatePresence mode="wait">
        <motion.section
          key={idx}
          className="lesson__body lesson__body--coloring"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <div className="coloring-frame">
            <Picture picture={picture} labelOf={labelOf} filled={filled} shakingZone={shakingZone} onZone={onZone} />
            <span className="coloring-progress">{progressText}</span>
          </div>
          <div className="palette">
            {picture.keys.map((key) => (
              <motion.button
                key={key}
                className={`palette__btn ${selected === key ? 'palette__btn--on' : ''}`}
                style={{ background: PALETTE[key].hex }}
                whileTap={{ scale: 0.9 }}
                animate={{ scale: selected === key ? 1.15 : 1, y: selected === key ? -8 : 0 }}
                onClick={() => pickColor(key)}
              >
                {labelOf(key)}
              </motion.button>
            ))}
          </div>
        </motion.section>
      </AnimatePresence>
    </LessonFrame>
  )
}

export default function ColoringIsland(props) {
  return <IslandShell modeId={MODE_ID} title="🎨 Остров раскрасок" levels={LEVELS} Lesson={Lesson} {...props} />
}
