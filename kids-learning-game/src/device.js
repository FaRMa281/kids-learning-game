/**
 * Устройство и вьюпорт: тач/мышь, телефон/планшет/десктоп, ориентация, полноэкранный режим, PWA.
 * Всё детектируется по возможностям (pointer, размер), а не по User-Agent.
 */
import { useEffect, useState } from 'react'

export const isTouch = () => window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0

/** телефон = короткая сторона экрана меньше 600 css-px и тач */
export const isPhone = () => isTouch() && Math.min(screen.width, screen.height) < 600

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true

/** грубая оценка «слабого» устройства — стартовый уровень качества */
export function guessLowEnd() {
  const cores = navigator.hardwareConcurrency || 4
  const mem = navigator.deviceMemory || 4 // ГБ, только Chrome/Android
  return isPhone() || cores <= 4 || mem <= 3
}

function readViewport() {
  const vv = window.visualViewport
  const w = Math.round(vv?.width ?? window.innerWidth)
  const h = Math.round(vv?.height ?? window.innerHeight)
  return { w, h, portrait: h > w, portraitPhone: h > w && isPhone() }
}

/** размер видимой области и ориентация; обновляется при resize / повороте / появлении браузерных панелей */
export function useViewport() {
  const [vp, setVp] = useState(readViewport)
  useEffect(() => {
    let raf = 0
    const update = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setVp(readViewport()))
    }
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    window.visualViewport?.addEventListener('resize', update)
    screen.orientation?.addEventListener?.('change', update)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
      window.visualViewport?.removeEventListener('resize', update)
      screen.orientation?.removeEventListener?.('change', update)
    }
  }, [])
  return vp
}

/** полноэкранный режим + попытка зафиксировать альбомную ориентацию (работает только в fullscreen/PWA) */
export async function enterFullscreen() {
  const el = document.documentElement
  try {
    if (!document.fullscreenElement) await (el.requestFullscreen?.() ?? el.webkitRequestFullscreen?.())
  } catch {
    /* iOS Safari не даёт fullscreen для страниц — только через «На экран Домой» */
  }
  try {
    await screen.orientation?.lock?.('landscape')
  } catch {
    /* не поддерживается или не в fullscreen — игнорируем */
  }
}

export async function exitFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
  } catch {
    /* ignore */
  }
}

export const canFullscreen = () => !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)

/** глушим браузерные жесты: контекстное меню по долгому тапу, pinch-zoom (iOS gesture events), двойной тап */
export function installTouchGuards(root) {
  const prevent = (e) => e.preventDefault()
  root.addEventListener('contextmenu', prevent)
  document.addEventListener('gesturestart', prevent, { passive: false })
  document.addEventListener('gesturechange', prevent, { passive: false })
  // двойной тап → zoom в старом iOS Safari: гасим второй touchend в течение 300 мс
  let lastTouchEnd = 0
  document.addEventListener(
    'touchend',
    (e) => {
      const now = Date.now()
      if (now - lastTouchEnd < 300 && e.cancelable) e.preventDefault()
      lastTouchEnd = now
    },
    { passive: false },
  )
  // многопальцевые касания на canvas — не нужны, не даём странице их интерпретировать
  document.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches.length > 1 && e.cancelable) e.preventDefault()
    },
    { passive: false },
  )
}
