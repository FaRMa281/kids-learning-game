import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { saveProgress } from '../../api'
import { useSound } from '../../audio/SoundContext'
import BackButton from '../../components/BackButton'
import BigButton from '../../components/BigButton'
import Confetti from '../../components/Confetti'
import FullscreenButton from '../../components/FullscreenButton'
import LevelBackdrop from '../../components/LevelBackdrop'
import Mascot from '../../components/Mascot'
import PagedLevels from '../../components/PagedLevels'
import SoundButton from '../../components/SoundButton'
import Stars from '../../components/Stars'
import { UI } from './phrases'

/** кнопки справа в шапке любого экрана острова */
function TopActions() {
  return (
    <div className="topbar__actions">
      <FullscreenButton />
      <SoundButton />
    </div>
  )
}

/** стиль экрана острова из темы: фон-градиент и акцент */
function themeStyle(theme) {
  if (!theme) return undefined
  const [a, b, c] = theme.bg
  return { '--accent': theme.accent, '--bg-a': a, '--bg-b': b, '--bg-c': c }
}

// ---------------------------------------------------------------- карточка уровня
function LevelCard({ lv, index, stars, locked, levels, onPick, bubble, tilt, active = true }) {
  const { play, say } = useSound()
  return (
    <motion.button
      key={lv.id}
      className={`level-card ${locked ? 'level-card--locked' : ''} ${stars === 3 ? 'level-card--gold' : ''}`}
      style={tilt ? { rotate: tilt } : undefined}
      initial={{ opacity: 0, y: 60, scale: 0.8 }}
      animate={active ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0.6, y: 0, scale: 0.94 }}
      transition={{ delay: active ? 0.08 + index * 0.08 : 0, type: 'spring', stiffness: 260, damping: 16 }}
      whileHover={locked ? { scale: 1.02 } : { scale: 1.05, y: -8 }}
      whileTap={locked ? { x: [0, -8, 8, -6, 6, 0] } : { scale: 0.96, y: 2 }}
      onHoverStart={() => {
        if (locked) return
        play('click')
        bubble('talk', lv.hint ?? `${lv.title}: ${lv.sub}`)
      }}
      onPointerDown={() => {
        if (locked) {
          play('wrong')
          const req = levels.find((l) => l.id === lv.requires)
          bubble('oops', `Сначала пройди «${req?.title ?? ''} — ${req?.sub ?? ''}»`)
        } else {
          play('pop')
          bubble('happy', lv.hint ?? lv.title)
          say(lv.hint ?? lv.title, lv.lang ?? 'ru')
        }
      }}
      onClick={() => !locked && setTimeout(() => onPick(lv), 180)}
      aria-disabled={locked}
    >
      <span className="level-card__art" aria-hidden>
        {lv.art ?? lv.icon}
      </span>
      <span className="level-card__title">{lv.title}</span>
      <span className="level-card__sub">{lv.sub}</span>
      <Stars filled={stars} size={34} />
      {locked && (
        <span className="level-card__lock" aria-hidden>
          <svg viewBox="0 0 64 80" width="100%" height="100%">
            <path d="M18 34 V24 a14 14 0 0 1 28 0 v10" fill="none" stroke="#7a5a1e" strokeWidth="7" strokeLinecap="round" />
            <path d="M18 34 V24 a14 14 0 0 1 28 0 v10" fill="none" stroke="#ffd166" strokeWidth="4" strokeLinecap="round" />
            <rect x="8" y="34" width="48" height="40" rx="9" fill="#f5a623" stroke="#7a5a1e" strokeWidth="4" />
            <rect x="12" y="38" width="40" height="14" rx="6" fill="rgba(255,255,255,0.35)" />
            <circle cx="32" cy="55" r="5" fill="#7a5a1e" />
            <rect x="30" y="55" width="4" height="10" rx="2" fill="#7a5a1e" />
          </svg>
        </span>
      )}
    </motion.button>
  )
}

// ---------------------------------------------------------------- выбор уровня
function LevelSelect({ modeId, title, levels, pages, summary, onPick, onBack, theme }) {
  const best = (id) => summary.find((s) => s.mode === modeId && s.level === id)?.best ?? 0
  // уровень заблокирован, пока на требуемом (lv.requires) нет хотя бы одной звезды
  const locked = (lv) => Boolean(lv.requires) && best(lv.requires) < 1
  const [mascot, setMascot] = useState({ mood: 'talk', bump: 0, text: theme?.hello ?? UI.ru.pickLevel })
  const bubble = (mood, text) => setMascot((m) => ({ mood, bump: m.bump + 1, text }))
  const card = (lv, i, tilt, active) => (
    <LevelCard key={lv.id} lv={lv} index={i} stars={best(lv.id)} locked={locked(lv)} levels={levels} onPick={onPick} bubble={bubble} tilt={tilt} active={active} />
  )

  return (
    <div className={`screen island-screen island-screen--levels ${pages ? 'island-screen--paged' : ''}`} style={themeStyle(theme)}>
      {theme && <LevelBackdrop theme={theme} />}
      <header className="topbar">
        <BackButton onClick={onBack} />
        <h1 className="title">{title}</h1>
        <TopActions />
      </header>
      {pages ? (
        <PagedLevels
          pages={pages}
          renderCard={card}
          onPageChange={(i) => bubble('talk', pages[i].hello ?? `${pages[i].title}: ${pages[i].sub}`)}
        />
      ) : (
        <div className="level-grid">{levels.map((lv, i) => card(lv, i, null, true))}</div>
      )}
      <Mascot mood={mascot.mood} bump={mascot.bump} text={mascot.text} className="mascot--corner" />
    </div>
  )
}

