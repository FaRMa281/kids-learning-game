/**
 * Вода на WebGL: фрагментный шейдер с симплекс-шумом.
 * Псевдо-3D перспектива (дальше от зрителя — мельче), градиент глубины, освещение по нормали,
 * солнечные блики, каустика, лёгкое преломление, пена на гребнях (сильнее в шторм)
 * и прибойная пенка по контуру островов.
 *
 * createWater(canvas) → { render(time, { storm, horizon, sun, islands, ripples }), resize(), destroy, ok }
 *   islands: [{x, y, rx, ry}] — эллипс ватерлинии острова в px экрана (y от верха)
 */

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

const FRAG = `
precision mediump float;

uniform vec2 u_res;      // размер буфера, px
uniform float u_time;
uniform float u_horizon; // y горизонта в px буфера (от верха)
uniform float u_storm;   // 0..1
uniform vec2 u_sun;      // позиция солнца в px буфера (от верха)
uniform vec4 u_islands[8];
uniform int u_count;
uniform vec3 u_ripples[4]; // x, y (px буфера), t0 — круги от нажатия на остров

// ---- simplex noise 2D (Ashima Arts / Stefan Gustavson, MIT)
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// высота воды в мировой точке p (3 октавы + быстрая рябь)
float height(vec2 p, float t, float speed) {
  float h = 0.0;
  h += 0.55 * snoise(p + vec2(t * 0.10, t * 0.28) * speed);
  h += 0.28 * snoise(p * 2.1 + vec2(-t * 0.18, t * 0.42) * speed + 7.3);
  h += 0.13 * snoise(p * 4.3 + vec2(t * 0.35, -t * 0.25) * speed + 19.1);
  h += 0.06 * snoise(p * 9.0 + vec2(t * 0.9, t * 0.6) * speed + 41.7);
  return h;
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y); // y от верха
  if (px.y < u_horizon) { gl_FragColor = vec4(0.0); return; }

  float t = u_time;
  float storm = u_storm;
  float d = (px.y - u_horizon) / (u_res.y - u_horizon); // 0 у горизонта … 1 у нижнего края
  float aspect = u_res.x / u_res.y;

  // псевдо-3D: плоскость воды в перспективе
  float z = 1.0 / (d + 0.07);
  vec2 world = vec2((px.x / u_res.x - 0.5) * z * 1.6 * aspect, z * 0.9);

  // частота и скорость НЕ зависят от шторма напрямую: скорость заложена в u_time (часы воды),
  // иначе при смене уровня шторма фаза шума скачет. Шторм меняет амплитуду, цвет и пену.
  float freq = 1.0;
  float speed = 1.0;
  float amp = 1.0 + storm * 1.3;
  vec2 p = world * freq;

  // высота и нормаль (конечные разности)
  float e = 0.035;
  float h = height(p, t, speed);
  float hx = height(p + vec2(e, 0.0), t, speed);
  float hy = height(p + vec2(0.0, e), t, speed);
  // наклон в перспективе слабее вдали (z большой → мир сжат на экране)
  float slopeK = 6.0 * amp / (1.0 + z * 0.35);
  vec3 n = normalize(vec3(-(hx - h) / e * slopeK * 0.02, -(hy - h) / e * slopeK * 0.02, 1.0));

  // свет от солнца
  vec2 toSun = (u_sun - px) / u_res.x;
  vec3 L = normalize(vec3(toSun.x * 1.2, -0.55, 0.75));
  float diff = max(dot(n, L), 0.0);
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 Hv = normalize(L + V);
  float spec = pow(max(dot(n, Hv), 0.0), 140.0);
  float sunPath = exp(-pow((px.x - u_sun.x) / (u_res.x * 0.22), 2.0)); // дорожка бликов под солнцем
  spec *= (0.5 + 1.6 * sunPath) * (1.0 - storm * 0.75);

  // цвет: глубокий синий вдали → светлый бирюзовый ближе к берегу; в шторм серо-синий
  vec3 deep = mix(vec3(0.05, 0.30, 0.62), vec3(0.13, 0.22, 0.32), storm);
  vec3 shallow = mix(vec3(0.24, 0.72, 0.84), vec3(0.24, 0.38, 0.48), storm);
  vec3 base = mix(deep, shallow, pow(d, 1.1));
  base *= 0.9 + 0.22 * h * amp; // гребень светлее, впадина темнее

  // лёгкое преломление: искажаем координаты каустики рябью
  vec2 disp = vec2(hx - h, hy - h) * 6.0;
  vec2 cuv = world * 3.2 * freq + disp + vec2(t * 0.14, -t * 0.11);
  float c1 = snoise(cuv);
  float c2 = snoise(cuv * 1.37 + vec2(3.1, 0.7) + vec2(-t * 0.09, t * 0.17));
  float caustic = pow(1.0 - abs(c1), 5.0) * pow(1.0 - abs(c2), 3.0);
  caustic *= (0.35 + 0.65 * d) * (1.0 - storm * 0.85); // заметнее на мелководье, в шторм гаснет

  vec3 col = base * (0.72 + 0.5 * diff);
  col += vec3(0.75, 0.95, 1.0) * caustic * 0.32;
  col += vec3(1.0, 0.98, 0.9) * spec;

  // пена на гребнях: порог ниже в шторм; рвётся шумом
  float fn = snoise(world * 7.0 * freq + vec2(t * 0.5, t * 0.3));
  float th = 0.62 - storm * 0.22;
  float foam = smoothstep(th, th + 0.22, h * amp * 0.9 + fn * 0.18);
  foam *= (0.25 + storm * 0.5) * (0.35 + 0.65 * d);
  col = mix(col, vec3(0.96, 0.99, 1.0), foam);

  // острова: мелководье светлее, по контуру — прибойная пенка
  for (int i = 0; i < 8; i++) {
    if (i >= u_count) break;
    vec4 I = u_islands[i];
    vec2 q = (px - I.xy) / I.zw;
    float r = length(q);
    float wob = 0.07 * snoise(q * 3.5 + vec2(t * 0.9, -t * 0.6)) + 0.04 * sin(t * 2.2 + q.x * 6.0);
    float shallowK = 1.0 - smoothstep(0.9, 1.9, r);
    col = mix(col, shallow * 1.05, shallowK * 0.35 * (1.0 - storm * 0.6));
    float ring = smoothstep(0.93 + wob, 1.02 + wob, r) * (1.0 - smoothstep(1.02 + wob, 1.32 + wob * 2.0, r));
    float breath = 0.75 + 0.25 * sin(t * 1.6 + float(i) * 1.3);
    col = mix(col, vec3(1.0), ring * (0.55 + storm * 0.35) * breath);
  }

  // круги на воде от нажатия на остров: расходящееся кольцо в перспективе
  for (int i = 0; i < 4; i++) {
    vec3 R = u_ripples[i];
    float age = t - R.z;
    if (R.z <= 0.0 || age < 0.0 || age > 1.8) continue;
    vec2 q = (px - R.xy) / vec2(1.0, 0.42);
    float rr = length(q) / u_res.x;
    float radius = age * 0.16;
    float w = 0.012 + age * 0.01;
    float ring = exp(-pow((rr - radius) / w, 2.0)) * (1.0 - age / 1.8);
    float ring2 = exp(-pow((rr - radius * 0.62) / w, 2.0)) * (1.0 - age / 1.8) * 0.6;
    col = mix(col, vec3(1.0), (ring + ring2) * 0.55);
    col -= (exp(-pow((rr - radius * 0.8) / (w * 1.5), 2.0))) * 0.08 * (1.0 - age / 1.8);
  }

  // дымка у горизонта
  float haze = (1.0 - smoothstep(0.0, 0.09, d)) * (0.55 - storm * 0.35);
  col = mix(col, vec3(0.90, 0.96, 1.0), haze);

  gl_FragColor = vec4(col, 1.0);
}
`

