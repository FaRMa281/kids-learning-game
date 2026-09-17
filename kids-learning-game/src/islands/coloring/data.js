/**
 * Раскраски. Каждая картинка — набор зон (SVG-фигур) в viewBox 0 0 400 300.
 * key — цвет из PALETTE; label — где рисовать номер/букву. decor — нераскрашиваемые детали.
 * Порядок зон = порядок отрисовки (нижние первыми).
 */
export const PALETTE = {
  red: { hex: '#FF3B30', ru: 'красный' },
  yellow: { hex: '#FFD60A', ru: 'жёлтый' },
  green: { hex: '#34C759', ru: 'зелёный' },
  blue: { hex: '#5AC8FA', ru: 'голубой' },
  orange: { hex: '#FF8C1A', ru: 'оранжевый' },
  purple: { hex: '#B36BFF', ru: 'фиолетовый' },
}

const rect = (x, y, w, h) => ({ tag: 'rect', x, y, width: w, height: h, rx: 6 })
const circle = (cx, cy, r) => ({ tag: 'circle', cx, cy, r })
const ellipse = (cx, cy, rx, ry) => ({ tag: 'ellipse', cx, cy, rx, ry })
const poly = (points) => ({ tag: 'polygon', points })

export const PICTURES = [
  {
    id: 'house',
    title: 'Домик',
    keys: ['red', 'yellow', 'green', 'blue'],
    zones: [
      { id: 'sky', key: 'blue', shape: rect(0, 0, 400, 215), label: [60, 45] },
      { id: 'grass', key: 'green', shape: rect(0, 210, 400, 90), label: [60, 258] },
      { id: 'sun', key: 'yellow', shape: circle(340, 55, 34), label: [340, 55] },
      { id: 'wall', key: 'yellow', shape: rect(110, 130, 180, 110), label: [255, 200] },
      { id: 'roof', key: 'red', shape: poly('88,135 200,45 312,135'), label: [200, 108] },
      { id: 'door', key: 'red', shape: rect(172, 170, 52, 70), label: [198, 208] },
      { id: 'window', key: 'blue', shape: rect(128, 150, 44, 44), label: [150, 172] },
    ],
  },
  {
    id: 'fish',
    title: 'Рыбка',
    keys: ['red', 'yellow', 'green', 'blue'],
    zones: [
      { id: 'water', key: 'blue', shape: rect(0, 0, 400, 300), label: [50, 45] },
      { id: 'sand', key: 'yellow', shape: rect(0, 245, 400, 55), label: [200, 273] },
      { id: 'weed1', key: 'green', shape: poly('35,250 55,160 75,250'), label: [55, 222] },
      { id: 'weed2', key: 'green', shape: poly('330,250 350,175 370,250'), label: [350, 225] },
      { id: 'tail', key: 'red', shape: poly('262,150 340,95 340,205'), label: [312, 150] },
      { id: 'body', key: 'red', shape: ellipse(185, 150, 95, 60), label: [165, 150] },
      { id: 'fin', key: 'yellow', shape: poly('150,100 200,70 230,105'), label: [193, 92] },
      { id: 'bubble1', key: 'yellow', shape: circle(320, 50, 22), label: [320, 50] },
    ],
    decor: [
      { tag: 'circle', cx: 240, cy: 140, r: 10, fill: '#fff' },
      { tag: 'circle', cx: 244, cy: 140, r: 5, fill: '#2b2d42' },
    ],
  },
  {
    id: 'flower',
    title: 'Цветок',
    keys: ['red', 'yellow', 'green', 'blue', 'orange', 'purple'],
    zones: [
      { id: 'sky', key: 'blue', shape: rect(0, 0, 400, 235), label: [60, 45] },
      { id: 'grass', key: 'green', shape: rect(0, 230, 400, 70), label: [60, 268] },
      { id: 'sun', key: 'yellow', shape: circle(340, 55, 34), label: [340, 55] },
      { id: 'stem', key: 'green', shape: rect(190, 150, 20, 90), label: [200, 200] },
      { id: 'leaf1', key: 'green', shape: ellipse(150, 205, 38, 15), label: [150, 205] },
      { id: 'leaf2', key: 'green', shape: ellipse(250, 185, 38, 15), label: [250, 185] },
      { id: 'p1', key: 'red', shape: circle(246, 105, 27), label: [246, 105] },
      { id: 'p2', key: 'red', shape: circle(223, 145, 27), label: [223, 145] },
      { id: 'p3', key: 'red', shape: circle(177, 145, 27), label: [177, 145] },
      { id: 'p4', key: 'red', shape: circle(154, 105, 27), label: [154, 105] },
      { id: 'p5', key: 'red', shape: circle(177, 65, 27), label: [177, 65] },
      { id: 'p6', key: 'red', shape: circle(223, 65, 27), label: [223, 65] },
      { id: 'center', key: 'orange', shape: circle(200, 105, 25), label: [200, 105] },
      { id: 'bfly1', key: 'purple', shape: ellipse(60, 140, 24, 16), label: [60, 140] },
      { id: 'bfly2', key: 'purple', shape: ellipse(60, 175, 24, 16), label: [60, 175] },
    ],
  },
  {
    id: 'butterfly',
    title: 'Бабочка',
    keys: ['red', 'yellow', 'green', 'blue', 'orange', 'purple'],
    zones: [
      { id: 'sky', key: 'blue', shape: rect(0, 0, 400, 245), label: [50, 45] },
      { id: 'grass', key: 'green', shape: rect(0, 240, 400, 60), label: [60, 272] },
      { id: 'sun', key: 'yellow', shape: circle(345, 50, 30), label: [345, 50] },
      { id: 'wingUL', key: 'purple', shape: ellipse(148, 115, 58, 48), label: [130, 100] },
      { id: 'wingUR', key: 'purple', shape: ellipse(252, 115, 58, 48), label: [270, 100] },
      { id: 'wingLL', key: 'red', shape: ellipse(152, 200, 42, 36), label: [140, 205] },
      { id: 'wingLR', key: 'red', shape: ellipse(248, 200, 42, 36), label: [260, 205] },
      { id: 'spotL', key: 'yellow', shape: circle(158, 122, 15), label: [158, 122] },
      { id: 'spotR', key: 'yellow', shape: circle(242, 122, 15), label: [242, 122] },
      { id: 'body', key: 'orange', shape: ellipse(200, 155, 15, 72), label: [200, 160] },
    ],
    decor: [
      { tag: 'line', x1: 195, y1: 90, x2: 175, y2: 55, stroke: '#2b2d42', 'stroke-width': 4 },
      { tag: 'line', x1: 205, y1: 90, x2: 225, y2: 55, stroke: '#2b2d42', 'stroke-width': 4 },
      { tag: 'circle', cx: 175, cy: 55, r: 6, fill: '#2b2d42' },
      { tag: 'circle', cx: 225, cy: 55, r: 6, fill: '#2b2d42' },
    ],
  },
]

/** easy — по номерам (4 цвета), hard — по буквам (6 цветов) */
export const LEVELS = [
  { id: 'numbers', labels: '1234', pictures: ['house', 'fish'], stars: [0, 3], title: 'По номерам', sub: 'Домик и рыбка', icon: '🔢', art: '🏠🐟', hint: 'Раскрась домик и рыбку по номерам!' },
  { id: 'letters', labels: 'АБВГДЕ', pictures: ['flower', 'butterfly'], stars: [1, 5], title: 'По буквам', sub: 'Цветок и бабочка', icon: '🔤', art: '🌸🦋', hint: 'Цветок и бабочка — по буквам!', requires: 'numbers' },
]

export const PHRASES = {
  start: (t) => `Раскрасим: ${t.toLowerCase()}! Выбери цвет внизу и нажми на нужную часть`,
  pickFirst: 'Сначала выбери цвет внизу!',
  picked: (label, key) => `${label} — ${PALETTE[key].ru}. Где такая цифра или буква?`,
  wrong: ['Тут другой цвет, посмотри на подпись', 'Не сюда, ищи такую же метку'],
  more: (n) => (n === 1 ? 'Осталась одна часть!' : `Ещё ${n}!`),
}
