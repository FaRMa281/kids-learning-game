import { useCallback, useEffect, useRef, useState } from 'react'
import { admin } from '../../admin/bridge'
import { useSound } from '../../audio/SoundContext'
import { UI, pick } from './phrases'

/** Звёзды по умолчанию: сколько раундов решено с первой попытки */
export function starsByFirstTry(firstTry, total) {
  if (firstTry === total) return 3
  if (firstTry >= total - 2) return 2
  return 1
}

/** Звёзды по числу ошибок: [max для 3 звёзд, max для 2 звёзд] */
export const starsByMistakes =
  ([three, two]) =>
  (_firstTry, _total, mistakes) =>
    mistakes <= three ? 3 : mistakes <= two ? 2 : 1

/**
 * Общая механика урока: раунды, маскот, конфетти, правильный/неправильный ответ, звёзды.
 *
 * lesson.answer(ok, id)   — ответ одним вариантом (id — чтобы «погасить» неверный вариант)
 * lesson.correct()        — раунд решён (для заданий с несколькими действиями)
 * lesson.wrong(id?)       — ошибка без завершения раунда
 * lesson.setMascot(mood, text, speak?) — реплика маскота
 */
export function useLesson({ lang = 'ru', total, onFinish, starsFn = starsByFirstTry, advanceDelay = 1500, theme = null }) {
  const { play, say } = useSound()
  const P = UI[lang]

  const [idx, setIdx] = useState(0)
  const [locked, setLocked] = useState(false)
  const [wrongIds, setWrongIds] = useState([])
  const [mascotState, setMascotState] = useState({ mood: 'talk', bump: 0, text: '' })
  const [burst, setBurst] = useState(0)

  const firstTry = useRef(0)
  const tried = useRef(false)
  const mistakes = useRef(0)
  const idxRef = useRef(0)

  const setMascot = useCallback(
    (mood, text, speakIt = false) => {
      setMascotState((m) => ({ mood, bump: m.bump + 1, text }))
      if (speakIt && text) say(text, lang)
    },
    [say, lang],
  )

  const resetQuestion = useCallback(() => {
    setLocked(false)
    setWrongIds([])
    tried.current = false
  }, [])

  const finish = useCallback(
    (stars) => onFinish(stars ?? starsFn(firstTry.current, total, mistakes.current)),
    [onFinish, starsFn, total],
  )

  const advance = useCallback(() => {
    if (idxRef.current + 1 < total) {
      idxRef.current += 1
      setIdx(idxRef.current)
      resetQuestion()
    } else {
      finish()
    }
  }, [total, resetQuestion, finish])

  const correct = useCallback(
    ({ noAdvance = false, phrase } = {}) => {
      setLocked(true)
      if (!tried.current) firstTry.current += 1
      play('correct')
      setBurst((b) => b + 1)
      setMascot('happy', phrase ?? pick(P.good), true)
      if (!noAdvance) setTimeout(advance, advanceDelay)
    },
    [play, setMascot, P, advance, advanceDelay],
  )

  const wrong = useCallback(
    (id, phrase) => {
      tried.current = true
      mistakes.current += 1
      play('wrong')
      if (id !== undefined) setWrongIds((w) => [...w, id])
      setMascot('oops', phrase ?? pick(P.retry), true)
    },
    [play, setMascot, P],
  )

  const answer = useCallback(
    (ok, id) => {
      if (locked || wrongIds.includes(id)) return
      if (ok) correct()
      else wrong(id)
    },
    [locked, wrongIds, correct, wrong],
  )

  /** маленькая похвала без завершения раунда (нашёл один из нескольких предметов) */
  const partial = useCallback(() => play('pop'), [play])

  // ручки для админ-панели
  useEffect(() => {
    admin.set('lesson', { idx, total, correct, advance, finish })
    return () => admin.set('lesson', null)
  }, [idx, total, correct, advance, finish])

  return {
    theme,
    idx,
    total,
    locked,
    wrongIds,
    mascot: mascotState,
    setMascot,
    burst,
    answer,
    correct,
    wrong,
    partial,
    advance,
    finish,
    resetQuestion,
    mistakes,
    P,
    play,
    say,
  }
}
