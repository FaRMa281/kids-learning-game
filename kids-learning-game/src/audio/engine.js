/**
 * Звуковой движок: всё синтезируется в Web Audio, файлов нет.
 * Позже музыку/эффекты можно заменить на mp3 — интерфейс (playMusic/stopMusic/sfx) не изменится.
 */

let ctx = null
let masterGain = null

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
    masterGain = ctx.createGain()
    masterGain.gain.value = 0.5
    masterGain.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

/** Браузер требует жест пользователя, чтобы запустить звук — зовём при первом клике */
export function unlockAudio() {
  getCtx()
}

export function setMasterVolume(v) {
  if (masterGain) masterGain.gain.value = v
}

// ---------- простая нота ----------
function note(freq, start, dur, { type = 'triangle', gain = 0.25, attack = 0.02, release = 0.1, bus = null } = {}) {
  const c = getCtx()
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  // огибающая не должна быть длиннее самой ноты, время — не раньше "сейчас"
  start = Math.max(start, c.currentTime)
  attack = Math.min(attack, dur / 3)
  release = Math.min(release, dur / 3)
  g.gain.setValueAtTime(0, start)
  g.gain.linearRampToValueAtTime(gain, start + attack)
  g.gain.setValueAtTime(gain, start + dur - release)
  g.gain.linearRampToValueAtTime(0, start + dur)
  osc.connect(g).connect(bus ?? masterGain)
  osc.start(start)
  osc.stop(start + dur + 0.05)
  return osc
}

const N = {
  C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.0, A4: 440.0,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0,
  C3: 130.81, G3: 196.0, F3: 174.61, A3: 220.0,
}

// ---------- фоновая музыка: лёгкая пентатоника, цикл ----------
const BPM = 112
const BEAT = 60 / BPM
// [нота, длительность в долях]
const MELODY = [
  [N.C5, 1], [N.E5, 1], [N.G5, 1], [N.E5, 1],
  [N.D5, 1], [N.C5, 1], [N.A4, 2],
  [N.G4, 1], [N.A4, 1], [N.C5, 1], [N.D5, 1],
  [N.E5, 1.5], [N.D5, 0.5], [N.C5, 2],
]
const BASS = [N.C3, N.G3, N.A3, N.F3] // по такту (4 доли)

let musicTimer = null
let musicPlaying = false
let musicNodes = [] // запланированные ноты текущей музыки — чтобы обрубить при остановке

function scheduleLoop(startTime) {
  const bus = getMusicGain()
  let t = startTime
  MELODY.forEach(([f, d]) => {
    musicNodes.push(note(f, t, d * BEAT * 0.9, { type: 'triangle', gain: 0.12, bus }))
    t += d * BEAT
  })
  const loopLen = t - startTime
  const bars = Math.round(loopLen / (4 * BEAT))
  for (let b = 0; b < bars; b++) {
    const bt = startTime + b * 4 * BEAT
    musicNodes.push(note(BASS[b % BASS.length], bt, 4 * BEAT * 0.95, { type: 'sine', gain: 0.1, attack: 0.05, bus }))
    // лёгкий "тик" на 2 и 4 долю
    musicNodes.push(note(N.C5 * 2, bt + BEAT, 0.05, { type: 'square', gain: 0.02, bus }))
    musicNodes.push(note(N.C5 * 2, bt + 3 * BEAT, 0.05, { type: 'square', gain: 0.02, bus }))
  }
  return loopLen
}

export function playMusic() {
  if (musicPlaying) return
  const c = getCtx()
  musicPlaying = true
  const bus = getMusicGain()
  bus.gain.cancelScheduledValues(c.currentTime)
  bus.gain.setValueAtTime(1, c.currentTime)
  let next = c.currentTime + 0.1
  const tick = () => {
    if (!musicPlaying) return
    if (musicNodes.length > 400) musicNodes = musicNodes.slice(-200)
    // планируем следующий цикл, когда до его начала < 1 с
    if (next - c.currentTime < 1) next += scheduleLoop(next)
    musicTimer = setTimeout(tick, 250)
  }
  tick()
}

let musicGain = null // отдельная шина музыки, чтобы глушить её мгновенно, не трогая эффекты

function getMusicGain() {
  if (!musicGain) {
    musicGain = getCtx().createGain()
    musicGain.connect(masterGain)
  }
  return musicGain
}

export function stopMusic() {
  musicPlaying = false
  clearTimeout(musicTimer)
  if (musicGain) {
    const c = getCtx()
    musicGain.gain.cancelScheduledValues(c.currentTime)
    musicGain.gain.setValueAtTime(musicGain.gain.value, c.currentTime)
    musicGain.gain.linearRampToValueAtTime(0, c.currentTime + 0.25)
    const cutoff = c.currentTime + 0.3
    musicNodes.forEach((osc) => {
      try {
        osc.stop(cutoff)
      } catch {
        /* уже остановлен */
      }
    })
    musicNodes = []
  }
}

export function isMusicPlaying() {
  return musicPlaying
}

