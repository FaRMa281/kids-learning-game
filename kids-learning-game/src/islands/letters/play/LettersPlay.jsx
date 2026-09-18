import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LessonFrame } from '../../common/IslandShell'
import { pick } from '../../common/phrases'
import { useLesson } from '../../common/useLesson'
import { useRoundState } from '../../common/useRoundState'
import { makeRounds } from '../modes'
import { SCENE_COMPONENTS } from './scenes'
import Token from './Token'

const EMPTY = []
const SKIN = { pier: 'ring', chest: 'bubble', sunken: 'shell' }
const GOOD = ['Молодец!', 'Точно!', 'Здорово!', 'Супер!', 'Так держать!']

/**
 * Игровой процесс Острова букв (3-й экран): раунды из modes.js, сцена по уровню,
 * механики pick / collect / sequence / catch, «сочный» отклик и мягкие ошибки.
 */
export default function LettersPlay({ level, onFinish, onBack }) {
  const rounds = useMemo(() => makeRounds(level.id), [level.id])
  const lang = level.lang ?? 'ru'
  const lesson = useLesson({ lang, total: rounds.length, onFinish, theme: level.theme, advanceDelay: 1900 })
  const { idx, say, play, setMascot } = lesson
  const round = rounds[idx]
  const Scene = SCENE_COMPONENTS[level.scene] ?? SCENE_COMPONENTS.pier

  const stageRef = useRef(null)
  const slotRef = useRef(null)
  const [picked, setPicked] = useRoundState(idx, EMPTY) // id токенов, принятых слотом (по порядку)
  const [wrongShake, setWrongShake] = useRoundState(idx, null)
  const [celebrate, setCelebrate] = useRoundState(idx, false)
  const [fx, setFx] = useState([]) // искры/звёзды/летящие клоны: { id, kind, x, y, ... }
  const fxId = useRef(0)
  const [caught, setCaught] = useRoundState(idx, 0)
  const [popped, setPopped] = useRoundState(idx, EMPTY)

  const targets = useMemo(() => round.tokens.filter((t) => t.ok), [round])
  const need = round.mech === 'catch' ? round.need : targets.length
  const letters = picked.map((id) => round.tokens.find((t) => t.id === id)?.text ?? '')

  // озвучка задания при старте раунда
  useEffect(() => {
    const t = setTimeout(() => {
      setMascot('talk', round.prompt.text)
      if (round.prompt.say) say(round.prompt.say, round.prompt.lang ?? lang)
    }, 450)
    return () => clearTimeout(t)
  }, [idx, round, say, setMascot, lang])

  // ---------------------------------------------------------------- эффекты
  const spawnFx = useCallback((kind, x, y, extra = {}) => {
    const id = ++fxId.current
    setFx((list) => [...list.slice(-60), { id, kind, x, y, ...extra }])
    setTimeout(() => setFx((list) => list.filter((f) => f.id !== id)), extra.ttl ?? 900)
  }, [])

  const toStage = (pt) => {
    const r = stageRef.current.getBoundingClientRect()
    return { x: pt.x - r.left, y: pt.y - r.top }
  }
  const slotCenter = () => {
    const r = slotRef.current.getBoundingClientRect()
    const s = stageRef.current.getBoundingClientRect()
    return { x: r.left + r.width / 2 - s.left, y: r.top + r.height / 2 - s.top }
  }
  const overSlot = (pt) => {
    const r = slotRef.current?.getBoundingClientRect()
    if (!r) return false
    const m = 28
    return pt.x > r.left - m && pt.x < r.right + m && pt.y > r.top - m && pt.y < r.bottom + m
  }

  const burstStars = (x, y, n = 10) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.5
      spawnFx('star', x, y, { dx: Math.cos(a) * (60 + Math.random() * 70), dy: Math.sin(a) * (50 + Math.random() * 60) - 40, ttl: 1100 })
    }
  }

  // ---------------------------------------------------------------- логика ответа
  const accept = (token, from) => {
    // токен принят: летит в слот, слот «вспыхивает»
    const to = slotCenter()
    spawnFx('fly', from.x, from.y, { to, text: token.text, kind2: token.kind, ttl: 520 })
    play('pop')
    if (token.say) say(token.say, lang)
    const next = [...picked, token.id]
    setPicked(next)
    const done = round.mech === 'sequence' || round.mech === 'collect' ? next.length >= need : true
    if (done) {
      setTimeout(() => {
        setCelebrate(true)
        burstStars(to.x, to.y, 14)
        play(level.scene === 'pier' ? 'horn' : 'chime')
        lesson.correct({ phrase: pick(GOOD) })
      }, 480)
    } else {
      setTimeout(() => {
        lesson.partial()
        burstStars(to.x, to.y, 5)
        setMascot('happy', round.mech === 'sequence' ? `Дальше — ${targets.find((t) => t.order === next.length)?.say ?? ''}` : `Ещё ${need - next.length}!`)
      }, 480)
    }
  }

  const reject = (token, reason) => {
    // мягкая ошибка: без крестов, токен сам пружинит назад, маскот подсказывает
    play('wrong')
    setWrongShake(token.id)
    setTimeout(() => setWrongShake(null), 500)
    setMascot('oops', reason ?? round.hint ?? pick(['Попробуй ещё раз!', 'Почти! Давай ещё']))
  }

  const tryToken = (token, from) => {
    if (lesson.locked || picked.includes(token.id)) return
    if (!token.ok) return reject(token)
    if (round.mech === 'sequence') {
      const expected = targets.find((t) => t.order === picked.length)
      if (token.order !== picked.length) return reject(token, `Сначала ${expected?.say ?? ''}`)
    }
    accept(token, from)
  }

  const onDrop = (token, point) => {
    if (!overSlot(point)) return // отпустили мимо — просто вернётся на место
    tryToken(token, toStage(point))
  }
  const onTap = (token, el) => {
    // тап: летит в слот сам (удобно пальцем); стартовая точка — центр токена
    const r = el?.getBoundingClientRect?.()
    const from = r ? toStage({ x: r.left + r.width / 2, y: r.top + r.height / 2 }) : slotCenter()
    tryToken(token, from)
  }
  const onGrab = (token) => {
    play('pop')
    if (token.say && round.mech !== 'catch') say(token.say, lang)
  }
  const onTrail = (point) => {
    const p = toStage(point)
    spawnFx(level.scene === 'pier' ? 'splash' : 'spark', p.x + (Math.random() - 0.5) * 20, p.y + (Math.random() - 0.5) * 20, { ttl: 600 })
  }

  // catch: лопаем пузыри
  const onPop = (token, el) => {
    if (lesson.locked || popped.includes(token.id)) return
    const r = el.getBoundingClientRect()
    const p = toStage({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
    if (!token.ok) {
      reject(token)
      return
    }
    setPopped([...popped, token.id])
    play('bubble')
    if (token.say) say(token.say, lang)
    burstStars(p.x, p.y, 8)
    const n = caught + 1
    setCaught(n)
    if (n >= need) {
      setCelebrate(true)
      setTimeout(() => {
        play('chime')
        lesson.correct({ phrase: pick(GOOD) })
      }, 300)
    } else {
      lesson.partial()
      setMascot('happy', `Ещё ${need - n}!`)
    }
  }

  const replay = () => {
    if (round.prompt.replay) say(round.prompt.replay, round.prompt.lang ?? lang)
    else if (round.prompt.say) say(round.prompt.say, round.prompt.lang ?? lang)
  }

  // ---------------------------------------------------------------- раскладка токенов
  const layout = useMemo(() => tokenLayout(round.tokens.length, level.scene, round.mech), [round, level.scene])

  return (
    <LessonFrame lesson={lesson} onBack={onBack} className="lesson--letters">
      <AnimatePresence mode="wait">
        <motion.div key={idx} className="play" ref={stageRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <Scene ref={slotRef} filled={picked.length + caught} slots={round.prompt.slots} letters={letters} celebrate={celebrate}>
            {/* задание */}
            <motion.div className="prompt" initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
              {round.prompt.pic && <span className="prompt__pic">{round.prompt.pic}</span>}
              {round.prompt.big && <span className={`prompt__big ${round.prompt.ghost ? 'prompt__big--ghost' : ''}`}>{round.prompt.big}</span>}
              <span className="prompt__text">{round.prompt.text}</span>
              <button className="prompt__speak" onClick={replay} aria-label="Повторить">
                🔊
              </button>
              {round.mech === 'catch' && (
                <span className="prompt__count">
                  {caught} / {need}
                </span>
              )}
            </motion.div>

            {/* токены */}
            <div className={`tokens tokens--${round.mech}`}>
              {round.tokens.map((token, i) => {
                const gone = picked.includes(token.id) || popped.includes(token.id)
                const pos = layout[i]
                if (round.mech === 'catch') {
                  return (
                    <motion.button
                      key={`${idx}-${token.id}`}
                      type="button"
                      className={`tok tok--bubble tok--rise ${gone ? 'tok--gone' : ''} ${wrongShake === token.id ? 'tok--shake' : ''}`}
                      style={{ '--x': `${pos.x}%`, '--dur': `${pos.dur}s`, '--delay': `${pos.delay}s`, '--size': pos.size }}
                      whileTap={{ scale: 1.15 }}
                      onPointerDown={(e) => onPop(token, e.currentTarget)}
                      aria-label={token.text}
                    >
                      <span className="tok__text">{token.text}</span>
                    </motion.button>
                  )
                }
                return (
                  <div
                    key={`${idx}-${token.id}`}
                    className={`tok-wrap ${gone ? 'tok-wrap--gone' : ''} ${wrongShake === token.id ? 'tok-wrap--shake' : ''}`}
                    style={{ left: `${pos.x}%`, top: `${pos.y}%`, '--size': pos.size }}
                  >
                    <Token
                      token={token}
                      skin={SKIN[level.scene] ?? 'ring'}
                      delay={-i * 0.7}
                      disabled={gone || lesson.locked}
                      onDrop={onDrop}
                      onTap={(t) => onTap(t, stageRef.current?.querySelector(`[data-tok="${token.id}"]`))}
                      onGrab={onGrab}
                      onTrail={onTrail}
                    />
                    <span data-tok={token.id} className="tok-anchor" />
                  </div>
                )
              })}
            </div>

            {/* дорожка катера (лабиринт): пунктир между выбранными буквами */}
            {round.path && picked.length > 0 && <Path picked={picked} tokens={round.tokens} layout={layout} />}

            {/* эффекты */}
            <div className="fx" aria-hidden>
              {fx.map((f) =>
                f.kind === 'fly' ? (
                  <motion.span
                    key={f.id}
                    className={`fx__fly ${f.kind2 === 'piece' ? 'fx__fly--piece' : ''}`}
                    initial={{ x: f.x, y: f.y, scale: 1.1, opacity: 1 }}
                    animate={{ x: f.to.x, y: f.to.y, scale: 0.5, opacity: 0.2 }}
                    transition={{ duration: 0.45, ease: 'easeIn' }}
                  >
                    {f.text}
                  </motion.span>
                ) : f.kind === 'star' ? (
                  <motion.span
                    key={f.id}
                    className="fx__star"
                    initial={{ x: f.x, y: f.y, scale: 0.4, opacity: 1, rotate: 0 }}
                    animate={{ x: f.x + f.dx, y: f.y + f.dy + 60, scale: 1.2, opacity: 0, rotate: 180 }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  >
                    ⭐
                  </motion.span>
                ) : (
                  <span key={f.id} className={`fx__${f.kind}`} style={{ left: f.x, top: f.y }} />
                )
              )}
            </div>
          </Scene>
        </motion.div>
      </AnimatePresence>
    </LessonFrame>
  )
}

/** дорожка для лабиринта: пунктир по центрам выбранных токенов */
function Path({ picked, tokens, layout }) {
  const pts = picked.map((id) => layout[tokens.findIndex((t) => t.id === id)])
  return (
    <svg className="path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <polyline points={pts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="0.6" strokeDasharray="1.5 1.2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {pts.length > 0 && <text x={pts.at(-1).x} y={pts.at(-1).y - 5} fontSize="6" textAnchor="middle">🚤</text>}
    </svg>
  )
}

/**
 * Позиции токенов (в % сцены). Слот на причале/сундуке — справа, поэтому токены — слева и по центру.
 * pier: на воде (нижняя половина); chest: над сундуком (пузыри); sunken: на дне (низ).
 */
function tokenLayout(n, scene, mech) {
  const pos = []
  if (mech === 'catch') {
    for (let i = 0; i < n; i++) pos.push({ x: 8 + ((i * 37) % 70) + Math.random() * 8, dur: 9 + Math.random() * 6, delay: (i * 1.3) % 8, size: 0.9 + Math.random() * 0.35 })
    return pos
  }
  const band = scene === 'pier' ? [50, 78] : scene === 'chest' ? [28, 64] : [48, 74]
  const cols = n <= 4 ? n : Math.ceil(n / 2)
  const rows = Math.ceil(n / cols)
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols)
    const c = i % cols
    const xs = 8 + (c + 0.5) * (62 / cols) + (r % 2 ? 4 : 0)
    const ys = band[0] + (rows === 1 ? (band[1] - band[0]) / 2 : (r / (rows - 1)) * (band[1] - band[0]))
    pos.push({ x: xs + (Math.random() - 0.5) * 4, y: ys + (Math.random() - 0.5) * 6, size: n > 6 ? 0.85 : 1 })
  }
  return pos
}
