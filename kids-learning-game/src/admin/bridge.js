/**
 * Мост между игрой и админ-панелью: сцена карты и текущий урок регистрируют здесь
 * свои «ручки», панель их дёргает. Никакой игровой логики — только ссылки.
 */
const state = { scene: null, lesson: null, version: 0 }
const listeners = new Set()

function emit() {
  state.version += 1
  listeners.forEach((fn) => fn())
}

export const admin = {
  set(key, value) {
    if (state[key] === value) return
    state[key] = value
    emit()
  },
  get scene() {
    return state.scene
  },
  get lesson() {
    return state.lesson
  },
  subscribe(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
  snapshot() {
    return state.version
  },
}

const STORAGE_KEY = 'kids-learning:admin'

export function isAdminEnabled() {
  try {
    if (new URLSearchParams(location.search).has('admin')) {
      localStorage.setItem(STORAGE_KEY, '1')
      return true
    }
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function setAdminEnabled(on) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? '1' : '0')
  } catch {
    /* ignore */
  }
}
