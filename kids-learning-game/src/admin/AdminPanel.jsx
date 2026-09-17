import { useEffect, useState, useSyncExternalStore } from 'react'
import { clearProgress } from '../api'
import { admin, isAdminEnabled, setAdminEnabled } from './bridge'

/**
 * Админ-панель. Включение: Ctrl+Shift+A или ?admin в адресе (запоминается).
 * Карта: погода. Урок: пролистать раунд, засчитать верный ответ, завершить уровень со звёздами.
 */
export default function AdminPanel({ onProgressCleared }) {
  const [enabled, setEnabled] = useState(isAdminEnabled)
  const [collapsed, setCollapsed] = useState(false)
  useSyncExternalStore(admin.subscribe, admin.snapshot) // перерисовка при смене сцены/урока
  const [, tick] = useState(0)

  // хоткей
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyA') {
        e.preventDefault()
        setEnabled((v) => {
          setAdminEnabled(!v)
          return !v
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // обновляем показания (фаза погоды, таймер) раз в полсекунды
  useEffect(() => {
    if (!enabled) return
    const id = setInterval(() => tick((n) => n + 1), 500)
    return () => clearInterval(id)
  }, [enabled])

  if (!enabled) return null

  const scene = admin.scene
  const lesson = admin.lesson
  const w = scene?.weather

  return (
    <div className={`admin ${collapsed ? 'admin--collapsed' : ''}`}>
      <div className="admin__head">
        <span>⚙ админ</span>
        <button onClick={() => setCollapsed((c) => !c)}>{collapsed ? '▸' : '▾'}</button>
        <button
          onClick={() => {
            setAdminEnabled(false)
            setEnabled(false)
          }}
          title="Скрыть (Ctrl+Shift+A — вернуть)"
        >
          ✕
        </button>
      </div>
      {!collapsed && (
        <>
          {scene && w && (
            <section>
              <h4>
                Погода: <b>{w.phase}</b> · уровень {w.level.toFixed(2)} · облаков {scene.cloudCount}
                {w.phase === 'clear' && ` · туча через ${Math.max(0, Math.round(scene.nextStormIn))} с`}
              </h4>
              <div className="admin__row">
                <span>Скорость погоды:</span>
                {[1, 3, 6, 12].map((v) => (
                  <button
                    key={v}
                    className={scene.weatherSpeed === v ? 'admin__on' : ''}
                    onClick={() => {
                      scene.weatherSpeed = v
                      tick((n) => n + 1)
                    }}
                  >
                    ×{v}
                  </button>
                ))}
              </div>
              <div className="admin__row">
                <span>Качество ({scene.quality.fps} fps):</span>
                {['auto', 0, 1, 2].map((m) => (
                  <button
                    key={m}
                    className={String(scene.quality.mode) === String(m) ? 'admin__on' : ''}
                    onClick={() => {
                      scene.quality.set(m)
                      tick((n) => n + 1)
                    }}
                  >
                    {m === 'auto' ? `auto (${scene.quality.tier})` : ['high', 'mid', 'low'][m]}
                  </button>
                ))}
              </div>
              <div className="admin__row">
                <button onClick={() => scene.debugStorm()}>Туча заходит</button>
                <button onClick={() => scene.debugStormNow()}>Шторм сразу</button>
                <button onClick={() => scene.blow()}>Вентилятор</button>
                <button onClick={() => scene.debugClear()}>Ясно сразу</button>
              </div>
            </section>
          )}
          {lesson && (
            <section>
              <h4>
                Урок: раунд {lesson.idx + 1} / {lesson.total}
              </h4>
              <div className="admin__row">
                <button onClick={() => lesson.correct()}>Верный ответ</button>
                <button onClick={() => lesson.advance()}>Следующий раунд</button>
              </div>
              <div className="admin__row">
                <span>Завершить:</span>
                <button onClick={() => lesson.finish(3)}>⭐⭐⭐</button>
                <button onClick={() => lesson.finish(2)}>⭐⭐</button>
                <button onClick={() => lesson.finish(1)}>⭐</button>
              </div>
            </section>
          )}
          <section>
            <div className="admin__row">
              <button
                onClick={() => {
                  if (!confirm('Стереть весь прогресс?')) return
                  clearProgress().then(() => onProgressCleared?.())
                }}
              >
                Сбросить прогресс
              </button>
              <button onClick={() => location.reload()}>Перезагрузить</button>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
