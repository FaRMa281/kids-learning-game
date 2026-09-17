/**
 * Сцена карты. Слои снизу вверх:
 *   WebGL-вода (water.js) → Canvas 2D: небо, солнце, облака (sky.js), кораблики (boats.js),
 *   дождь (rain.js), молнии → DOM-острова (MapScreen) → затемнение/вспышка (DOM)
 *
 * Погода (weather.phase):
 *   clear     — солнечно, 2–4 белых облака в трёх слоях параллакса
 *   approach  — заходит одна туча; когда она целиком на экране → CLOUD_PAUSE → белые облака
 *               непрерывно разгоняются (скорость удваивается каждые RAMP с), пока не уйдут с экрана
 *   storm     — когда ушло последнее белое: темнеет, волны выше, ливень с брызгами, молнии, гром,
 *               внутренние вспышки в туче; туча идёт ×2 быстрее; гроза кончается, когда туча уходит
 *   blowaway  — вентилятор: всё разгоняется вправо; когда улетело → clear
 *   (в ясную погоду вентилятор только подгоняет облака: ×2 на пару секунд, потом обычный ход)
 *
 * createScene(canvas, { onThunder, onOverlay, water }) →
 *   { start, stop, destroy, setIslands, blow, ripple, weather, weatherSpeed, cloudCount, nextStormIn, debug* }
 */

import { BOAT_TYPES, drawBoat, drawWake } from './boats'
import { waterHeight } from './noise'
import { createQuality } from './quality'
import { createRain } from './rain'
import { CLOUD_LAYERS, drawCloud, drawSky, drawSun, makeCloudShape, mixRGB, updateCloudFlash } from './sky'

export const HORIZON = 0.38 // доля высоты экрана, где горизонт

const rnd = (a, b) => a + Math.random() * (b - a)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const smooth = (u) => u * u * (3 - 2 * u)

// тайминги, секунды (по часам погоды wt)
const FIRST_STORM_AT = [45, 75]
const NEXT_STORM_AT = [90, 150]
const CLOUD_PAUSE = 2
const RAMP = 2 // скорость облака удваивается каждые RAMP с при разгоне
const STORM_MAX = 60 // страховка: шторм заканчивается, даже если тучи застряли
const FAN_DELAY = 0.7
const LEVEL_FADE = 3.5 // с реального времени — плавный переход между уровнями шторма
const DARK_SPEED = 26 // px/с (при ширине 1024) — одна скорость у всех туч
const STORM_FRONT = 5 // сколько туч заходит фронтом, когда ушло последнее белое облако

// ---------------------------------------------------------------- запасная вода (без WebGL)
const WAVE_LAYERS = [
  { y: 0.08, len: 460, amp: 5, speed: 10, sway: 2, color: '#1b6fb5', storm: '#2b4b66' },
  { y: 0.26, len: 380, amp: 8, speed: 17, sway: 3, color: '#2288cf', storm: '#335a78' },
  { y: 0.47, len: 300, amp: 11, speed: 26, sway: 4, color: '#37a6e6', storm: '#3f6a8a', foam: 0.35 },
  { y: 0.7, len: 240, amp: 14, speed: 38, sway: 5, color: '#5cc3f5', storm: '#4b7a9a', foam: 1 },
]