// ---------- эффекты ----------
export const sfx = {
  correct() {
    const t = getCtx().currentTime
    ;[N.C5, N.E5, N.G5, N.C5 * 2].forEach((f, i) =>
      note(f, t + i * 0.09, 0.25, { type: 'triangle', gain: 0.3 }),
    )
  },
  wrong() {
    // мягкое "хм-м", без резкого "бззз"
    const t = getCtx().currentTime
    note(N.E4, t, 0.18, { type: 'sine', gain: 0.25 })
    note(N.D4, t + 0.18, 0.28, { type: 'sine', gain: 0.25 })
  },
  click() {
    const t = getCtx().currentTime
    note(N.A5, t, 0.08, { type: 'sine', gain: 0.15 })
  },
  pop() {
    // короткое «дзынь» — нашёл один из нескольких предметов
    const t = getCtx().currentTime
    note(N.E5, t, 0.12, { type: 'triangle', gain: 0.25 })
    note(N.A5, t + 0.08, 0.15, { type: 'triangle', gain: 0.25 })
  },
  star(i = 0) {
    const t = getCtx().currentTime
    note(N.G5 * (1 + i * 0.12), t, 0.35, { type: 'triangle', gain: 0.3 })
  },
  horn() {
    // победный гудок катера: две ноты, «квакающий» тембр
    const t = getCtx().currentTime
    note(220, t, 0.35, { type: 'sawtooth', gain: 0.12, attack: 0.03, release: 0.08 })
    note(277, t + 0.3, 0.5, { type: 'sawtooth', gain: 0.14, attack: 0.03, release: 0.15 })
    note(440, t + 0.3, 0.5, { type: 'square', gain: 0.03, attack: 0.03, release: 0.15 })
  },
  chime() {
    // волшебный перезвон (сундук / сокровища)
    const t = getCtx().currentTime
    ;[N.E5, N.G5, N.C5 * 2, N.E5 * 2].forEach((f, i) => note(f, t + i * 0.07, 0.5, { type: 'sine', gain: 0.22, attack: 0.01, release: 0.3 }))
  },
  bubble() {
    // лопнувший пузырь: короткий «блуп» с подъёмом
    const c = getCtx()
    const osc = c.createOscillator()
    const g = c.createGain()
    const t = c.currentTime
    osc.type = 'sine'
    osc.frequency.setValueAtTime(300, t)
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.09)
    g.gain.setValueAtTime(0.25, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.14)
    osc.connect(g).connect(masterGain)
    osc.start(t)
    osc.stop(t + 0.15)
  },
  wind() {
    // порыв ветра от вентилятора: шум, нарастает и стихает, фильтр «открывается»
    const c = getCtx()
    const dur = 2.6
    const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const src = c.createBufferSource()
    src.buffer = buf
    const bp = c.createBiquadFilter()
    bp.type = 'bandpass'
    bp.Q.value = 0.8
    const t = c.currentTime
    bp.frequency.setValueAtTime(300, t)
    bp.frequency.exponentialRampToValueAtTime(1400, t + 1.0)
    bp.frequency.exponentialRampToValueAtTime(400, t + dur)
    const g = c.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.22, t + 0.7)
    g.gain.linearRampToValueAtTime(0.18, t + 1.6)
    g.gain.linearRampToValueAtTime(0, t + dur)
    src.connect(bp).connect(g).connect(masterGain)
    src.start(t)
    src.stop(t + dur)
  },
  thunder() {
    // раскат грома: шум через низкочастотный фильтр с длинным затуханием, негромко
    const c = getCtx()
    const dur = 2.2
    const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const src = c.createBufferSource()
    src.buffer = buf
    const lp = c.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(600, c.currentTime)
    lp.frequency.exponentialRampToValueAtTime(120, c.currentTime + dur)
    const g = c.createGain()
    const t = c.currentTime
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.35, t + 0.08)
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.6)
    g.gain.linearRampToValueAtTime(0.25, t + 0.9)
    g.gain.exponentialRampToValueAtTime(0.001, t + dur)
    src.connect(lp).connect(g).connect(masterGain)
    src.start(t)
    src.stop(t + dur)
  },
  fanfare() {
    const t = getCtx().currentTime
    ;[N.C5, N.C5, N.C5, N.E5, N.G5, N.C5 * 2].forEach((f, i) =>
      note(f, t + i * 0.13, i === 5 ? 0.6 : 0.15, { type: 'triangle', gain: 0.3 }),
    )
  },
}

// ---------- озвучка через Web Speech API ----------
const voiceCache = {}

function pickVoice(lang) {
  if (voiceCache[lang]) return voiceCache[lang]
  const voices = window.speechSynthesis?.getVoices?.() ?? []
  const v = voices.find((x) => x.lang.toLowerCase().startsWith(lang)) ?? null
  if (v) voiceCache[lang] = v
  return v
}

// голоса подгружаются асинхронно
window.speechSynthesis?.addEventListener?.('voiceschanged', () => {
  Object.keys(voiceCache).forEach((k) => delete voiceCache[k])
})

/** speak('Арбуз', 'ru') — lang: 'ru' | 'en' */
export function speak(text, lang = 'ru', { rate = 0.85 } = {}) {
  const synth = window.speechSynthesis
  if (!synth) return
  synth.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang === 'en' ? 'en-US' : 'ru-RU'
  u.rate = rate
  u.pitch = 1.1
  const v = pickVoice(lang)
  if (v) u.voice = v
  synth.speak(u)
}

export function stopSpeaking() {
  window.speechSynthesis?.cancel()
}
