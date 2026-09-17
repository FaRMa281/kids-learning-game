/**
 * Прогресс: backend (games-backend, /kids-learning/progress) с запасным хранилищем в localStorage.
 * Если API недоступен или не задан (статический хостинг без backend'а) — всё работает на устройстве.
 */
const API_URL = import.meta.env.VITE_API_URL || ''
const LOCAL_KEY = 'kids-learning:progress' // [{mode, level, result, created_at}]

// ---------- localStorage
function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]')
  } catch {
    return []
  }
}

function writeLocal(rows) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(rows.slice(-500)))
  } catch {
    /* переполнено / приватный режим */
  }
}

function localSummary() {
  const acc = new Map()
  for (const r of readLocal()) {
    const key = `${r.mode}/${r.level}`
    const cur = acc.get(key) ?? { mode: r.mode, level: r.level, best: 0, attempts: 0 }
    cur.best = Math.max(cur.best, r.result)
    cur.attempts += 1
    acc.set(key, cur)
  }
  return [...acc.values()]
}

// ---------- backend
async function request(path, options) {
  if (!API_URL) throw new Error('no api')
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 4000)
  try {
    const res = await fetch(`${API_URL}${path}`, { ...options, signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.status === 204 ? null : res.json()
  } finally {
    clearTimeout(timer)
  }
}

/** Сохранить прохождение уровня. result — звёзды 0..3. Локально — всегда, на сервер — если он есть */
export async function saveProgress({ mode, level, result }) {
  const row = { mode, level, result, created_at: new Date().toISOString() }
  writeLocal([...readLocal(), row])
  try {
    return await request('/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, level, result }),
    })
  } catch {
    return row
  }
}

/**
 * [{mode, level, best, attempts}] — лучший результат по каждому уровню.
 * Сервер + локальное (лучшее из двух). Без API_URL — только локальное, без ошибки.
 * Если API задан, но недоступен — бросает ошибку с полем local (App покажет «не вижу сервер»).
 */
export async function getSummary() {
  const local = localSummary()
  try {
    const remote = await request('/progress/summary')
    const merged = new Map(local.map((r) => [`${r.mode}/${r.level}`, r]))
    for (const r of remote) {
      const key = `${r.mode}/${r.level}`
      const l = merged.get(key)
      merged.set(key, l ? { ...r, best: Math.max(r.best, l.best), attempts: Math.max(r.attempts, l.attempts) } : r)
    }
    return [...merged.values()]
  } catch (e) {
    if (!API_URL) return local
    throw Object.assign(e instanceof Error ? e : new Error('api unavailable'), { local })
  }
}

/** Стереть весь прогресс (админ-панель): локально и на сервере */
export async function clearProgress() {
  writeLocal([])
  try {
    await request('/progress', { method: 'DELETE' })
  } catch {
    /* сервера нет — стёрли локально */
  }
}
