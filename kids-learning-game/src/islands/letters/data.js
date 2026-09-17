/**
 * Буквы для теста — по 5 на язык. Картинки пока emoji (крупные, цветные, без файлов);
 * позже поле `pic` можно заменить на путь к изображению.
 * `say` — что произносит озвучка при показе буквы (название буквы).
 */
export const LETTERS = {
  ru: [
    { letter: 'А', say: 'А', words: [
      { word: 'Арбуз', pic: '🍉' }, { word: 'Ананас', pic: '🍍' }, { word: 'Автобус', pic: '🚌' },
    ]},
    { letter: 'Б', say: 'Бэ', words: [
      { word: 'Банан', pic: '🍌' }, { word: 'Бабочка', pic: '🦋' }, { word: 'Барабан', pic: '🥁' },
    ]},
    { letter: 'В', say: 'Вэ', words: [
      { word: 'Волк', pic: '🐺' }, { word: 'Виноград', pic: '🍇' }, { word: 'Велосипед', pic: '🚲' },
    ]},
    { letter: 'Г', say: 'Гэ', words: [
      { word: 'Гриб', pic: '🍄' }, { word: 'Груша', pic: '🍐' }, { word: 'Гитара', pic: '🎸' },
    ]},
    { letter: 'Д', say: 'Дэ', words: [
      { word: 'Дом', pic: '🏠' }, { word: 'Дерево', pic: '🌳' }, { word: 'Дельфин', pic: '🐬' },
    ]},
  ],
  en: [
    { letter: 'A', say: 'A', words: [
      { word: 'Apple', pic: '🍎' }, { word: 'Ant', pic: '🐜' }, { word: 'Airplane', pic: '✈️' },
    ]},
    { letter: 'B', say: 'B', words: [
      { word: 'Banana', pic: '🍌' }, { word: 'Bear', pic: '🐻' }, { word: 'Ball', pic: '⚽' },
    ]},
    { letter: 'C', say: 'C', words: [
      { word: 'Cat', pic: '🐱' }, { word: 'Car', pic: '🚗' }, { word: 'Cake', pic: '🎂' },
    ]},
    { letter: 'D', say: 'D', words: [
      { word: 'Dog', pic: '🐶' }, { word: 'Duck', pic: '🦆' }, { word: 'Donut', pic: '🍩' },
    ]},
    { letter: 'E', say: 'E', words: [
      { word: 'Elephant', pic: '🐘' }, { word: 'Egg', pic: '🥚' }, { word: 'Eye', pic: '👁️' },
    ]},
  ],
}

/**
 * Уровни острова. id идёт в backend как `level`. icon — текст, не флаг-emoji (Windows их не рисует).
 * easy — «какая картинка на букву Б?» (выбор картинки)
 * hard — «с какой буквы начинается 🍌?» (выбор буквы)
 */
export const LEVELS = [
  { id: 'ru-easy', lang: 'ru', difficulty: 'easy', title: 'Русские буквы', sub: 'Найди картинку', icon: 'Аа', art: '📖🍉', hint: 'Букварь с картинками — самое начало!' },
  { id: 'ru-hard', lang: 'ru', difficulty: 'hard', title: 'Русские буквы', sub: 'Найди букву', icon: 'Аа', art: '🔍🅰️', hint: 'Найди букву по картинке. Посложнее!', requires: 'ru-easy' },
  { id: 'en-easy', lang: 'en', difficulty: 'easy', title: 'English letters', sub: 'Find the picture', icon: 'Ab', art: '📚🍎', hint: "Let's learn English letters!" },
  { id: 'en-hard', lang: 'en', difficulty: 'hard', title: 'English letters', sub: 'Find the letter', icon: 'Ab', art: '🔎🅱️', hint: 'Find the letter — a bit harder!', requires: 'en-easy' },
]

// Реплики маскота, специфичные для острова (общие — в common/phrases.js)
export const PHRASES = {
  ru: {
    show: (l) => `Это буква ${l}. Нажми на картинки!`,
    askPic: (l) => `Какая картинка на букву ${l}?`,
    askLetter: (w) => `С какой буквы начинается «${w}»?`,
  },
  en: {
    show: (l) => `This is the letter ${l}. Tap the pictures!`,
    askPic: (l) => `Which picture starts with ${l}?`,
    askLetter: (w) => `Which letter does "${w}" start with?`,
  },
}