export function createScene(canvas, { onThunder, onOverlay, water = null } = {}) {
  const ctx = canvas.getContext('2d')
  let W = 0
  let H = 0
  let dpr = 1
  let raf = 0
  let last = 0
  let t = 0 // время сцены
  let wt = 0 // часы погоды (ускоряются админкой)
  let waterT = 0 // часы воды: в шторм идут быстрее — плавно, без скачков фазы шума
  let weatherSpeed = Number(localStorage.getItem('kids-learning:weatherSpeed')) || 1
  let islands = [] // [{x, y, r, h}] px

  const clouds = [] // { kind, layer, puffs, w, x, y, vx, mul, accel, base, ramp, flash }
  const boats = []
  const gusts = []
  const ripples = [] // { x, y, t0 } — круги от нажатия на остров
  const rain = createRain(() => ({ W, H, horizon: seaTop() }))
  let q = null // текущий уровень качества
  const quality = createQuality({
    onChange(tier) {
      q = tier
      water?.setQuality?.(tier.water)
      rain.setMax(tier.rainMax)
    },
  })

  const weather = { phase: 'clear', level: 0, dir: 1, cloud: null }
  const levelAnim = { from: 0, to: 0, t0: 0 } // плавный переход уровня шторма за LEVEL_FADE
  let nextStormAt = rnd(...FIRST_STORM_AT)
  let phaseAt = 0
  let pauseAt = null
  let whitesAccelerated = false
  let blowAt = null
  let puffAt = null
  let nextFlashAt = 0
  let flashV = 0
  let bolt = null
  const thunderQueue = []

  const seaTop = () => H * HORIZON
  const k = () => W / 1024
  const sunPos = () => [W * 0.8, H * 0.14]

  function resize() {
    // 2D-слой: полный DPR до 2 (Retina), на слабых устройствах — не выше 1.5
    dpr = Math.min(window.devicePixelRatio || 1, q && q.name === 'low' ? 1.5 : 2)
    W = canvas.clientWidth
    H = canvas.clientHeight
    if (!W || !H) return
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  // ---------------------------------------------------------------- облака
  function spawnCloud(kind, initial = false) {
    if (clouds.length >= 8) return null
    const dark = kind === 'dark'
    const layer = dark ? 1 : Math.random() < 0.3 ? 0 : Math.random() < 0.55 ? 1 : 2
    const L = CLOUD_LAYERS[layer]
    const w = (dark ? rnd(280, 360) : rnd(150, 240) * L.scale) * k()
    const dir = dark ? weather.dir : Math.random() < 0.5 ? 1 : -1
    const c = {
      kind,
      layer,
      puffs: makeCloudShape(),
      w,
      y: dark ? rnd(0.1, 0.19) * H : rnd(L.y[0], L.y[1]) * H,
      x: initial ? rnd(0, W) : dir > 0 ? -w * 0.6 : W + w * 0.6,
      dir,
      vx: (dark ? weather.dir * DARK_SPEED : dir * rnd(9, 18) * L.speed) * k(),
      mul: 1,
      base: 1,
      accel: null,
      ramp: null,
      flash: null,
    }
    clouds.push(c)
    return c
  }

  function accelerate(c) {
    if (c.accel !== null) return
    c.accel = wt
    c.base = c.mul
    c.ramp = null
  }

  function puff(c) {
    if (c.accel !== null || c.ramp) return
    c.ramp = { from: c.mul, to: c.mul * 2, t0: wt, back: true }
  }

  const onScreen = (c) => c.x > -c.w * 0.5 && c.x < W + c.w * 0.5
  const fullyOnScreen = (c) => c.x - c.w * 0.55 > 0 && c.x + c.w * 0.55 < W
  const whites = () => clouds.filter((c) => c.kind === 'white')

  function updateClouds(dt) {
    for (const c of clouds) {
      if (c.accel !== null) c.mul = c.base * Math.pow(2, (wt - c.accel) / RAMP)
      else if (c.ramp) {
        const u = clamp((wt - c.ramp.t0) / RAMP, 0, 1)
        c.mul = c.ramp.from + (c.ramp.to - c.ramp.from) * smooth(u)
        if (u >= 1) c.ramp = c.ramp.back ? { from: c.mul, to: c.ramp.from, t0: wt, back: false } : null
      }
      c.x += c.vx * c.mul * dt * weatherSpeed
      updateCloudFlash(c, dt, weather.level, t)
    }
    for (let i = clouds.length - 1; i >= 0; i--) {
      const c = clouds[i]
      if ((c.vx > 0 && c.x > W + c.w * 0.6) || (c.vx < 0 && c.x < -c.w * 0.6)) {
        if (c === weather.cloud) weather.cloud = null
        clouds.splice(i, 1)
      }
    }
    if (weather.phase !== 'clear') return
    const ws = whites()
    const visible = ws.filter(onScreen).length
    const incoming = ws.length - visible
    if (visible + incoming < 2 || (ws.length < 4 && Math.random() < dt * 0.02)) spawnCloud('white', clouds.length === 0)
  }

  // ---------------------------------------------------------------- погода
  function setPhase(p) {
    weather.phase = p
    phaseAt = wt
  }

  function startApproach() {
    setPhase('approach')
    pauseAt = null
    whitesAccelerated = false
    weather.dir = Math.random() < 0.5 ? 1 : -1
    weather.cloud = spawnCloud('dark')
  }

  const darks = () => clouds.filter((c) => c.kind === 'dark')

  function startStorm() {
    setPhase('storm')
    nextFlashAt = t + 1.5
    // фронт: ещё STORM_FRONT туч заходят следом с наветренной стороны, одна скорость у всех
    for (let i = 0; i < STORM_FRONT; i++) {
      const c = spawnCloud('dark')
      if (!c) break
      c.x -= weather.dir * (i + 1) * c.w * rnd(0.75, 0.95)
      c.y = rnd(0.02, 0.22) * H
      c.layer = i % 2 === 0 ? 2 : 1
    }
    // все тучи плавно (за RAMP с) выходят на ×2 — без рывка
    for (const c of darks()) {
      c.accel = null
      c.ramp = { from: c.mul, to: 2, t0: wt, back: false }
    }
  }

  function blow(withDelay = true) {
    if (weather.phase === 'blowaway') return
    if (weather.phase === 'clear') {
      if (puffAt === null) puffAt = wt + FAN_DELAY
      return
    }
    setPhase('blowaway')
    blowAt = wt + (withDelay ? FAN_DELAY : 0)
    bolt = null
  }

  function gustsBurst() {
    for (let i = 0; i < 26; i++) {
      gusts.push({ x: rnd(-0.3, 0.2) * W, y: rnd(0.03, 0.55) * H, v: rnd(500, 900) * k(), len: rnd(60, 160) * k(), a: rnd(0.25, 0.6), born: t + rnd(0, 1.2) })
    }
  }

  function updateWeather(dt) {
    switch (weather.phase) {
      case 'clear':
        if (puffAt !== null && wt >= puffAt) {
          puffAt = null
          clouds.forEach(puff)
          gustsBurst()
        }
        if (wt > nextStormAt) startApproach()
        break
      case 'approach': {
        const c = weather.cloud
        if (!c) {
          setPhase('clear')
          nextStormAt = wt + rnd(...NEXT_STORM_AT)
          break
        }
        if (pauseAt === null && fullyOnScreen(c)) pauseAt = wt
        if (pauseAt !== null && !whitesAccelerated && wt - pauseAt > CLOUD_PAUSE) {
          whitesAccelerated = true
          whites().forEach(accelerate)
        }
        if (whitesAccelerated && whites().length === 0) startStorm()
        break
      }
      case 'storm':
        if (darks().length === 0 || wt - phaseAt > STORM_MAX) blow(false)
        break
      case 'blowaway': {
        if (blowAt !== null && wt >= blowAt) {
          for (const c of clouds) {
            if (c.vx < 0) c.vx = -c.vx
            c.vx = Math.max(c.vx, 30 * k())
            c.mul = 1
            c.accel = null
            accelerate(c)
          }
          blowAt = null
          gustsBurst()
        }
        if (blowAt === null && clouds.length === 0) {
          setPhase('clear')
          nextStormAt = wt + rnd(...NEXT_STORM_AT)
        }
        break
      }
    }

    // уровень шторма следует за тучами: много туч → 1, осталась одна → 0.45, ушли → 0.
    // Переходы плавные, за LEVEL_FADE реального времени (не зависят от ускорения погоды).
    let target = 0
    if (weather.phase === 'storm') {
      // тучи на экране + ещё не показавшиеся, но идущие к экрану
      const n = darks().filter((c) => onScreen(c) || (c.vx > 0 && c.x < 0) || (c.vx < 0 && c.x > W)).length
      target = n >= 2 ? 1 : n === 1 ? 0.45 : 0
    } else if (weather.phase === 'blowaway') {
      target = darks().length >= 2 ? Math.min(weather.level, 0.6) : darks().length === 1 ? 0.3 : 0
    }
    if (levelAnim.to !== target) {
      levelAnim.from = weather.level
      levelAnim.to = target
      levelAnim.t0 = t
    }
    const u = clamp((t - levelAnim.t0) / LEVEL_FADE, 0, 1)
    weather.level = levelAnim.from + (levelAnim.to - levelAnim.from) * smooth(u)

    // молнии и гром
    flashV = Math.max(0, flashV - dt / 0.18)
    if (weather.phase === 'storm' && weather.level > 0.5 && t > nextFlashAt) {
      flashV = 1
      const onScr = darks().filter(onScreen)
      const c = onScr.length ? onScr[Math.floor(Math.random() * onScr.length)] : null
      const x0 = c ? c.x + rnd(-0.3, 0.3) * c.w : rnd(0.15, 0.85) * W
      const y0 = c ? c.y + c.w * 0.05 : rnd(0.02, 0.12) * H
      const pts = [[x0, y0]]
      let [x, y] = pts[0]
      while (y < seaTop()) {
        x += rnd(-32, 32) * k()
        y += rnd(24, 50) * k()
        pts.push([x, Math.min(y, seaTop())])
      }
      bolt = pts
      if (c) {
        c.flash = c.flash || { a: 0, x: 0, y: -0.2, next: 0 }
        c.flash.a = 1
        c.flash.x = clamp((x0 - c.x) / c.w, -0.4, 0.4)
        c.flash.y = -0.15
      }
      thunderQueue.push(t + rnd(0.4, 1.2))
      nextFlashAt = t + (Math.random() < 0.3 ? 0.15 : rnd(1.6, 4))
    }
    while (thunderQueue.length && t >= thunderQueue[0]) {
      thunderQueue.shift()
      onThunder?.()
    }
  }

  function drawBolt() {
    if (!bolt || flashV < 0.3) return
    ctx.save()
    ctx.lineCap = 'round'
    ctx.shadowColor = '#fff59d'
    ctx.shadowBlur = 24
    // широкое свечение + тонкая яркая жила
    ctx.strokeStyle = `rgba(255,230,140,${flashV * 0.45})`
    ctx.lineWidth = 10 * k()
    ctx.beginPath()
    bolt.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
    ctx.stroke()
    ctx.strokeStyle = `rgba(255,250,220,${flashV})`
    ctx.lineWidth = 3 * k()
    ctx.stroke()
    ctx.restore()
  }

  function drawGusts(dt) {
    ctx.lineCap = 'round'
    for (let i = gusts.length - 1; i >= 0; i--) {
      const g = gusts[i]
      if (t < g.born) continue
      g.x += g.v * dt
      if (g.x - g.len > W) {
        gusts.splice(i, 1)
        continue
      }
      ctx.strokeStyle = `rgba(255,255,255,${g.a})`
      ctx.lineWidth = 3 * k()
      ctx.beginPath()
      ctx.moveTo(g.x - g.len, g.y)
      ctx.quadraticCurveTo(g.x - g.len * 0.5, g.y - 6 * k(), g.x, g.y)
      ctx.stroke()
    }
  }

  // ---------------------------------------------------------------- дождь
  function updateRain(dt) {
    for (const c of darks()) if (onScreen(c)) rain.emitCloud(c, 40 + weather.level * 30, dt, k())
    if (weather.phase === 'storm' && weather.level > 0.05) rain.emitStorm(weather.level, -weather.dir * 220 * k() * weather.level, 260, dt, k())
    rain.update(dt)
    rain.draw(ctx, k())
  }

  // ---------------------------------------------------------------- кораблики
  function seaArea() {
    return { top: seaTop() + H * 0.06, bottom: H * 0.94 }
  }

  function randomTarget() {
    const { top, bottom } = seaArea()
    for (let tries = 0; tries < 30; tries++) {
      const x = rnd(W * 0.05, W * 0.95)
      const y = rnd(top, bottom)
      if (!islands.some((isl) => Math.hypot(isl.x - x, isl.y - y) < isl.r * 1.6)) return { x, y }
    }
    return { x: W / 2, y: (top + bottom) / 2 }
  }

  function spawnBoats() {
    boats.length = 0
    BOAT_TYPES.forEach((type, i) => {
      const p = randomTarget()
      boats.push({
        type,
        x: p.x,
        y: p.y,
        angle: rnd(0, Math.PI * 2),
        speed: rnd(18, 34) * k() * (type === 'tug' ? 0.7 : type === 'speed' ? 1.6 : 1),
        size: [30, 22, 32, 27, 28][i] * k(),
        target: randomTarget(),
        trail: [],
        trailT: 0,
      })
    })
  }

  function updateBoats(dt) {
    for (const b of boats) {
      let dx = b.target.x - b.x
      let dy = b.target.y - b.y
      for (const isl of islands) {
        const ix = b.x - isl.x
        const iy = b.y - isl.y
        const dist = Math.hypot(ix, iy)
        const safe = isl.r * 1.5
        if (dist < safe && dist > 0.1) {
          const push = ((safe - dist) / safe) * 3
          dx += (ix / dist) * push * 100
          dy += (iy / dist) * push * 100
        }
      }
      const want = Math.atan2(dy, dx)
      let diff = want - b.angle
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      b.angle += clamp(diff, -1.2 * dt, 1.2 * dt)
      b.x += Math.cos(b.angle) * b.speed * dt
      b.y += Math.sin(b.angle) * b.speed * dt
      const { top, bottom } = seaArea()
      b.y = clamp(b.y, top, bottom)
      if (Math.hypot(b.target.x - b.x, b.target.y - b.y) < 25 * k()) b.target = randomTarget()
      b.trailT += dt
      if (b.trailT > 0.08) {
        b.trailT = 0
        b.trail.push({ x: b.x, y: b.y, t })
        if (b.trail.length > 60) b.trail.shift()
      }
    }
  }

  /** нажатие по сцене: если рядом кораблик — он подпрыгивает; возвращает true, если попали */
  function tapAt(x, y, radius) {
    let best = null
    let bestD = radius
    for (const b of boats) {
      const d = Math.hypot(b.x - x, b.y - y)
      if (d < bestD) {
        bestD = d
        best = b
      }
    }
    if (!best) return false
    best.hopAt = t
    return true
  }

  function drawBoats() {
    const l = weather.level
    const sorted = [...boats].sort((a, b) => a.y - b.y)
    for (const b of sorted) {
      const depth = clamp((b.y - seaTop()) / (H - seaTop()), 0, 1)
      drawWake(ctx, b, t, { depth, storm: l })
    }
    for (const b of sorted) {
      const depth = clamp((b.y - seaTop()) / (H - seaTop()), 0, 1)
      const scale = 0.55 + depth * 0.7
      // качка по реальной поверхности воды: высота под кормой и носом → дифферент (pitch),
      // высота под бортами → крен (roll, через сжатие по вертикали)
      const len = b.size * scale
      const hz = seaTop()
      const hb = water?.ok ? waterHeight(b.x - len, b.y, waterT, W, H, hz) : Math.sin(t * 1.1 + b.x)
      const hf = water?.ok ? waterHeight(b.x + len, b.y, waterT, W, H, hz) : Math.sin(t * 1.1 + b.x + 1)
      const hs = water?.ok ? waterHeight(b.x, b.y + len * 0.4, waterT, W, H, hz) : 0
      const hc = (hb + hf) * 0.5
      const ampPx = (3 + depth * 7) * (1 + l * 1.2)
      // подпрыгивание после тапа: полусинус за 0.5 с
      const hop = b.hopAt !== undefined && t - b.hopAt < 0.5 ? Math.sin(((t - b.hopAt) / 0.5) * Math.PI) * 14 * scale : 0
      const bob = -hc * ampPx - hop
      const pitch = Math.atan2((hf - hb) * ampPx * 0.9, len * 2)
      const roll = 1 - clamp((hs - hc) * 0.25 * (1 + l), -0.12, 0.12)
      ctx.save()
      ctx.translate(b.x, b.y + bob)
      ctx.rotate(Math.cos(b.angle) < 0 ? -pitch : pitch)
      ctx.scale(Math.cos(b.angle) < 0 ? -1 : 1, roll)
      drawBoat(ctx, b.type, b.size * scale, t)
      ctx.restore()
    }
  }

  // ---------------------------------------------------------------- запасная вода (без WebGL)
  function wavePath(baseY, len, amp, phase) {
    const half = len / 2
    let x = -((phase % len) + len) % len - len
    ctx.moveTo(x, baseY)
    let up = true
    while (x < W + len) {
      ctx.quadraticCurveTo(x + half / 2, baseY + (up ? -amp * 2 : amp * 2), x + half, baseY)
      x += half
      up = !up
    }
  }

  function drawSeaFallback() {
    const top = seaTop()
    const seaH = H - top
    const l = weather.level
    const kk = k()
    const g = ctx.createLinearGradient(0, top, 0, H)
    g.addColorStop(0, mixRGB('#8fd3f7', '#5f7d95', l))
    g.addColorStop(0.25, mixRGB('#1b6fb5', '#2b4b66', l))
    g.addColorStop(1, mixRGB('#155f9e', '#22405a', l))
    ctx.fillStyle = g
    ctx.fillRect(0, top, W, seaH)
    WAVE_LAYERS.forEach((L, i) => {
      const len = L.len * kk
      const amp = L.amp * kk * (1 + l * 1.6)
      const speed = L.speed * kk * (1 + l * 1.2)
      const baseY = top + L.y * seaH + Math.sin(t * (0.45 + i * 0.1) + i * 1.3) * L.sway * kk
      ctx.beginPath()
      wavePath(baseY, len, amp, t * speed + i * 137)
      ctx.lineTo(W + len, H + 20)
      ctx.lineTo(-len * 2, H + 20)
      ctx.closePath()
      ctx.fillStyle = mixRGB(L.color, L.storm, l)
      ctx.fill()
    })
  }

  // ---------------------------------------------------------------- кадр
  function frame(now) {
    raf = requestAnimationFrame(frame)
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016)
    last = now
    t += dt
    wt += dt * weatherSpeed
    waterT += dt * (1 + weather.level * 1.4) // шторм ускоряет воду плавно вместе с уровнем

    for (let i = ripples.length - 1; i >= 0; i--) if (waterT - ripples[i].t0 > 1.8) ripples.splice(i, 1)

    ctx.clearRect(0, 0, W, H)
    updateWeather(dt)
    const env = { W, H, horizon: seaTop(), storm: weather.level, sun: sunPos(), t }
    env.q = q
    drawSky(ctx, env)
    drawSun(ctx, env)
    updateClouds(dt)
    // облака по слоям: дальние первыми
    for (let layer = 0; layer < 3; layer++) {
      for (const c of clouds) if ((c.layer ?? 1) === layer) drawCloud(ctx, c, { storm: weather.level, t, sunX: env.sun[0], q })
    }
    drawBolt()
    drawGusts(dt)
    if (water?.ok) {
      water.render(waterT, {
        storm: weather.level,
        horizon: seaTop(),
        sun: env.sun,
        islands: islands.map((isl) => ({ x: isl.x, y: isl.y + isl.h * 0.35, rx: isl.r * 1.05, ry: isl.r * 0.38 })),
        ripples,
      })
    } else {
      drawSeaFallback()
    }
    updateBoats(dt)
    drawBoats()
    updateRain(dt)
    onOverlay?.(weather.level * 0.32, flashV * 0.7)
    quality.tick(dt)
  }

  function start() {
    resize()
    if (!clouds.length) for (let i = 0; i < 3; i++) spawnCloud('white', true)
    if (!boats.length) spawnBoats()
    last = performance.now()
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(frame)
  }

  function stop() {
    cancelAnimationFrame(raf)
    onOverlay?.(0, 0)
  }

  let resizeTimer = 0
  const onResize = () => {
    resize()
    // кораблики пересаживаем с задержкой, чтобы не дёргать при каждом шаге анимации панелей
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(spawnBoats, 250)
  }
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null
  ro?.observe(canvas)
  window.addEventListener('orientationchange', onResize)

  return {
    start,
    stop,
    destroy() {
      stop()
      ro?.disconnect()
      window.removeEventListener('orientationchange', onResize)
      clearTimeout(resizeTimer)
    },
    tapAt,
    get quality() {
      return quality
    },
    setIslands(list) {
      islands = list
    },
    /** импульс на воде (нажатие на остров): x, y — px экрана */
    ripple(x, y) {
      ripples.push({ x, y, t0: waterT })
      if (ripples.length > 4) ripples.shift()
    },
    blow: () => blow(true),
    get weather() {
      return weather
    },
    get cloudCount() {
      return clouds.length
    },
    get time() {
      return t
    },
    get weatherSpeed() {
      return weatherSpeed
    },
    set weatherSpeed(v) {
      weatherSpeed = v
      localStorage.setItem('kids-learning:weatherSpeed', String(v))
    },
    get nextStormIn() {
      return nextStormAt - wt
    },
    debugStorm() {
      if (weather.phase === 'clear') startApproach()
    },
    debugStormNow() {
      if (weather.phase === 'storm') return
      for (let i = clouds.length - 1; i >= 0; i--) if (clouds[i].kind === 'white') clouds.splice(i, 1)
      if (!weather.cloud) {
        weather.dir = Math.random() < 0.5 ? 1 : -1
        weather.cloud = spawnCloud('dark')
        if (weather.cloud) weather.cloud.x = W * rnd(0.35, 0.65)
      }
      startStorm()
    },
    debugClear() {
      clouds.length = 0
      weather.cloud = null
      rain.clear()
      bolt = null
      weather.level = 0
      setPhase('clear')
      nextStormAt = wt + rnd(...NEXT_STORM_AT)
      for (let i = 0; i < 3; i++) spawnCloud('white', true)
    },
  }
}
