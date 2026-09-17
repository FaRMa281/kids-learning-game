import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { useRoundState } from '../common/useRoundState'
import BigButton from '../../components/BigButton'
import IslandShell, { LessonFrame, OptionButton } from '../common/IslandShell'
import { pick, shuffle } from '../common/phrases'
import { useLesson } from '../common/useLesson'
import { LETTERS, LEVELS, PHRASES } from './data'

export const MODE_ID = 'letters'

/** Собираем вопрос для буквы idx */
function makeQuiz(letters, idx, difficulty) {
  const cur = letters[idx]
  const others = letters.filter((_, i) => i !== idx)
  if (difficulty === 'easy') {
    const correct = pick(cur.words)
    const wrong = shuffle(others).slice(0, 2).map((l) => pick(l.words))
    return {
      kind: 'pic',
      prompt: cur.letter,
      options: shuffle([{ ...correct, ok: true }, ...wrong.map((w) => ({ ...w, ok: false }))]),
    }
  }
  const target = pick(cur.words)
  const wrong = shuffle(others).slice(0, 2)
  return {
    kind: 'letter',
    prompt: target,
    options: shuffle([{ letter: cur.letter, ok: true }, ...wrong.map((l) => ({ letter: l.letter, ok: false }))]),
  }
}

function Lesson({ level, onFinish, onBack }) {
  const letters = LETTERS[level.lang]
  const P = PHRASES[level.lang]
  const lesson = useLesson({ lang: level.lang, total: letters.length, onFinish, theme: level.theme })
  const { idx, say, play, setMascot } = lesson

  const [step, setStep] = useRoundState(idx, 'show') // show | quiz
  const [quiz, setQuiz] = useState(null)
  const cur = letters[idx]

  // новая буква → показ + озвучка
  useEffect(() => {
    const t = setTimeout(() => {
      say(cur.say, level.lang)
      setMascot('talk', P.show(cur.letter))
    }, 400)
    return () => clearTimeout(t)
  }, [idx, cur, level.lang, say, setMascot, P])

  const startQuiz = useCallback(() => {
    const q = makeQuiz(letters, idx, level.difficulty)
    setQuiz(q)
    setStep('quiz')
    const text = q.kind === 'pic' ? P.askPic(q.prompt) : P.askLetter(q.prompt.word)
    setMascot('talk', text)
    setTimeout(() => say(text, level.lang), 200)
  }, [letters, idx, level, P, say, setMascot, setStep])

  return (
    <LessonFrame lesson={lesson} onBack={onBack} dots={letters.map((l) => l.letter)}>
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
            <motion.button
              className="big-letter"
              onClick={() => say(cur.say, level.lang)}
              whileTap={{ scale: 0.9 }}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.1 }}
            >
              {cur.letter}
            </motion.button>
            <div className="word-row">
              {cur.words.map((w, i) => (
                <motion.button
                  key={w.word}
                  className="word-card"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.12 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => {
                    play('click')
                    say(w.word, level.lang)
                  }}
                >
                  <span className="word-card__pic">{w.pic}</span>
                  <span className="word-card__word">
                    <b>{w.word[0]}</b>
                    {w.word.slice(1)}
                  </span>
                </motion.button>
              ))}
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
            {quiz.kind === 'pic' ? (
              <div className="quiz-prompt quiz-prompt--letter">{quiz.prompt}</div>
            ) : (
              <div className="quiz-prompt quiz-prompt--pic">
                <span>{quiz.prompt.pic}</span>
                <small>{quiz.prompt.word}</small>
              </div>
            )}
            <div className="option-row">
              {quiz.options.map((opt, i) => (
                <OptionButton key={i} id={i} isCorrect={opt.ok} lesson={lesson}>
                  {quiz.kind === 'pic' ? (
                    <span className="option__pic">{opt.pic}</span>
                  ) : (
                    <span className="option__letter">{opt.letter}</span>
                  )}
                </OptionButton>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </LessonFrame>
  )
}

export default function LettersIsland(props) {
  return <IslandShell modeId={MODE_ID} title="🔤 Остров букв" levels={LEVELS} Lesson={Lesson} {...props} />
}
