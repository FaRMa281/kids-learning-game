/**
 * Дождь — система частиц (Canvas 2D): капли летят под углом ветра, при ударе о воду
 * рождают кольцо и 2–3 брызги. У каждой капли своя «точка воды» (глубина в перспективе),
 * ближние капли крупнее и быстрее.
 *
 * createRain() → { emitCloud(c, rate, dt), emitStorm(level, wind, dt), update(dt), draw(ctx) }
 */

const rnd = (a, b) => a + Math.random() * (b - a)

export function createRain(getSize) {
  const drops = [] // { x, y, vx, vy, len, w, a, hitY }
  const rings = [] // { x, y, t, rx, ry }
  const splashes = [] // { x, y, vx, vy, t }
  let maxDrops = 900
  let time = 0

  function spawn(x, y, vx, vy, depthBias) {
    if (drops.length >= maxDrops) return
    const { W, H, horizon } = getSize()
    // куда упадёт: случайная точка воды; ближе к зрителю — реже, но крупнее
    const d = Math.pow(Math.random(), depthBias) // 0 у горизонта … 1 у низа
    const hitY = horizon + H * 0.03 + d * (H - horizon - H * 0.05)
    const near = 0.5 + d * 0.9
    drops.push({ x, y, vx: vx * near, vy: vy * near, len: rnd(9, 16) * near * (W / 1024), w: (1 + d * 1.4) * (W / 1024), a: 0.45 + d * 0.35, hitY, d })
  }

  return {
    /** дождь из тучи: капли падают из-под тучи c на воду под ней */
    emitCloud(c, rate, dt, k) {
      let n = rate * dt
      n = Math.floor(n) + (Math.random() < n % 1 ? 1 : 0)
      while (n-- > 0) spawn(c.x + rnd(-0.45, 0.45) * c.w, c.y + c.w * 0.08, rnd(-10, 10) * k, rnd(380, 520) * k, 1.6)
    },
    /** ливень шторма: на весь экран, с ветром */
    emitStorm(level, wind, rate, dt, k) {
      const { W } = getSize()
      let n = rate * level * dt
      n = Math.floor(n) + (Math.random() < n % 1 ? 1 : 0)
      while (n-- > 0) spawn(rnd(-0.25, 1.25) * W, -20, wind, rnd(650, 900) * k, 1.0)
    },
    update(dt) {
      time += dt
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i]
        d.x += d.vx * dt
        d.y += d.vy * dt
        if (d.y >= d.hitY) {
          drops.splice(i, 1)
          // всплеск: кольцо + брызги (не для каждой капли, чтобы не перегружать)
          if (rings.length < 220 && Math.random() < 0.55) {
            rings.push({ x: d.x, y: d.hitY, t: time, s: 0.5 + d.d * 1.2 })
            const m = 2 + Math.floor(Math.random() * 2)
            for (let j = 0; j < m; j++) {
              if (splashes.length > 400) break
              splashes.push({ x: d.x, y: d.hitY, vx: rnd(-40, 40) * (0.5 + d.d), vy: rnd(-130, -60) * (0.5 + d.d), t: time, s: 0.5 + d.d })
            }
          }
        }
      }
      for (let i = rings.length - 1; i >= 0; i--) if (time - rings[i].t > 0.55) rings.splice(i, 1)
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i]
        s.vy += 420 * dt
        s.x += s.vx * dt
        s.y += s.vy * dt
        if (time - s.t > 0.4) splashes.splice(i, 1)
      }
    },
    draw(ctx, k) {
      ctx.lineCap = 'round'
      // капли
      for (const d of drops) {
        ctx.strokeStyle = `rgba(215,238,255,${d.a})`
        ctx.lineWidth = d.w
        const kx = d.vx / d.vy
        ctx.beginPath()
        ctx.moveTo(d.x - kx * d.len, d.y - d.len)
        ctx.lineTo(d.x, d.y)
        ctx.stroke()
      }
      // кольца на воде
      for (const r of rings) {
        const u = (time - r.t) / 0.55
        const rx = (2 + u * 14) * r.s * k
        ctx.strokeStyle = `rgba(255,255,255,${0.55 * (1 - u)})`
        ctx.lineWidth = 1.2 * k
        ctx.beginPath()
        ctx.ellipse(r.x, r.y, rx, rx * 0.35, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
      // брызги
      ctx.fillStyle = 'rgba(235,248,255,0.85)'
      for (const s of splashes) {
        const u = (time - s.t) / 0.4
        ctx.globalAlpha = 1 - u
        ctx.beginPath()
        ctx.arc(s.x, s.y, 1.1 * s.s * k, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    },
    setMax(n) {
      maxDrops = n
    },
    clear() {
      drops.length = 0
      rings.length = 0
      splashes.length = 0
    },
    get count() {
      return drops.length
    },
  }
}