// ---------------------------------------------------------------- результат
function Result({ modeId, level, stars, onAgain, onBack, theme }) {
  const { play, say } = useSound()
  const P = UI[level.lang ?? 'ru']
  const [saved, setSaved] = useState(null)
  const [burst, setBurst] = useState(0)

  useEffect(() => {
    play('fanfare')
    say(P.done, level.lang ?? 'ru')
    setBurst(1)
    saveProgress({ mode: modeId, level: level.id, result: stars })
      .then(() => setSaved('ok'))
      .catch(() => setSaved('error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="screen island-screen result" style={themeStyle(theme)}>
      {theme && <LevelBackdrop theme={theme} />}
      <div className="topbar topbar--floating">
        <TopActions />
      </div>
      <motion.div
        className="result__card"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 16 }}
      >
        <h2 className="result__title">{P.done}</h2>
        <Stars filled={stars} size={80} animated onStar={(i) => play('star', i)} />
        <div className="result__actions">
          <BigButton color="green" onClick={onAgain}>
            🔁 {P.again}
          </BigButton>
          <BigButton color="blue" onClick={onBack}>
            🗺️ {P.map}
          </BigButton>
        </div>
        <p className="result__saved">
          {saved === 'ok' && '✅ Прогресс сохранён'}
          {saved === 'error' && '⚠️ Не удалось сохранить прогресс'}
        </p>
      </motion.div>
      <Mascot mood="happy" bump={1} className="mascot--corner" />
      <Confetti burst={burst} count={70} />
    </div>
  )
}

// ---------------------------------------------------------------- рамка урока: топбар + маскот + конфетти
export function LessonFrame({ lesson, onBack, dots, progress, children, className = '', theme }) {
  // progress — сколько «точек» уже закрыто, если раунд один, но шагов в нём много (найди пару)
  const done = progress ?? lesson.idx
  const cur = progress === undefined ? lesson.idx : -1
  return (
    <div className={`screen island-screen lesson ${className}`} style={themeStyle(theme ?? lesson.theme)}>
      <header className="topbar">
        <BackButton onClick={onBack} />
        <div className="progress-dots">
          {(dots ?? Array.from({ length: lesson.total }, () => '●')).map((label, i) => (
            <span key={i} className={`dot ${i < done ? 'dot--done' : ''} ${i === cur ? 'dot--cur' : ''}`}>
              {label}
            </span>
          ))}
        </div>
        <TopActions />
      </header>
      {children}
      <Mascot mood={lesson.mascot.mood} bump={lesson.mascot.bump} text={lesson.mascot.text} className="mascot--corner" />
      <Confetti burst={lesson.burst} />
    </div>
  )
}

/** Вариант ответа: трясётся и гаснет при ошибке, подсвечивается при верном ответе */
export function OptionButton({ id, isCorrect, lesson, children, className = '', size }) {
  const wrong = lesson.wrongIds.includes(id)
  const isOk = lesson.locked && isCorrect
  const anim = wrong ? { x: [0, -14, 14, -8, 8, 0] } : isOk ? { scale: [1, 1.2, 1.1] } : { x: 0, scale: 1 }
  return (
    <motion.button
      className={`option ${wrong ? 'option--wrong' : ''} ${isOk ? 'option--ok' : ''} ${className}`}
      style={size ? { width: size, height: size } : undefined}
      animate={anim}
      transition={{ duration: 0.45 }}
      whileTap={!wrong && !lesson.locked ? { scale: 0.92 } : {}}
      onClick={() => lesson.answer(isCorrect, id)}
      disabled={wrong}
    >
      {children}
    </motion.button>
  )
}

// ---------------------------------------------------------------- остров: уровни → урок → результат
export default function IslandShell({ modeId, title, levels, pages, Lesson, summary, onBack, onProgressSaved, island }) {
  const theme = island?.theme
  const [phase, setPhase] = useState('levels')
  const [level, setLevel] = useState(null)
  const [stars, setStars] = useState(0)
  const [runKey, setRunKey] = useState(0)

  const finish = (s) => {
    setStars(s)
    setPhase('result')
    setTimeout(() => onProgressSaved?.(), 800)
  }

  let view
  if (phase === 'levels') {
    view = (
      <LevelSelect
        modeId={modeId}
        title={title}
        levels={levels}
        pages={pages}
        summary={summary}
        theme={theme}
        onBack={onBack}
        onPick={(lv) => {
          setLevel(lv)
          setPhase('lesson')
        }}
      />
    )
  } else if (phase === 'lesson') {
    view = <Lesson key={`lesson-${runKey}`} level={{ ...level, theme }} onFinish={finish} onBack={() => setPhase('levels')} />
  } else {
    view = (
      <Result
        modeId={modeId}
        level={level}
        stars={stars}
        theme={theme}
        onAgain={() => {
          setRunKey((k) => k + 1)
          setPhase('lesson')
        }}
        onBack={onBack}
      />
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase}
        className="phase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        {view}
      </motion.div>
    </AnimatePresence>
  )
}
