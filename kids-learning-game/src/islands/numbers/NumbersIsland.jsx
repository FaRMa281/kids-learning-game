import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo } from 'react'
import { useRoundState } from '../common/useRoundState'
import BigButton from '../../components/BigButton'
import IslandShell, { LessonFrame, OptionButton } from '../common/IslandShell'
import { pick, range, shuffle } from '../common/phrases'
import { useLesson } from '../common/useLesson'
import { COUNT_ITEMS, LEVELS, PHRASES } from './data'

export const MODE_ID = 'numbers'

const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1))

/** Варианты ответа: правильное число + соседние, перемешанные */
function makeOptions(correct, count, min, max) {
  const pool = range(max - min + 1).map((i) => i + min).filter((n) => n !== correct)
  return shuffle([correct, ...shuffle(pool).slice(0, count - 1)])
}

/** Раунды уровня */
function makeRounds(level) {
  if (level.kind === 'count') {
    return range(level.to - level.from + 1).map((i) => {
      const n = level.from + i
      const q = randInt(level.from, level.to) // вопрос — случайное число диапазона
      return {
        show: n,
        showItem: pick(COUNT_ITEMS),
        quiz: { n: q, item: pick(COUNT_ITEMS), options: makeOptions(q, level.options, Math.max(1, level.from - 2), level.to) },
      }
    })
  }
  return range(level.rounds).map(() => {
    const a = randInt(1, level.maxSum - 1)
    const b = randInt(1, level.maxSum - a)
    const item = pick(COUNT_ITEMS)
    return { quiz: { a, b, item, n: a + b, options: makeOptions(a + b, level.options, 1, level.maxSum) } }
  })
}

/** Группа предметов; тап по предмету — озвучить порядковый номер */
function Items({ item, n, onTap, delay = 0 }) {
  return (
    <div className={`items items--${n > 5 ? 'many' : 'few'}`}>
      {range(n).map((i) => (
        <motion.button
          key={i}
          className="item"
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: delay + i * 0.08, type: 'spring', stiffness: 300, damping: 14 }}
          whileTap={{ scale: 1.3 }}
          onClick={() => onTap?.(i + 1)}
        >
          {item}
        </motion.button>
      ))}
    </div>
  )
}

function Lesson({ level, onFinish, onBack }) {
  const rounds = useMemo(() => makeRounds(level), [level])
  const lesson = useLesson({ total: rounds.length, onFinish, theme: level.theme })
  const { idx, say, play, setMascot } = lesson
  const round = rounds[idx]
  const [step, setStep] = useRoundState(idx, round.show ? 'show' : 'quiz')

  useEffect(() => {
    const r = rounds[idx]
    const t = setTimeout(() => {
      if (r.show) {
        say(String(r.show))
        setMascot('talk', PHRASES.show(r.show))
      } else {
        setMascot('talk', PHRASES.askSum, true)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [idx, rounds, say, setMascot])

  const startQuiz = () => {
    setStep('quiz')
    setMascot('talk', PHRASES.askCount, true)
  }

  const dots = rounds.map((r) => (r.show ? String(r.show) : '+'))

  return (
    <LessonFrame lesson={lesson} onBack={onBack} dots={dots}>
      <AnimatePresence mode="wait">
        {step === 'show' ? (
          <motion.section
            key={`show-${idx}`}
            className="lesson__body"
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -80 }}
            transition={{ duration: 0.35 }}
          >
            <div className="numbers-show">
              <motion.button
                className="big-letter big-letter--digit"
                onClick={() => say(String(round.show))}
                whileTap={{ scale: 0.9 }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 14 }}
              >
                {round.show}
              </motion.button>
              <Items
                item={round.showItem}
                n={round.show}
                delay={0.3}
                onTap={(k) => {
                  play('click')
                  say(String(k))
                }}
              />
            </div>
            <BigButton color="green" onClick={startQuiz} className="lesson__next">
              {lesson.P.next} ➡️
            </BigButton>
          </motion.section>
        ) : (
          <motion.section
            key={`quiz-${idx}`}
            className="lesson__body"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            {level.kind === 'count' ? (
              <div className="quiz-prompt quiz-prompt--items">
                <Items item={round.quiz.item} n={round.quiz.n} onTap={(k) => say(String(k))} />
              </div>
            ) : (
              <div className="quiz-prompt quiz-prompt--sum">
                <Items item={round.quiz.item} n={round.quiz.a} onTap={(k) => say(String(k))} />
                <span className="sum-sign">+</span>
                <Items item={round.quiz.item} n={round.quiz.b} onTap={(k) => say(String(round.quiz.a + k))} />
                <span className="sum-sign">=</span>
                <span className="sum-sign">?</span>
              </div>
            )}
            <div className="option-row">
              {round.quiz.options.map((n) => (
                <OptionButton key={n} id={n} isCorrect={n === round.quiz.n} lesson={lesson} className="option--digit">
                  <span className="option__letter">{n}</span>
                </OptionButton>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </LessonFrame>
  )
}

export default function NumbersIsland(props) {
  return <IslandShell modeId={MODE_ID} title="🔢 Остров цифр" levels={LEVELS} Lesson={Lesson} {...props} />
}
