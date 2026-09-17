import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import IslandShell, { LessonFrame, OptionButton } from '../common/IslandShell'
import { pick, range, shuffle } from '../common/phrases'
import { starsByMistakes, useLesson } from '../common/useLesson'
import { ITEMS, LEVELS, PHRASES } from './data'

export const MODE_ID = 'pictures'

// ---------------------------------------------------------------- найди пару
function PairsLesson({ level, onFinish, onBack }) {
  const lesson = useLesson({ total: 1, onFinish, starsFn: starsByMistakes(level.stars), theme: level.theme })
  const { play, setMascot } = lesson
  const P = PHRASES.pairs

  const cards = useMemo(() => {
    const items = shuffle(ITEMS).slice(0, level.pairs)
    return shuffle([...items, ...items]).map((it, i) => ({ ...it, key: i }))
  }, [level.pairs])

  const [open, setOpen] = useState([]) // key открытых, но ещё не проверенных (≤2)
  const [matched, setMatched] = useState([])
  const busy = useRef(false)

  useEffect(() => {
    setMascot('talk', P.start, true)
  }, [setMascot, P])

  const flip = (card) => {
    if (busy.current || open.includes(card.key) || matched.includes(card.key)) return
    play('click')
    const next = [...open, card.key]
    setOpen(next)
    if (next.length < 2) return
    busy.current = true
    const [a, b] = next.map((k) => cards[k])
    if (a.id === b.id) {
      const m = [...matched, a.key, b.key]
      setTimeout(() => {
        setMatched(m)
        setOpen([])
        busy.current = false
        if (m.length === cards.length) lesson.correct({ phrase: pick(lesson.P.good) })
        else {
          lesson.partial()
          setMascot('happy', pick(P.match), true)
        }
      }, 450)
    } else {
      setTimeout(() => {
        setOpen([])
        busy.current = false
        lesson.wrong(undefined, pick(P.miss))
      }, 900)
    }
  }

  return (
    <LessonFrame lesson={lesson} onBack={onBack} dots={range(level.pairs).map(() => '●')} progress={matched.length / 2} className="lesson--pairs">
      <section className="lesson__body">
        <div className={`pairs-grid pairs-grid--${level.pairs}`}>
          {cards.map((card, i) => {
            const faceUp = open.includes(card.key) || matched.includes(card.key)
            const done = matched.includes(card.key)
            return (
              <motion.button
                key={card.key}
                className={`card ${done ? 'card--done' : ''}`}
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: done ? 0.92 : 1, rotate: 0 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 260, damping: 16 }}
                whileTap={!faceUp ? { scale: 0.92 } : {}}
                onClick={() => flip(card)}
              >
                <motion.div
                  className="card__inner"
                  animate={{ rotateY: faceUp ? 180 : 0 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="card__face card__back">❔</div>
                  <div className="card__face card__front">{card.pic}</div>
                </motion.div>
              </motion.button>
            )
          })}
        </div>
      </section>
    </LessonFrame>
  )
}

// ---------------------------------------------------------------- послушай и найди
function ListenLesson({ level, onFinish, onBack }) {
  const lang = level.lang
  const P = PHRASES.listen[lang]
  const rounds = useMemo(() => {
    const targets = shuffle(ITEMS).slice(0, level.rounds)
    return targets.map((t) => {
      const others = shuffle(ITEMS.filter((x) => x.id !== t.id)).slice(0, level.options - 1)
      return { target: t, options: shuffle([t, ...others]) }
    })
  }, [level])
  const lesson = useLesson({ lang, total: rounds.length, onFinish, theme: level.theme })
  const { idx, say, setMascot } = lesson
  const round = rounds[idx]

  useEffect(() => {
    const t = setTimeout(() => setMascot('talk', P.say(round.target), true), 400)
    return () => clearTimeout(t)
  }, [idx, round, setMascot, P])

  return (
    <LessonFrame lesson={lesson} onBack={onBack}>
      <AnimatePresence mode="wait">
        <motion.section
          key={idx}
          className="lesson__body"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <motion.button className="quiz-prompt quiz-prompt--text" onClick={() => say(P.say(round.target), lang)} whileTap={{ scale: 0.95 }}>
            🔊 {P.ask(round.target)}
          </motion.button>
          <div className={`option-row ${level.options > 4 ? 'option-row--six' : ''}`}>
            {round.options.map((it) => (
              <OptionButton key={it.id} id={it.id} isCorrect={it.id === round.target.id} lesson={lesson} className={level.options > 4 ? 'option--small' : ''}>
                <span className="option__pic">{it.pic}</span>
              </OptionButton>
            ))}
          </div>
        </motion.section>
      </AnimatePresence>
    </LessonFrame>
  )
}

function Lesson(props) {
  return props.level.kind === 'pairs' ? <PairsLesson {...props} /> : <ListenLesson {...props} />
}

export default function PicturesIsland(props) {
  return <IslandShell modeId={MODE_ID} title="🧩 Остров картинок" levels={LEVELS} Lesson={Lesson} {...props} />
}
