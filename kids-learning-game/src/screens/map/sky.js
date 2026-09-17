/**
 * Небо, солнце и облака (Canvas 2D).
 *  - небо: многослойный градиент + атмосферная дымка у горизонта + тёплое свечение вокруг солнца
 *  - солнце: объёмный диск, мягкие «god rays», блики линзы вдоль оси солнце→центр
 *  - облака: пухлые объёмные с тенью снизу и светом сверху; три слоя параллакса;
 *    грозовая туча — тёмная, с внутренними вспышками
 */

const rnd = (a, b) => a + Math.random() * (b - a)

export function mixRGB(c1, c2, a) {
  const p = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]
  const [r1, g1, b1] = p(c1)
  const [r2, g2, b2] = p(c2)
  return `rgb(${Math.round(r1 + (r2 - r1) * a)},${Math.round(g1 + (g2 - g1) * a)},${Math.round(b1 + (b2 - b1) * a)})`
}

// ---------------------------------------------------------------- небо
export function drawSky(ctx, { W, H, horizon, storm, sun, t }) {
  const l = storm
  const g = ctx.createLinearGradient(0, 0, 0, horizon)
  g.addColorStop(0, mixRGB('#1f6fd0', '#2f3b52', l))
  g.addColorStop(0.45, mixRGB('#4ea6ef', '#5b6c85', l))
  g.addColorStop(0.85, mixRGB('#a8dcff', '#8d9bb0', l))
  g.addColorStop(1, mixRGB('#e9f6ff', '#aab5c4', l))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, horizon + 1)

  // тёплое свечение атмосферы вокруг солнца
  if (l < 0.95) {
    const glow = ctx.createRadialGradient(sun[0], sun[1], 0, sun[0], sun[1], Math.max(W, H) * 0.55)
    glow.addColorStop(0, `rgba(255,236,190,${0.45 * (1 - l)})`)
    glow.addColorStop(0.35, `rgba(255,220,160,${0.16 * (1 - l)})`)
    glow.addColorStop(1, 'rgba(255,220,160,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, W, horizon + 1)
  }

  // дымка у горизонта: светлая полоса, слегка «дышит»
  const hz = ctx.createLinearGradient(0, horizon - H * 0.16, 0, horizon)
  const breathe = 0.85 + 0.15 * Math.sin(t * 0.3)
  hz.addColorStop(0, 'rgba(255,255,255,0)')
  hz.addColorStop(1, `rgba(255,255,255,${(0.7 - l * 0.4) * breathe})`)
  ctx.fillStyle = hz
  ctx.fillRect(0, horizon - H * 0.16, W, H * 0.16)
}

