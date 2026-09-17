/**
 * 2D simplex noise — порт функции из шейдера воды (water.js, вариант Ashima Arts),
 * чтобы кораблики качались по той же поверхности, что нарисована на экране.
 */

const Cx = 0.211324865405187
const Cy = 0.366025403784439
const Cz = -0.577350269189626
const Cw = 0.024390243902439

const mod289 = (x) => x - Math.floor(x * (1 / 289)) * 289
const permute = (x) => mod289((x * 34 + 1) * x)
const fract = (x) => x - Math.floor(x)

export function snoise(vx, vy) {
  const s = (vx + vy) * Cy
  let ix = Math.floor(vx + s)
  let iy = Math.floor(vy + s)
  const tt = (ix + iy) * Cx
  const x0x = vx - ix + tt
  const x0y = vy - iy + tt
  const i1x = x0x > x0y ? 1 : 0
  const i1y = 1 - i1x
  const x1x = x0x + Cx - i1x
  const x1y = x0y + Cx - i1y
  const x2x = x0x + Cz
  const x2y = x0y + Cz
  ix = mod289(ix)
  iy = mod289(iy)
  const p0 = permute(permute(iy) + ix)
  const p1 = permute(permute(iy + i1y) + ix + i1x)
  const p2 = permute(permute(iy + 1) + ix + 1)

  let m0 = Math.max(0.5 - (x0x * x0x + x0y * x0y), 0)
  let m1 = Math.max(0.5 - (x1x * x1x + x1y * x1y), 0)
  let m2 = Math.max(0.5 - (x2x * x2x + x2y * x2y), 0)
  m0 *= m0; m0 *= m0
  m1 *= m1; m1 *= m1
  m2 *= m2; m2 *= m2

  const g = (p, xx, xy) => {
    const x = 2 * fract(p * Cw) - 1
    const h = Math.abs(x) - 0.5
    const a0 = x - Math.floor(x + 0.5)
    const norm = 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h)
    return [norm, a0 * xx + h * xy]
  }
  const [n0, g0] = g(p0, x0x, x0y)
  const [n1, g1] = g(p1, x1x, x1y)
  const [n2, g2] = g(p2, x2x, x2y)
  return 130 * (m0 * n0 * g0 + m1 * n1 * g1 + m2 * n2 * g2)
}

/**
 * Высота воды (≈ −1..1) в точке экрана — та же проекция и октавы, что в шейдере.
 * x, y — px экрана; W, H — размер; horizon — y горизонта; storm — 0..1.
 */
export function waterHeight(x, y, t, W, H, horizon) {
  const d = Math.max(0, (y - horizon) / (H - horizon))
  const z = 1 / (d + 0.07)
  const aspect = W / H
  const wx = (x / W - 0.5) * z * 1.6 * aspect
  const wy = z * 0.9
  const freq = 1 // как в шейдере: шторм не меняет частоту/скорость, время воды ускоряется снаружи
  const speed = 1
  const px = wx * freq
  const py = wy * freq
  let h = 0
  h += 0.55 * snoise(px + t * 0.1 * speed, py + t * 0.28 * speed)
  h += 0.28 * snoise(px * 2.1 - t * 0.18 * speed + 7.3, py * 2.1 + t * 0.42 * speed + 7.3)
  h += 0.13 * snoise(px * 4.3 + t * 0.35 * speed + 19.1, py * 4.3 - t * 0.25 * speed + 19.1)
  return h
}
