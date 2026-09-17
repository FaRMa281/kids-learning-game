/** Предметы для счёта — каждый раунд берёт случайный */
export const COUNT_ITEMS = ['🍎', '🐤', '⭐', '🎈', '🐞', '🍓', '🚗', '🦋', '🍪', '🐟']

/**
 * count — показ цифры с предметами, потом «сколько здесь?» (выбор цифры)
 * add   — простые примеры на сложение с картинками
 */
export const LEVELS = [
  { id: 'count-easy', kind: 'count', from: 1, to: 5, options: 3, title: 'Считаем до 5', sub: 'Сколько предметов?', icon: '5', art: '🍎🐤⭐', hint: 'Посчитаем яблоки и цыплят!' },
  { id: 'count-hard', kind: 'count', from: 6, to: 10, options: 4, title: 'Считаем до 10', sub: 'Сколько предметов?', icon: '10', art: '🔟🎈', hint: 'До десяти — ты справишься!', requires: 'count-easy' },
  { id: 'add-easy', kind: 'add', maxSum: 5, options: 3, rounds: 5, title: 'Сложение до 5', sub: 'Сколько вместе?', icon: '2+3', art: '🍪➕🍪', hint: 'Сложим печеньки вместе!' },
  { id: 'add-hard', kind: 'add', maxSum: 10, options: 4, rounds: 6, title: 'Сложение до 10', sub: 'Сколько вместе?', icon: '4+6', art: '🧮✨', hint: 'Большие примеры для больших!', requires: 'add-easy' },
]

export const PHRASES = {
  show: (n) => `Это цифра ${n}. Посчитай предметы!`,
  askCount: 'Сколько здесь предметов?',
  askSum: 'Сколько будет вместе?',
}