// ---------------------------------------------------------------- солнце
export function drawSun(ctx, { W, H, horizon, storm, sun, t, q }) {
  const l = storm
  if (l > 0.97) return
  const [x, y] = sun
  const r = Math.min(W, H) * 0.065
  const a = 1 - l
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'

  // god rays: 14 мягких лучей, медленно вращаются, пульсируют по одному
  ctx.translate(x, y)
  ctx.rotate(t * 0.04)
  for (let i = 0; i < (q?.rays === false ? 0 : 14); i++) {
    const ang = (i / 14) * Math.PI * 2
    const len = r * (6 + 2.5 * Math.sin(t * 0.7 + i * 1.9))
    const wdt = 0.09 + 0.05 * Math.sin(t * 0.5 + i)
    const ray = ctx.createLinearGradient(0, 0, Math.cos(ang) * len, Math.sin(ang) * len)
    ray.addColorStop(0, `rgba(255,240,180,${0.22 * a})`)
    ray.addColorStop(0.5, `rgba(255,235,170,${0.07 * a})`)
    ray.addColorStop(1, 'rgba(255,235,170,0)')
    ctx.fillStyle = ray
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(Math.cos(ang - wdt) * len, Math.sin(ang - wdt) * len)
    ctx.lineTo(Math.cos(ang + wdt) * len, Math.sin(ang + wdt) * len)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'

  // ореол
  const halo = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * 3.4)
  halo.addColorStop(0, `rgba(255,245,200,${0.55 * a})`)
  halo.addColorStop(0.4, `rgba(255,236,170,${0.18 * a})`)
  halo.addColorStop(1, 'rgba(255,236,170,0)')
  ctx.fillStyle = halo
  ctx.fillRect(x - r * 3.4, y - r * 3.4, r * 6.8, r * 6.8)

  // диск — объёмный: светлый центр, тёплый край (обычное смешивание)
  ctx.globalCompositeOperation = 'source-over'
  const disk = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r)
  disk.addColorStop(0, '#fffbe6')
  disk.addColorStop(0.55, '#ffe66d')
  disk.addColorStop(1, '#ffb703')
  ctx.globalAlpha = a
  ctx.fillStyle = disk
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  // блики линзы: призраки вдоль оси солнце → центр экрана и на отражении в воде
  ctx.globalCompositeOperation = 'lighter'
  const cx = W / 2
  const cy = H / 2
  const ghosts = q?.flare === false ? [] : [
    { k: 0.35, rr: r * 0.35, c: '255,200,120', al: 0.18 },
    { k: 0.6, rr: r * 0.22, c: '160,220,255', al: 0.16 },
    { k: 0.85, rr: r * 0.6, c: '255,170,200', al: 0.08 },
    { k: 1.25, rr: r * 0.3, c: '200,255,220', al: 0.12 },
  ]
  for (const gh of ghosts) {
    const gx = x + (cx - x) * gh.k
    const gy = y + (cy - y) * gh.k
    const gg = ctx.createRadialGradient(gx, gy, 0, gx, gy, gh.rr)
    gg.addColorStop(0, `rgba(${gh.c},${gh.al * a})`)
    gg.addColorStop(0.7, `rgba(${gh.c},${gh.al * 0.5 * a})`)
    gg.addColorStop(1, `rgba(${gh.c},0)`)
    ctx.fillStyle = gg
    ctx.beginPath()
    ctx.arc(gx, gy, gh.rr, 0, Math.PI * 2)
    ctx.fill()
  }
  // горизонтальная полоска блика (anamorphic)
  const streak = ctx.createLinearGradient(x - r * 5, y, x + r * 5, y)
  streak.addColorStop(0, 'rgba(255,240,200,0)')
  streak.addColorStop(0.5, `rgba(255,240,200,${0.35 * a})`)
  streak.addColorStop(1, 'rgba(255,240,200,0)')
  ctx.fillStyle = streak
  ctx.fillRect(x - r * 5, y - r * 0.06, r * 10, r * 0.12)
  // отражение солнца на воде: мягкое пятно на «зеркальной» точке под горизонтом
  const ry = horizon + (horizon - y) * 0.35
  const refl = ctx.createRadialGradient(x, ry, 0, x, ry, r * 2.2)
  refl.addColorStop(0, `rgba(255,240,190,${0.22 * a})`)
  refl.addColorStop(1, 'rgba(255,240,190,0)')
  ctx.fillStyle = refl
  ctx.beginPath()
  ctx.ellipse(x, ry, r * 2.2, r * 0.7, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// ---------------------------------------------------------------- облака
/** форма облака: набор пухлых кругов, 3 силуэта */
export function makeCloudShape() {
  const n = 5 + Math.floor(Math.random() * 4)
  const style = ['flat', 'tall', 'long'][Math.floor(Math.random() * 3)]
  const puffs = []
  for (let i = 0; i < n; i++) {
    const u = n === 1 ? 0.5 : i / (n - 1)
    const x = (u - 0.5) * (style === 'long' ? 1.15 : 0.85) + rnd(-0.06, 0.06)
    const r = (style === 'tall' ? rnd(0.22, 0.34) : rnd(0.18, 0.28)) * (1 - Math.abs(u - 0.5) * 0.55)
    const y = -r * (style === 'tall' ? rnd(0.35, 0.95) : rnd(0.1, 0.55))
    puffs.push({ x, y, r })
  }
  puffs.push({ x: -0.22, y: 0.02, r: 0.2 }, { x: 0.2, y: 0.02, r: 0.2 }, { x: 0, y: 0.04, r: 0.22 })
  return puffs
}

/** слои параллакса: масштаб, скорость, прозрачность, высота */
export const CLOUD_LAYERS = [
  { scale: 0.55, speed: 0.45, alpha: 0.72, y: [0.03, 0.11] }, // далёкие
  { scale: 1.0, speed: 1.0, alpha: 0.9, y: [0.06, 0.2] }, // средние
  { scale: 1.45, speed: 1.7, alpha: 1.0, y: [0.12, 0.27] }, // ближние
]

/**
 * c: { x, y, w, puffs, kind: 'white'|'dark', layer, flash? }
 */
export function drawCloud(ctx, c, { storm, sunX, q }) {
  const l = storm
  const dark = c.kind === 'dark'
  const layer = CLOUD_LAYERS[c.layer ?? 1]
  const w = c.w
  const alpha = layer.alpha
  const lightFromRight = sunX > c.x ? 1 : -1

  const base = dark ? mixRGB('#7c8797', '#4a5566', l) : mixRGB('#ffffff', '#b7c1cf', l)
  const shade = dark ? mixRGB('#4f5a6b', '#2e3542', l) : mixRGB('#c9dcee', '#7e8a9a', l)
  const rim = dark ? mixRGB('#a3adbb', '#6a7585', l) : '#ffffff'

  ctx.save()
  ctx.globalAlpha = alpha

  // 1) тень снизу — тот же силуэт, сдвинут вниз, тёмнее
  ctx.fillStyle = shade
  ctx.beginPath()
  for (const p of c.puffs) {
    const px = c.x + p.x * w
    const py = c.y + p.y * w + w * 0.06
    ctx.moveTo(px + p.r * w, py)
    ctx.arc(px, py, p.r * w, 0, Math.PI * 2)
  }
  ctx.fill()

  // 2) тело — каждый пух с радиальным градиентом (свет сверху со стороны солнца);
  //    на слабых устройствах — одним цветом
  if (q?.cloudShading === false) {
    ctx.fillStyle = base
    ctx.beginPath()
    for (const p of c.puffs) {
      const px = c.x + p.x * w
      const py = c.y + p.y * w
      ctx.moveTo(px + p.r * w, py)
      ctx.arc(px, py, p.r * w, 0, Math.PI * 2)
    }
    ctx.fill()
  } else {
    for (const p of c.puffs) {
      const px = c.x + p.x * w
      const py = c.y + p.y * w
      const r = p.r * w
      const g = ctx.createRadialGradient(px + lightFromRight * r * 0.35, py - r * 0.45, r * 0.1, px, py, r)
      g.addColorStop(0, rim)
      g.addColorStop(0.55, base)
      g.addColorStop(1, shade)
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(px, py, r, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // 3) мягкая светлая кромка сверху
  ctx.globalAlpha = alpha * (dark ? 0.35 : 0.55)
  ctx.fillStyle = rim
  ctx.beginPath()
  for (const p of c.puffs) {
    if (p.y > -0.05) continue
    const px = c.x + p.x * w + lightFromRight * p.r * w * 0.25
    const py = c.y + p.y * w - p.r * w * 0.3
    ctx.moveTo(px + p.r * w * 0.55, py)
    ctx.arc(px, py, p.r * w * 0.55, 0, Math.PI * 2)
  }
  ctx.fill()

  // 4) внутренние вспышки грозовой тучи
  if (dark && c.flash && c.flash.a > 0.01) {
    ctx.globalCompositeOperation = 'lighter'
    ctx.globalAlpha = c.flash.a
    const fx = c.x + c.flash.x * w
    const fy = c.y + c.flash.y * w
    const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, w * 0.45)
    fg.addColorStop(0, 'rgba(255,250,210,0.95)')
    fg.addColorStop(0.35, 'rgba(255,235,160,0.45)')
    fg.addColorStop(1, 'rgba(255,235,160,0)')
    ctx.fillStyle = fg
    ctx.beginPath()
    for (const p of c.puffs) {
      const px = c.x + p.x * w
      const py = c.y + p.y * w
      ctx.moveTo(px + p.r * w, py)
      ctx.arc(px, py, p.r * w, 0, Math.PI * 2)
    }
    ctx.fill()
  }
  ctx.restore()
}

/** обновить вспышку тучи: случайные внутренние разряды в грозу */
export function updateCloudFlash(c, dt, storm, t) {
  if (c.kind !== 'dark') return
  if (!c.flash) c.flash = { a: 0, x: 0, y: -0.2, next: t + rnd(1, 3) }
  c.flash.a = Math.max(0, c.flash.a - dt * 3.5)
  if (storm > 0.4 && t > c.flash.next) {
    c.flash.a = rnd(0.6, 1)
    c.flash.x = rnd(-0.35, 0.35)
    c.flash.y = rnd(-0.35, -0.05)
    c.flash.next = t + (Math.random() < 0.35 ? rnd(0.12, 0.3) : rnd(1.2, 4))
  }
}

