/**
 * Адаптивное качество: следим за FPS и переключаем уровень.
 *   0 — полное: вода 0.75×DPR, 900 капель, лучи солнца, блики линзы, тени облаков
 *   1 — среднее: вода 0.5×DPR, 450 капель, без бликов линзы
 *   2 — низкое: вода 0.35×DPR, 200 капель, без лучей солнца, облака без градиентов
 * Вниз — если средний FPS за окно < 40; вверх — если три окна подряд > 56 (гистерезис).
 */
import { guessLowEnd } from '../../device'

export const TIERS = [
  { name: 'high', water: 0.75, rainMax: 900, rays: true, flare: true, cloudShading: true },
  { name: 'medium', water: 0.5, rainMax: 450, rays: true, flare: false, cloudShading: true },
  { name: 'low', water: 0.35, rainMax: 200, rays: false, flare: false, cloudShading: false },
]

const STORAGE = 'kids-learning:quality' // 'auto' | '0' | '1' | '2'

export function createQuality({ onChange }) {
  let mode = localStorage.getItem(STORAGE) || 'auto'
  let tier = mode === 'auto' ? (guessLowEnd() ? 1 : 0) : Number(mode)
  let frames = 0
  let acc = 0
  let goodWindows = 0
  let fps = 60

  const apply = () => onChange?.(TIERS[tier], tier)
  apply()

  return {
    /** вызывать каждый кадр */
    tick(dt) {
      frames += 1
      acc += dt
      if (acc < 2) return
      fps = frames / acc
      frames = 0
      acc = 0
      if (mode !== 'auto') return
      if (fps < 40 && tier < TIERS.length - 1) {
        tier += 1
        goodWindows = 0
        apply()
      } else if (fps > 56 && tier > 0) {
        goodWindows += 1
        if (goodWindows >= 3) {
          tier -= 1
          goodWindows = 0
          apply()
        }
      } else {
        goodWindows = 0
      }
    },
    get fps() {
      return Math.round(fps)
    },
    get tier() {
      return tier
    },
    get mode() {
      return mode
    },
    /** 'auto' или номер уровня — из админки */
    set(m) {
      mode = String(m)
      localStorage.setItem(STORAGE, mode)
      if (mode !== 'auto') tier = Number(mode)
      goodWindows = 0
      apply()
    },
  }
}
