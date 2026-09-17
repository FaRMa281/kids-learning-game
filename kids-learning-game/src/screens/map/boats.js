/**
 * Стилизованные судёнышки (Canvas 2D). Рисуются носом вправо, ватерлиния y = 0,
 * масштаб s ≈ половина длины корпуса. Все детали — векторные, с объёмом (градиенты, блики).
 *
 * Типы: yacht (яхта с локатором), speed (катер с ветровым стеклом), tug (буксир с дымом),
 *       sail (парусник), fisher (рыбацкая лодка с флажком)
 */

export const BOAT_TYPES = ['yacht', 'speed', 'tug', 'sail', 'fisher']

const OUT = '#233047'

function hull(ctx, s, { color, dark, len = 1, h = 0.36, bow = 1.08, stripe }) {
  // корпус: борт с бликом и тёмным днищем
  const g = ctx.createLinearGradient(0, -s * 0.1, 0, s * h)
  g.addColorStop(0, lighten(color, 0.25))
  g.addColorStop(0.45, color)
  g.addColorStop(1, dark)
  ctx.fillStyle = g
  ctx.strokeStyle = OUT
  ctx.lineWidth = 2
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(-s * len, -s * 0.06)
  ctx.quadraticCurveTo(s * len * 0.6, -s * 0.12, s * len * bow, -s * 0.02)
  ctx.quadraticCurveTo(s * len * 0.95, s * h * 0.7, s * len * 0.72, s * h)
  ctx.lineTo(-s * len * 0.8, s * h)
  ctx.quadraticCurveTo(-s * len * 1.02, s * h * 0.6, -s * len, -s * 0.06)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  if (stripe) {
    ctx.strokeStyle = stripe
    ctx.lineWidth = s * 0.07
    ctx.beginPath()
    ctx.moveTo(-s * len * 0.92, s * h * 0.42)
    ctx.quadraticCurveTo(s * len * 0.3, s * h * 0.36, s * len * 0.95, s * h * 0.3)
    ctx.stroke()
    ctx.lineWidth = 2
    ctx.strokeStyle = OUT
  }
}

function lighten(hex, k) {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.min(255, ((n >> 16) & 255) + 255 * k)
  const g = Math.min(255, ((n >> 8) & 255) + 255 * k)
  const b = Math.min(255, (n & 255) + 255 * k)
  return `rgb(${r | 0},${g | 0},${b | 0})`
}

function windows(ctx, xs, y, w, h) {
  for (const x of xs) {
    ctx.fillStyle = '#9fe0ff'
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, w * 0.25)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.fillRect(x + w * 0.15, y + h * 0.15, w * 0.3, h * 0.3)
  }
}

function flag(ctx, x, y, s, color, t, len = 0.5, h = 0.22) {
  // флажок, колышется
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x, y)
  const w = s * len
  for (let i = 0; i <= 6; i++) {
    const u = i / 6
    ctx.lineTo(x + u * w, y + Math.sin(t * 9 + u * 6) * s * 0.03 * u)
  }
  for (let i = 6; i >= 0; i--) {
    const u = i / 6
    ctx.lineTo(x + u * w, y + s * h + Math.sin(t * 9 + u * 6) * s * 0.03 * u)
  }
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
}

