/** Цвета: название на двух языках, hex для плашек, предметы этого цвета (emoji) */
export const COLORS = [
  { id: 'red', ru: 'Красный', en: 'Red', hex: '#FF3B30', items: ['🍎', '🍓', '🍒', '🚒', '❤️', '🌹'] },
  { id: 'yellow', ru: 'Жёлтый', en: 'Yellow', hex: '#FFD60A', items: ['🍌', '🍋', '⭐', '🐥', '🌻', '🧀'] },
  { id: 'green', ru: 'Зелёный', en: 'Green', hex: '#34C759', items: ['🥒', '🐸', '🍀', '🥦', '🌳', '🐢'] },
  { id: 'blue', ru: 'Синий', en: 'Blue', hex: '#1E6FFF', items: ['🫐', '🐳', '💙', '🧢', '🐟', '🌊'] },
  { id: 'orange', ru: 'Оранжевый', en: 'Orange', hex: '#FF8C1A', items: ['🍊', '🥕', '🎃', '🦊', '🏀', '🍑'] },
  { id: 'purple', ru: 'Фиолетовый', en: 'Purple', hex: '#9B4DFF', items: ['🍇', '🍆', '💜', '🔮', '☂️', '🦄'] },
]

/**
 * learn — показ цвета с названием, потом «где красный?» (выбор плашки)
 * find  — «найди все красные предметы» среди других
 */
export const LEVELS = [
  { id: 'ru-learn', lang: 'ru', kind: 'learn', title: 'Учим цвета', sub: 'Найди цвет', icon: '🟥', art: '🌈🎨', hint: 'Красный, жёлтый, синий — запомним все!' },
  { id: 'ru-find', lang: 'ru', kind: 'find', title: 'Ищем предметы', sub: 'Найди все красные', icon: '🍎', art: '🍎🍓🚒', hint: 'Найди всё красное вокруг!', requires: 'ru-learn' },
  { id: 'en-learn', lang: 'en', kind: 'learn', title: 'Learn colors', sub: 'Find the color', icon: '🟦', art: '🟦🟨🟥', hint: "Let's learn the colors!" },
  { id: 'en-find', lang: 'en', kind: 'find', title: 'Find objects', sub: 'Find all blue', icon: '🐳', art: '🐳🫐🧢', hint: 'Find everything blue!', requires: 'en-learn' },
]

export const PHRASES = {
  ru: {
    show: (c) => `Это ${c.ru.toLowerCase()} цвет. Нажми на предметы!`,
    askColor: (c) => `Где ${c.ru.toLowerCase()} цвет?`,
    askFind: (c) => `Найди все ${plural(c)} предметы`,
    more: (n) => (n === 1 ? 'Остался ещё один!' : `Ещё ${n}!`),
  },
  en: {
    show: (c) => `This is ${c.en.toLowerCase()}. Tap the objects!`,
    askColor: (c) => `Where is ${c.en.toLowerCase()}?`,
    askFind: (c) => `Find all ${c.en.toLowerCase()} objects`,
    more: (n) => (n === 1 ? 'One more!' : `${n} more!`),
  },
}

// «красные», «жёлтые», «фиолетовые» — множественное число прилагательного
function plural(c) {
  const w = c.ru.toLowerCase()
  if (w.endsWith('ий')) return w.slice(0, -2) + 'ие' // синий → синие
  return w.slice(0, -2) + 'ые' // красный → красные
}