export function createWater(canvas) {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true })
  if (!gl) return { ok: false, render() {}, resize() {}, destroy() {} }
  // контекст могли потерять раньше (например, повторный монтаж в StrictMode) — пробуем вернуть
  if (gl.isContextLost()) {
    gl.getExtension('WEBGL_lose_context')?.restoreContext()
    if (gl.isContextLost()) return { ok: false, render() {}, resize() {}, destroy() {} }
  }

  function compile(type, src) {
    const sh = gl.createShader(type)
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error('water shader:', gl.getShaderInfoLog(sh))
      return null
    }
    return sh
  }
  const vs = compile(gl.VERTEX_SHADER, VERT)
  const fs = compile(gl.FRAGMENT_SHADER, FRAG)
  if (!vs || !fs) return { ok: false, render() {}, resize() {}, destroy() {} }
  const prog = gl.createProgram()
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('water program:', gl.getProgramInfoLog(prog))
    return { ok: false, render() {}, resize() {}, destroy() {} }
  }
  gl.useProgram(prog)

  // один треугольник на весь экран
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const aPos = gl.getAttribLocation(prog, 'a_pos')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  const U = {}
  for (const name of ['u_res', 'u_time', 'u_horizon', 'u_storm', 'u_sun', 'u_count']) U[name] = gl.getUniformLocation(prog, name)
  const uIslands = []
  for (let i = 0; i < 8; i++) uIslands.push(gl.getUniformLocation(prog, `u_islands[${i}]`))
  const uRipples = []
  for (let i = 0; i < 4; i++) uRipples.push(gl.getUniformLocation(prog, `u_ripples[${i}]`))

  let scale = 1 // буфер к CSS-пикселям
  let quality = 0.75 // доля DPR, задаётся адаптивным качеством
  let W = 0
  let H = 0

  function resize() {
    W = canvas.clientWidth
    H = canvas.clientHeight
    // вода мягкая — считаем в пониженном разрешении, экономим GPU на планшетах/телефонах
    scale = Math.min(window.devicePixelRatio || 1, 2) * quality
    canvas.width = Math.max(1, Math.round(W * scale))
    canvas.height = Math.max(1, Math.round(H * scale))
    gl.viewport(0, 0, canvas.width, canvas.height)
  }

  const islandData = new Float32Array(4)

  function render(time, { storm = 0, horizon = 0, sun = [0, 0], islands = [], ripples = [] } = {}) {
    if (canvas.clientWidth !== W || canvas.clientHeight !== H) resize()
    gl.uniform2f(U.u_res, canvas.width, canvas.height)
    gl.uniform1f(U.u_time, time)
    gl.uniform1f(U.u_horizon, horizon * scale)
    gl.uniform1f(U.u_storm, storm)
    gl.uniform2f(U.u_sun, sun[0] * scale, sun[1] * scale)
    const n = Math.min(8, islands.length)
    gl.uniform1i(U.u_count, n)
    for (let i = 0; i < n; i++) {
      const isl = islands[i]
      islandData[0] = isl.x * scale
      islandData[1] = isl.y * scale
      islandData[2] = isl.rx * scale
      islandData[3] = isl.ry * scale
      gl.uniform4fv(uIslands[i], islandData)
    }
    for (let i = 0; i < 4; i++) {
      const r = ripples[i]
      if (r) gl.uniform3f(uRipples[i], r.x * scale, r.y * scale, r.t0)
      else gl.uniform3f(uRipples[i], 0, 0, 0)
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  return {
    ok: true,
    render,
    resize,
    /** масштаб буфера относительно DPR (0.35 … 0.75) */
    setQuality(q) {
      if (q === quality) return
      quality = q
      resize()
    },
    destroy() {
      // контекст не теряем: canvas может быть смонтирован повторно (StrictMode/HMR) и получит тот же контекст
      gl.deleteProgram(prog)
      gl.deleteBuffer(buf)
    },
  }
}