function smoke(ctx, x, y, s, t, color = 'rgba(255,255,255,0.75)') {
  for (let i = 0; i < 4; i++) {
    const ph = (t * 0.55 + i * 0.25) % 1
    const wob = Math.sin(t * 2 + i) * s * 0.08
    ctx.globalAlpha = (1 - ph) * 0.8
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x - ph * s * 0.9 + wob, y - ph * s * 0.9, s * (0.07 + ph * 0.2), 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

export function drawBoat(ctx, type, s, t) {
  ctx.lineWidth = 2
  ctx.strokeStyle = OUT
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  switch (type) {
    case 'yacht': {
      hull(ctx, s, { color: '#f7f9fc', dark: '#c9d3e0', len: 1.25, h: 0.34, stripe: '#1982c4' })
      // палуба и рубка
      ctx.fillStyle = '#e8eef5'
      ctx.beginPath()
      ctx.roundRect(-s * 0.9, -s * 0.5, s * 1.2, s * 0.46, s * 0.12)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.roundRect(-s * 0.55, -s * 0.85, s * 0.7, s * 0.4, s * 0.1)
      ctx.fill()
      ctx.stroke()
      windows(ctx, [-s * 0.45, -s * 0.2, s * 0.05], -s * 0.78, s * 0.18, s * 0.2)
      windows(ctx, [-s * 0.8, -s * 0.55, -s * 0.3, -s * 0.05], -s * 0.42, s * 0.16, s * 0.16)
      // мачта с локатором
      ctx.beginPath()
      ctx.moveTo(-s * 0.2, -s * 0.85)
      ctx.lineTo(-s * 0.2, -s * 1.25)
      ctx.stroke()
      ctx.save()
      ctx.translate(-s * 0.2, -s * 1.25)
      ctx.rotate(t * 3)
      ctx.strokeStyle = '#ff8c1a'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(-s * 0.18, 0)
      ctx.lineTo(s * 0.18, 0)
      ctx.stroke()
      ctx.restore()
      ctx.strokeStyle = OUT
      ctx.lineWidth = 2
      flag(ctx, s * 0.32, -s * 1.15, s, '#e63946', t, 0.32, 0.16)
      ctx.beginPath()
      ctx.moveTo(s * 0.32, -s * 0.5)
      ctx.lineTo(s * 0.32, -s * 1.15)
      ctx.stroke()
      break
    }
    case 'speed': {
      hull(ctx, s, { color: '#ff595e', dark: '#b8323a', len: 1.0, h: 0.3, bow: 1.15, stripe: '#ffffff' })
      // ветровое стекло
      ctx.fillStyle = 'rgba(170,225,255,0.85)'
      ctx.beginPath()
      ctx.moveTo(s * 0.05, -s * 0.08)
      ctx.lineTo(s * 0.2, -s * 0.45)
      ctx.lineTo(s * 0.55, -s * 0.45)
      ctx.lineTo(s * 0.62, -s * 0.08)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      // сиденья
      ctx.fillStyle = '#2b2d42'
      ctx.beginPath()
      ctx.roundRect(-s * 0.55, -s * 0.28, s * 0.2, s * 0.22, s * 0.05)
      ctx.roundRect(-s * 0.25, -s * 0.28, s * 0.2, s * 0.22, s * 0.05)
      ctx.fill()
      // мотор
      ctx.fillStyle = '#2b2d42'
      ctx.beginPath()
      ctx.roundRect(-s * 1.12, -s * 0.2, s * 0.22, s * 0.42, s * 0.05)
      ctx.fill()
      ctx.stroke()
      break
    }
    case 'tug': {
      hull(ctx, s, { color: '#e76f51', dark: '#9c3f2b', len: 1.15, h: 0.42, bow: 1.05, stripe: '#2b2d42' })
      // кранцы (шины)
      ctx.fillStyle = '#2b2d42'
      for (const x of [-s * 0.7, -s * 0.25, s * 0.2, s * 0.65]) {
        ctx.beginPath()
        ctx.arc(x, s * 0.16, s * 0.09, 0, Math.PI * 2)
        ctx.fill()
      }
      // рубка
      ctx.fillStyle = '#f1faee'
      ctx.beginPath()
      ctx.roundRect(-s * 0.75, -s * 0.62, s * 0.9, s * 0.58, s * 0.08)
      ctx.fill()
      ctx.stroke()
      windows(ctx, [-s * 0.62, -s * 0.36, -s * 0.1], -s * 0.52, s * 0.18, s * 0.2)
      // труба и дым
      ctx.fillStyle = '#ffca3a'
      ctx.beginPath()
      ctx.roundRect(-s * 0.45, -s * 1.0, s * 0.26, s * 0.42, s * 0.04)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#2b2d42'
      ctx.fillRect(-s * 0.45, -s * 1.0, s * 0.26, s * 0.1)
      smoke(ctx, -s * 0.32, -s * 1.05, s, t, 'rgba(90,100,115,0.55)')
      // мачта с флажком
      ctx.beginPath()
      ctx.moveTo(s * 0.1, -s * 0.62)
      ctx.lineTo(s * 0.1, -s * 1.15)
      ctx.stroke()
      flag(ctx, s * 0.1, -s * 1.15, s, '#8ac926', t, 0.3, 0.15)
      break
    }
    case 'sail': {
      hull(ctx, s, { color: '#1982c4', dark: '#0f4c7a', len: 1.0, h: 0.32, stripe: '#ffffff' })
      // мачта
      ctx.beginPath()
      ctx.moveTo(0, -s * 0.05)
      ctx.lineTo(0, -s * 1.75)
      ctx.stroke()
      // грот — выпуклый парус, «надувается» ветром
      const puff = 1 + 0.06 * Math.sin(t * 1.8)
      const sailG = ctx.createLinearGradient(0, -s * 1.7, s * 0.9, 0)
      sailG.addColorStop(0, '#ffffff')
      sailG.addColorStop(1, '#dbe6f2')
      ctx.fillStyle = sailG
      ctx.beginPath()
      ctx.moveTo(s * 0.04, -s * 1.68)
      ctx.quadraticCurveTo(s * 0.95 * puff, -s * 0.9, s * 0.85, -s * 0.1)
      ctx.lineTo(s * 0.04, -s * 0.1)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      // стаксель
      ctx.fillStyle = '#ffd166'
      ctx.beginPath()
      ctx.moveTo(-s * 0.04, -s * 1.45)
      ctx.quadraticCurveTo(-s * 0.7 * puff, -s * 0.8, -s * 0.85, -s * 0.1)
      ctx.lineTo(-s * 0.04, -s * 0.1)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      flag(ctx, 0, -s * 1.78, s, '#e63946', t, 0.28, 0.13)
      break
    }
    case 'fisher': {
      hull(ctx, s, { color: '#06a77d', dark: '#04684e', len: 1.1, h: 0.38, stripe: '#ffffff' })
      // планширь
      ctx.strokeStyle = '#ffd166'
      ctx.lineWidth = s * 0.06
      ctx.beginPath()
      ctx.moveTo(-s * 1.0, -s * 0.06)
      ctx.quadraticCurveTo(s * 0.6, -s * 0.12, s * 1.15, -s * 0.02)
      ctx.stroke()
      ctx.strokeStyle = OUT
      ctx.lineWidth = 2
      // рубка сзади
      ctx.fillStyle = '#f1faee'
      ctx.beginPath()
      ctx.roundRect(-s * 0.85, -s * 0.5, s * 0.5, s * 0.45, s * 0.06)
      ctx.fill()
      ctx.stroke()
      windows(ctx, [-s * 0.75], -s * 0.42, s * 0.22, s * 0.2)
      // мачта, стрела, сеть
      ctx.beginPath()
      ctx.moveTo(s * 0.05, -s * 0.05)
      ctx.lineTo(s * 0.05, -s * 1.4)
      ctx.moveTo(s * 0.05, -s * 1.1)
      ctx.lineTo(s * 0.7, -s * 0.75)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(35,48,71,0.6)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(s * 0.7, -s * 0.75)
      ctx.lineTo(s * 0.7, -s * 0.1)
      ctx.stroke()
      ctx.strokeStyle = OUT
      ctx.lineWidth = 2
      // буйки
      ctx.fillStyle = '#ff8c1a'
      for (const x of [-s * 0.3, -s * 0.1]) {
        ctx.beginPath()
        ctx.arc(x, -s * 0.16, s * 0.09, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
      }
      flag(ctx, s * 0.05, -s * 1.4, s, '#1982c4', t, 0.3, 0.14)
      break
    }
  }
}

/**
 * Кильватер: расходящийся V-след пены за судном + бурун от мотора.
 * trail: [{x, y, t}] от старых к новым; heading — направление движения (рад)
 */
export function drawWake(ctx, b, t, { depth, storm }) {
  const life = 4.5
  const pts = b.trail
  if (pts.length < 2) return
  ctx.lineCap = 'round'
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i]
    const q = pts[i - 1]
    const age = t - p.t
    if (age > life) continue
    const k = 1 - age / life
    const spread = (2 + age * 5) * (0.5 + depth) // V-след расходится со временем
    const dx = p.x - q.x
    const dy = p.y - q.y
    const len = Math.hypot(dx, dy) || 1
    const nx = -dy / len
    const ny = dx / len
    // две ветви V + центральная полоса пены
    ctx.strokeStyle = `rgba(255,255,255,${0.45 * k})`
    ctx.lineWidth = 1.2 * (0.5 + depth)
    ctx.beginPath()
    ctx.moveTo(q.x + nx * spread, q.y + ny * spread * 0.45)
    ctx.lineTo(p.x + nx * (spread + 1), p.y + ny * (spread + 1) * 0.45)
    ctx.moveTo(q.x - nx * spread, q.y - ny * spread * 0.45)
    ctx.lineTo(p.x - nx * (spread + 1), p.y - ny * (spread + 1) * 0.45)
    ctx.stroke()
    ctx.strokeStyle = `rgba(255,255,255,${0.28 * k})`
    ctx.lineWidth = (1.5 + age * 1.8) * (0.5 + depth)
    ctx.beginPath()
    ctx.moveTo(q.x, q.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
  }
  // бурун от мотора: белая клякса у кормы (катер и буксир — заметнее)
  const last = pts[pts.length - 1]
  const dirX = Math.cos(b.angle)
  const sizeK = b.type === 'speed' ? 1.4 : b.type === 'tug' ? 1.1 : 0.7
  const r = b.size * 0.35 * sizeK * (0.55 + depth * 0.7)
  ctx.fillStyle = `rgba(255,255,255,${0.55 + storm * 0.2})`
  for (let i = 0; i < 3; i++) {
    const ph = (t * 4 + i * 0.33) % 1
    ctx.globalAlpha = 1 - ph
    ctx.beginPath()
    ctx.arc(last.x - dirX * (b.size * 0.9 + ph * b.size * 0.6), last.y + 1, r * (0.5 + ph * 0.7), 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}
