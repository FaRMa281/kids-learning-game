/** Картинки с названиями — для «найди пару» и «послушай и найди» */
export const ITEMS = [
  { id: 'cat', pic: '🐱', ru: 'Кошка', en: 'Cat' },
  { id: 'dog', pic: '🐶', ru: 'Собака', en: 'Dog' },
  { id: 'cow', pic: '🐮', ru: 'Корова', en: 'Cow' },
  { id: 'horse', pic: '🐴', ru: 'Лошадь', en: 'Horse' },
  { id: 'pig', pic: '🐷', ru: 'Свинья', en: 'Pig' },
  { id: 'chicken', pic: '🐔', ru: 'Курица', en: 'Chicken' },
  { id: 'frog', pic: '🐸', ru: 'Лягушка', en: 'Frog' },
  { id: 'elephant', pic: '🐘', ru: 'Слон', en: 'Elephant' },
  { id: 'lion', pic: '🦁', ru: 'Лев', en: 'Lion' },
  { id: 'monkey', pic: '🐵', ru: 'Обезьяна', en: 'Monkey' },
  { id: 'fish', pic: '🐟', ru: 'Рыба', en: 'Fish' },
  { id: 'butterfly', pic: '🦋', ru: 'Бабочка', en: 'Butterfly' },
  { id: 'apple', pic: '🍎', ru: 'Яблоко', en: 'Apple' },
  { id: 'banana', pic: '🍌', ru: 'Банан', en: 'Banana' },
  { id: 'car', pic: '🚗', ru: 'Машина', en: 'Car' },
  { id: 'ball', pic: '⚽', ru: 'Мяч', en: 'Ball' },
  { id: 'house', pic: '🏠', ru: 'Дом', en: 'House' },
  { id: 'sun', pic: '☀️', ru: 'Солнце', en: 'Sun' },
  { id: 'flower', pic: '🌸', ru: 'Цветок', en: 'Flower' },
  { id: 'tree', pic: '🌳', ru: 'Дерево', en: 'Tree' },
]

/**
 * pairs  — «найди пару» (память): карточки рубашкой вверх, открываем по две
 * listen — «послушай и найди»: маскот называет предмет, ребёнок выбирает картинку
 */
export const LEVELS = [
  { id: 'pairs-easy', kind: 'pairs', pairs: 3, stars: [1, 4], title: 'Найди пару', sub: '3 пары', icon: '🃏', art: '🐱🐱', hint: 'Переворачивай карточки и ищи одинаковые!' },
  { id: 'pairs-hard', kind: 'pairs', pairs: 6, stars: [3, 8], title: 'Найди пару', sub: '6 пар', icon: '🎴', art: '🎴🧠', hint: 'Шесть пар — тренируем память!', requires: 'pairs-easy' },
  { id: 'listen-easy', kind: 'listen', lang: 'ru', options: 3, rounds: 5, title: 'Кто это?', sub: 'Послушай и найди', icon: '👂', art: '🧸🎁', hint: 'Я назову — ты найди!' },
  { id: 'listen-hard', kind: 'listen', lang: 'ru', options: 6, rounds: 6, title: 'Кто это?', sub: 'Среди шести', icon: '🔍', art: '🦁🔍', hint: 'Среди шести картинок — сложнее!', requires: 'listen-easy' },
]

export const PHRASES = {
  pairs: {
    start: 'Открывай по две карточки и ищи одинаковые!',
    match: ['Пара!', 'Нашёл!', 'Точно!'],
    miss: ['Не пара, запоминай!', 'Почти! Попробуй ещё'],
  },
  listen: {
    ru: { ask: (it) => `Найди: ${it.ru.toLowerCase()}`, say: (it) => `Где ${it.ru.toLowerCase()}?` },
    en: { ask: (it) => `Find: ${it.en.toLowerCase()}`, say: (it) => `Where is the ${it.en.toLowerCase()}?` },
  },
}
