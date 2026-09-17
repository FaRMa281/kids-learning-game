import { useEffect, useRef } from 'react'

/**
 * Живой фон экрана острова (Canvas 2D): тематические объекты плавно парят, реагируют параллаксом
 * на мышь/палец. Тип задаёт theme.fx:
 *   letters — объёмные буквы с подсветкой и боке
 *   numbers — цифры с глазками, падающие звёздочки, паттерн из кубиков
 *   paint   — радуга, бабочки, капли краски и кляксы
 *   puzzle  — кусочки пазла, которые сходятся парами и снова расходятся
 */

const rnd = (a, b) => a + Math.random() * (b - a)
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const PALETTE = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#ff7b9c', '#ff8c1a']

export default function LevelBackdrop({ theme }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    let W = 0
    let H = 0
    let dpr = 1
    let raf = 0
    let t = 0
    let last = performance.now()
    const par = { x: 0, y: 0, tx: 0, ty: 0 } // параллакс: текущий и целевой сдвиг (−1..1)
    const items = []

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = canvas.clientWidth
      H = canvas.clientHeight
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const spawn = () => {
      items.length = 0
      const n = theme.fx === 'puzzle' ? 10 : 16
      for (let i = 0; i < n; i++) {
        items.push({
          x: rnd(0.02, 0.98),
          y: rnd(0.05, 0.95),
          z: rnd(0.35, 1), // глубина: дальше — меньше, медленнее, прозрачнее
          size: rnd(0.7, 1.3),
          rot: rnd(-0.4, 0.4),
          spin: rnd(-0.25, 0.25),
          phase: rnd(0, Math.PI * 2),
          speed: rnd(0.3, 0.7),
          glyph: pick(theme.glyphs),
          color: pick(PALETTE),
          pair: i % 2 === 0 ? i + 1 : i - 1, // для пазла: с кем сходимся
        })
      }
      // боке для всех тем
      for (let i = 0; i < 14; i++) items.push({ bokeh: true, x: rnd(0, 1), y: rnd(0, 1), z: rnd(0.2, 0.8), r: rnd(8, 40), phase: rnd(0, 6), speed: rnd(0.1, 0.3) })
    }

    // объёмная буква/цифра: несколько слоёв «выдавливания» + градиент + блик
    const drawGlyph3D = (g, x, y, size, alpha, glow) => {
      const font = `900 ${size}px ${getComputedStyle(document.body).fontFamily}`
      ctx.font = font
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(g.rot + Math.sin(t * g.speed + g.phase) * 0.12)
      ctx.globalAlpha = alpha
      if (glow > 0) {
        ctx.shadowColor = g.color
        ctx.shadowBlur = 30 * glow
      }
      const depth = Math.max(3, size * 0.09)
      for (let d = depth; d > 0; d -= 1.5) {
        ctx.fillStyle = shade(g.color, -0.45 + (d / depth) * 0.15)
        ctx.fillText(g.glyph, d * 0.6, d)
      }
      ctx.shadowBlur = 0
      const grad = ctx.createLinearGradient(0, -size / 2, 0, size / 2)
      grad.addColorStop(0, shade(g.color, 0.5))
      grad.addColorStop(0.5, g.color)
      grad.addColorStop(1, shade(g.color, -0.15))
      ctx.fillStyle = grad
      ctx.fillText(g.glyph, 0, 0)
      ctx.strokeStyle = 'rgba(35,48,71,0.5)'
      ctx.lineWidth = Math.max(1, size * 0.03)
      ctx.strokeText(g.glyph, 0, 0)
      // блик
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.beginPath()
      ctx.ellipse(-size * 0.12, -size * 0.28, size * 0.22, size * 0.09, -0.4, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    const drawEyes = (x, y, size) => {
      // глазки для цифр — смотрят в сторону курсора
      const ex = par.x * size * 0.06
      const ey = par.y * size * 0.06
      for (const dx of [-0.17, 0.17]) {
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.ellipse(x + dx * size, y - size * 0.05, size * 0.11, size * 0.13, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#233047'
        ctx.beginPath()
        ctx.arc(x + dx * size + ex, y - size * 0.05 + ey, size * 0.055, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const drawPuzzle = (x, y, s, color, rot, alpha) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rot)
      ctx.globalAlpha = alpha
      ctx.fillStyle = color
      ctx.strokeStyle = 'rgba(35,48,71,0.55)'
      ctx.lineWidth = Math.max(1.5, s * 0.05)
      const h = s / 2
      const k = s * 0.22
      ctx.beginPath()
      ctx.moveTo(-h, -h)
      ctx.lineTo(-k, -h)
      ctx.arc(0, -h, k, Math.PI, 0, false) // выступ сверху
      ctx.lineTo(h, -h)
      ctx.lineTo(h, -k)
      ctx.arc(h, 0, k, -Math.PI / 2, Math.PI / 2, true) // выемка справа
      ctx.lineTo(h, h)
      ctx.lineTo(-h, h)
      ctx.closePath()
      ctx.shadowColor = 'rgba(0,0,0,0.25)'
      ctx.shadowBlur = 8
      ctx.shadowOffsetY = 4
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0
      ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.fillRect(-h * 0.8, -h * 0.8, s * 0.6, s * 0.18)
      ctx.restore()
    }

    const drawButterfly = (x, y, s, color, alpha) => {
      const flap = Math.abs(Math.sin(t * 6 + x * 0.01)) * 0.7 + 0.3
      ctx.save()
      ctx.translate(x, y)
      ctx.globalAlpha = alpha
      ctx.fillStyle = color
      ctx.strokeStyle = 'rgba(35,48,71,0.5)'
      ctx.lineWidth = 1.5
      for (const side of [-1, 1]) {
        ctx.save()
        ctx.scale(side * flap, 1)
        ctx.beginPath()
        ctx.ellipse(s * 0.45, -s * 0.2, s * 0.45, s * 0.35, -0.3, 0, Math.PI * 2)
        ctx.ellipse(s * 0.38, s * 0.28, s * 0.32, s * 0.26, 0.3, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = 'rgba(255,255,255,0.45)'
        ctx.beginPath()
        ctx.arc(s * 0.5, -s * 0.22, s * 0.12, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
        ctx.fillStyle = color
      }
      ctx.fillStyle = '#233047'
      ctx.beginPath()
      ctx.ellipse(0, 0, s * 0.08, s * 0.42, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    const drawDrop = (x, y, s, color, alpha) => {
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.moveTo(x, y - s)
      ctx.quadraticCurveTo(x + s * 0.7, y + s * 0.1, x, y + s * 0.6)
      ctx.quadraticCurveTo(x - s * 0.7, y + s * 0.1, x, y - s)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.45)'
      ctx.beginPath()
      ctx.arc(x - s * 0.2, y - s * 0.05, s * 0.14, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      t += dt
      par.x += (par.tx - par.x) * Math.min(1, dt * 4)
      par.y += (par.ty - par.y) * Math.min(1, dt * 4)
      ctx.clearRect(0, 0, W, H)

      // радуга для paint-темы
      if (theme.fx === 'paint') {
        const cx = W * 0.75 + par.x * 20
        const cy = H * 1.05 + par.y * 10
        const R = Math.max(W, H) * 0.55
        const cols = ['#ff595e', '#ff8c1a', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93']
        ctx.lineWidth = R * 0.05
        ctx.globalAlpha = 0.28
        cols.forEach((c, i) => {
          ctx.strokeStyle = c
          ctx.beginPath()
          ctx.arc(cx, cy, R - i * R * 0.05, Math.PI, Math.PI * 2)
          ctx.stroke()
        })
        ctx.globalAlpha = 1
      }
      // кубики-паттерн для numbers
      if (theme.fx === 'numbers') {
        const cell = 64
        ctx.globalAlpha = 0.07
        ctx.fillStyle = '#1b4332'
        for (let y = -cell; y < H + cell; y += cell) {
          for (let x = -cell; x < W + cell; x += cell) {
            const ox = ((y / cell) | 0) % 2 === 0 ? 0 : cell / 2
            ctx.beginPath()
            ctx.roundRect(x + ox + par.x * 8 + 8, y + par.y * 8 + 8, cell - 16, cell - 16, 10)
            ctx.fill()
          }
        }
        ctx.globalAlpha = 1
      }

      // объекты по глубине: дальние первыми
      const sorted = [...items].sort((a, b) => a.z - b.z)
      for (const it of sorted) {
        const px = par.x * 40 * it.z
        const py = par.y * 26 * it.z
        if (it.bokeh) {
          const x = it.x * W + Math.sin(t * it.speed + it.phase) * 20 + px * 0.5
          const y = it.y * H + Math.cos(t * it.speed * 0.8 + it.phase) * 14 + py * 0.5
          const g = ctx.createRadialGradient(x, y, 0, x, y, it.r)
          g.addColorStop(0, `rgba(255,255,255,${0.35 * it.z})`)
          g.addColorStop(1, 'rgba(255,255,255,0)')
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(x, y, it.r, 0, Math.PI * 2)
          ctx.fill()
          continue
        }
        const base = Math.min(W, H) * 0.09 * it.size * it.z
        const bobX = Math.sin(t * it.speed + it.phase) * 14
        const bobY = Math.cos(t * it.speed * 0.7 + it.phase) * 18
        let x = it.x * W + bobX + px
        let y = it.y * H + bobY + py
        const alpha = 0.35 + it.z * 0.55
        const glow = 0.5 + 0.5 * Math.sin(t * 1.3 + it.phase)

        switch (theme.fx) {
          case 'letters':
            drawGlyph3D(it, x, y, base * 1.6, alpha, glow)
            break
          case 'numbers': {
            drawGlyph3D(it, x, y, base * 1.6, alpha, glow * 0.6)
            drawEyes(x, y - base * 0.2, base * 1.2)
            // падающие звёздочки
            const sy = ((t * 40 * it.speed + it.phase * 100) % (H + 60)) - 30
            ctx.globalAlpha = 0.6 * it.z
            ctx.fillStyle = '#ffd60a'
            ctx.font = `${base * 0.5}px serif`
            ctx.fillText('★', (it.x * W + px * 2 + 30) % W, sy)
            ctx.globalAlpha = 1
            break
          }
          case 'paint': {
            const kind = it.glyph
            if (kind === '🦋' || (theme.glyphs.includes('🦋') && it.pair % 3 === 0)) {
              x += Math.sin(t * 0.5 + it.phase) * 60
              drawButterfly(x, y, base, it.color, alpha)
            } else if (it.pair % 3 === 1) {
              const dy = ((t * 60 * it.speed + it.phase * 80) % (H + 80)) - 40
              drawDrop(x, dy, base * 0.45, it.color, alpha)
            } else {
              // клякса
              ctx.save()
              ctx.globalAlpha = alpha * 0.8
              ctx.fillStyle = it.color
              ctx.beginPath()
              for (let i = 0; i < 7; i++) {
                const a = (i / 7) * Math.PI * 2
                const r = base * (0.5 + 0.25 * Math.sin(i * 2.3 + it.phase))
                ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.8)
              }
              ctx.closePath()
              ctx.fill()
              ctx.font = `${base * 0.9}px serif`
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              ctx.globalAlpha = alpha
              ctx.fillText(it.glyph === '🦋' ? '🎨' : it.glyph, x, y)
              ctx.restore()
            }
            break
          }
          case 'puzzle': {
            // пары сходятся и расходятся: u ∈ 0..1, 1 = вместе
            const mate = items[it.pair]
            const u = 0.5 + 0.5 * Math.sin(t * 0.35 + (Math.min(it.pair, sorted.indexOf(it)) % 5) * 1.3)
            if (mate && !mate.bokeh) {
              const mx = mate.x * W + px
              const my = mate.y * H + py
              x = x + (mx - x) * u * 0.45
              y = y + (my - y) * u * 0.45
            }
            drawPuzzle(x, y, base * 1.3, it.color, it.rot * (1 - u) + Math.sin(t * 0.4 + it.phase) * 0.1, alpha)
            if (u > 0.92) {
              ctx.save()
              ctx.globalAlpha = (u - 0.92) / 0.08
              ctx.font = `${base * 0.6}px serif`
              ctx.textAlign = 'center'
              ctx.fillText('✨', x, y - base * 0.9)
              ctx.restore()
            }
            break
          }
        }
      }
    }

    const onMove = (e) => {
      const p = e.touches ? e.touches[0] : e
      if (!p) return
      par.tx = (p.clientX / W - 0.5) * 2
      par.ty = (p.clientY / H - 0.5) * 2
    }
    const onLeave = () => {
      par.tx = 0
      par.ty = 0
    }

    resize()
    spawn()
    const ro = new ResizeObserver(() => {
      resize()
    })
    ro.observe(canvas)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave)
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [theme])

  return <canvas ref={ref} className="backdrop" aria-hidden />
}

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16)
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + (k > 0 ? (255 - c) * k : c * k))))
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`
}
