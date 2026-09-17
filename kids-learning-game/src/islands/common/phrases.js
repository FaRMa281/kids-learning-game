/** Общие реплики маскота и подписи кнопок. lang — язык контента уровня ('ru' | 'en'). */
export const UI = {
  ru: {
    good: ['Молодец!', 'Правильно!', 'Здорово!', 'Супер!', 'Ты умница!', 'Отлично!'],
    retry: ['Почти! Попробуй ещё', 'Давай ещё разок', 'Подумай ещё чуть-чуть', 'Не то, но ты близко!'],
    done: 'Ура! Ты справился!',
    next: 'Дальше',
    again: 'Ещё раз',
    map: 'На карту',
    pickLevel: 'Выбери уровень',
  },
  en: {
    good: ['Great job!', 'Correct!', 'Awesome!', 'Super!', 'Well done!', 'Excellent!'],
    retry: ['Almost! Try again', 'One more time', 'Think a little more', 'Not quite, but close!'],
    done: 'Hooray! You did it!',
    next: 'Next',
    again: 'Again',
    map: 'Map',
    pickLevel: 'Pick a level',
  },
}

export const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5)
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
export const range = (n) => Array.from({ length: n }, (_, i) => i)
