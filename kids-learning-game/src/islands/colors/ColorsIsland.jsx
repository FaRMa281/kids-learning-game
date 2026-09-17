import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { useRoundState } from '../common/useRoundState'
import BigButton from '../../components/BigButton'
import IslandShell, { LessonFrame, OptionButton } from '../common/IslandShell'
import { pick, shuffle } from '../common/phrases'
import { starsByMistakes, useLesson } from '../common/useLesson'
import { COLORS, LEVELS, PHRASES } from './data'

export const MODE_ID = 'colors'

function makeRounds(level) {
  const order = shuffle(COLORS)
  if (level.kind === 'learn') {
    return order.map((c) => {
      const others = shuffle(COLORS.filter((x) => x.id !== c.id)).slice(0, 2)
      return { color: c, item: pick(c.items), options: shuffle([c, ...others]) }
    })
  }
  // find: 2–3 целевых предмета + 3–4 чужих, всего 6
  return order.map((c) => {
    const targets = shuffle(c.items).slice(0, 2 + Math.round(Math.random()))
    const others = shuffle(COLORS.filter((x) => x.id !== c.id).flatMap((x) => x.items.map((it) => ({ pic: it, color: x.id }))))
    const cells = [
      ...targets.map((pic) => ({ pic, color: c.id })),
      ...others.slice(0, 6 - targets.length),
    ]
    return { color: c, cells: shuffle(cells).map((cell, i) => ({ ...cell, id: i })), need: targets.length }
  })
}

// ---------------------------------------------------------------- learn: показ → выбор плашки
function LearnRound({ round, lesson, lang, onQuiz, step }) {
  const { say, play } = lesson
  const P = PHRASES[lang]
  const name = round.color[lang]
  return (
    <AnimatePresence mode="wait">
      {step === 'show' ? (
        <motion.section
          key="show"
          className="lesson__body"
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -80 }}
          transition={{ duration: 0.35 }}
        >
          <motion.button
            className="swatch swatch--big"
            style={{ background: round.color.hex }}
            onClick={() => say(name, lang)}
            whileTap={{ scale: 0.92 }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 14 }}
          >
            {name}
          </motion.button>
          <div className="word-row">
            {round.color.items.slice(0, 4).map((pic, i) => (
              <motion.button
                key={pic}
                className="word-card word-card--pic-only"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  play('click')
                  say(name, lang)
                }}
              >
                <span className="word-card__pic">{pic}</span>
              </motion.button>
            ))}
          </div>
          <BigButton color="green" onClick={onQuiz} className="lesson__next">
            {lesson.P.next} ➡️
          </BigButton>
        </motion.section>
      ) : (
        <motion.section
          key="quiz"
          className="lesson__body"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <motion.button className="quiz-prompt quiz-prompt--text" onClick={() => say(P.askColor(round.color), lang)} whileTap={{ scale: 0.95 }}>
            🔊 {P.askColor(round.color)}
          </motion.button>
          <div className="option-row">
            {round.options.map((c) => (
              <OptionButton key={c.id} id={c.id} isCorrect={c.id === round.color.id} lesson={lesson} className="option--swatch">
                <span className="swatch" style={{ background: c.hex }} />
              </OptionButton>
            ))}
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  )
}

// ---------------------------------------------------------------- find: найди все предметы цвета
function FindRound({ round, lesson, lang }) {
  const { say } = lesson
  const P = PHRASES[lang]
  const [found, setFound] = useState([])
  const [shaking, setShaking] = useState(null)

  const tap = (cell) => {
    if (lesson.locked || found.includes(cell.id)) return
    if (cell.color === round.color.id) {
      const next = [...found, cell.id]
      setFound(next)
      if (next.length === round.need) {
        lesson.correct()
      } else {
        lesson.partial()
        lesson.setMascot('talk', P.more(round.need - next.length), true)
      }
    } else {
      setShaking(cell.id)
      setTimeout(() => setShaking(null), 500)
      lesson.wrong()
    }
  }

  return (
    <motion.section
      className="lesson__body"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <motion.button className="quiz-prompt quiz-prompt--text" onClick={() => say(P.askFind(round.color), lang)} whileTap={{ scale: 0.95 }}>
        <span className="swatch swatch--small" style={{ background: round.color.hex }} /> {P.askFind(round.color)}
      </motion.button>
      <div className="find-grid">
        {round.cells.map((cell, i) => {
          const ok = found.includes(cell.id)
          return (
            <motion.button
              key={cell.id}
              className={`option option--find ${ok ? 'option--ok' : ''}`}
              initial={{ scale: 0 }}
              animate={shaking === cell.id ? { x: [0, -14, 14, -8, 8, 0], scale: 1 } : { scale: ok ? 1.08 : 1, x: 0 }}
              transition={{ delay: shaking === cell.id ? 0 : i * 0.06, duration: 0.4 }}
              whileTap={!ok ? { scale: 0.9 } : {}}
              onClick={() => tap(cell)}
            >
              <span className="option__pic">{cell.pic}</span>
              {ok && <span className="option__check">✅</span>}
            </motion.button>
          )
        })}
      </div>
    </motion.section>
  )
}

function Lesson({ level, onFinish, onBack }) {
  const rounds = useMemo(() => makeRounds(level), [level])
  const lang = level.lang
  const P = PHRASES[lang]
  const lesson = useLesson({
    lang,
    total: rounds.length,
    onFinish,
    starsFn: level.kind === 'find' ? starsByMistakes([1, 4]) : undefined,
    theme: level.theme,
  })
  const { idx, say, setMascot } = lesson
  const round = rounds[idx]
  const [step, setStep] = useRoundState(idx, 'show')

  useEffect(() => {
    const t = setTimeout(() => {
      if (level.kind === 'learn') {
        say(round.color[lang], lang)
        setMascot('talk', P.show(round.color))
      } else {
        setMascot('talk', P.askFind(round.color), true)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [idx, round, level.kind, lang, say, setMascot, P])

  const startQuiz = () => {
    setStep('quiz')
    setMascot('talk', P.askColor(round.color), true)
  }

  return (
    <LessonFrame lesson={lesson} onBack={onBack} dots={rounds.map(() => '●')}>
      <AnimatePresence mode="wait">
        <motion.div key={idx} className="lesson__round" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {level.kind === 'learn' ? (
            <LearnRound round={round} lesson={lesson} lang={lang} step={step} onQuiz={startQuiz} />
          ) : (
            <FindRound round={round} lesson={lesson} lang={lang} />
          )}
        </motion.div>
      </AnimatePresence>
    </LessonFrame>
  )
}

export default function ColorsIsland(props) {
  return <IslandShell modeId={MODE_ID} title="🌈 Остров цветов" levels={LEVELS} Lesson={Lesson} {...props} />
}
