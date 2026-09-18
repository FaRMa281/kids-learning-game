/**
 * Остров букв: 18 режимов на трёх экранах (по 6 карточек), три сцены 3-го экрана.
 *
 * Каждый режим описан конфигом + генератором раундов. Раунд — единая модель, которую
 * умеет играть любая сцена (play/LettersPlay.jsx):
 *   {
 *     mech: 'pick' | 'collect' | 'sequence' | 'catch',
 *       pick     — один верный токен → в слот
 *       collect  — собрать все верные (порядок не важен)
 *       sequence — собрать верные в заданном порядке (слово, алфавитная дорожка)
 *       catch    — токены всплывают/плывут сами, лопаем верные, пока не наберём N
 *     prompt:  { text, big?, pic?, say?, lang?, slots? }  — что показать/озвучить
 *     tokens:  [{ id, text, pic?, ok, order?, say?, kind?: 'letter'|'digit'|'piece'|'syllable' , piece?: {n,i} }]
 *     hint:    реплика маскота при ошибке
 *   }
 */
import { pick, range, shuffle } from '../common/phrases'

// ---------------------------------------------------------------- данные
export const RU = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'.split('')
export const RU_VOWELS = 'АЕЁИОУЫЭЮЯ'.split('')
export const RU_CONSONANTS = 'БВГДЖЗЙКЛМНПРСТФХЦЧШЩ'.split('')
export const EN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

/** названия букв для озвучки (TTS читает одиночную букву не всегда правильно) */
const RU_NAMES = { Б: 'бэ', В: 'вэ', Г: 'гэ', Д: 'дэ', Ж: 'жэ', З: 'зэ', Й: 'и краткое', К: 'ка', Л: 'эль', М: 'эм', Н: 'эн', П: 'пэ', Р: 'эр', С: 'эс', Т: 'тэ', Ф: 'эф', Х: 'ха', Ц: 'цэ', Ч: 'че', Ш: 'ша', Щ: 'ща', Ъ: 'твёрдый знак', Ы: 'ы', Ь: 'мягкий знак' }
export const sayLetter = (l, lang = 'ru') => (lang === 'en' ? l : (RU_NAMES[l] ?? l))

/** слова с картинками: первая буква, последняя буква, пропущенная буква, сборка слова */
export const WORDS = [
  { w: 'КОТ', pic: '🐱' }, { w: 'ДОМ', pic: '🏠' }, { w: 'СОК', pic: '🧃' }, { w: 'ЛУК', pic: '🧅' },
  { w: 'МАК', pic: '🌺' }, { w: 'СЫР', pic: '🧀' }, { w: 'РАК', pic: '🦀' }, { w: 'ЛЕВ', pic: '🦁' },
  { w: 'НОС', pic: '👃' }, { w: 'ЖУК', pic: '🐞' }, { w: 'ШАР', pic: '🎈' }, { w: 'КИТ', pic: '🐳' },
  { w: 'МЯЧ', pic: '⚽' }, { w: 'ЁЖ', pic: '🦔' }, { w: 'БЫК', pic: '🐂' }, { w: 'ЗУБ', pic: '🦷' },
  { w: 'РОТ', pic: '👄' }, { w: 'ГУСЬ', pic: '🪿' }, { w: 'ЛИСА', pic: '🦊' }, { w: 'РЫБА', pic: '🐟' },
  { w: 'УТКА', pic: '🦆' }, { w: 'СЛОН', pic: '🐘' }, { w: 'ТИГР', pic: '🐯' }, { w: 'ЯБЛОКО', pic: '🍎' },
  { w: 'АРБУЗ', pic: '🍉' }, { w: 'ЗЕБРА', pic: '🦓' }, { w: 'ПИНГВИН', pic: '🐧' }, { w: 'ОБЛАКО', pic: '☁️' },
  { w: 'ЦВЕТОК', pic: '🌸' }, { w: 'ЧАСЫ', pic: '⌚' }, { w: 'ФЛАГ', pic: '🚩' }, { w: 'ХЛЕБ', pic: '🍞' },
  { w: 'НОСОК', pic: '🧦' }, { w: 'ИГЛА', pic: '🪡' }, { w: 'ЮЛА', pic: '🪀' }, { w: 'ЭКРАН', pic: '🖥️' },
]
const WORDS3 = WORDS.filter((x) => x.w.length === 3)

export const SYLLABLES = { consonants: 'МПБНДТК'.split(''), vowels: 'АОУИ'.split('') }

// ---------------------------------------------------------------- сцены 3-го экрана
export const SCENES = {
  pier: { id: 'pier', title: 'Причал Открытий', slot: 'boat', water: true },
  chest: { id: 'chest', title: 'Сундук Сокровищ', slot: 'basket', water: false },
  sunken: { id: 'sunken', title: 'Затонувший Город', slot: 'chest', water: false },
}

// ---------------------------------------------------------------- генераторы
const letterTokens = (correct, pool, n, lang = 'ru') => {
  const wrong = shuffle(pool.filter((l) => !correct.includes(l))).slice(0, n - correct.length)
  return shuffle([...correct.map((l) => ({ id: l, text: l, ok: true, say: sayLetter(l, lang) })), ...wrong.map((l) => ({ id: l, text: l, ok: false, say: sayLetter(l, lang) }))])
}

const G = {
  /** 1. алфавит по порядку: «А Б В … ?» — какая следующая */
  alphabet: () =>
    range(5).map(() => {
      const start = Math.floor(Math.random() * (RU.length - 4))
      const seq = RU.slice(start, start + 3)
      const next = RU[start + 3]
      return {
        mech: 'pick',
        prompt: { text: `${seq.join(' ')} … ?`, say: `${seq.map((l) => sayLetter(l)).join(', ')}. Какая буква дальше?`, big: `${seq.join(' ')} _` },
        tokens: letterTokens([next], RU, 4),
        hint: `После ${sayLetter(seq[2])} идёт…`,
      }
    }),
  /** 2. гласные — собери все гласные среди букв */
  vowels: () =>
    range(5).map(() => {
      const v = shuffle(RU_VOWELS).slice(0, 2)
      return { mech: 'collect', prompt: { text: 'Собери все гласные', say: 'Найди все гласные буквы — те, что поются: а-а-а, о-о-о', badge: 'red' }, tokens: letterTokens(v, RU_CONSONANTS, 5).map((t) => ({ ...t, ring: t.ok ? 'red' : 'blue' })), hint: 'Гласные можно спеть: а, о, у, и…' }
    }),
  /** 3. согласные */
  consonants: () =>
    range(5).map(() => {
      const c = shuffle(RU_CONSONANTS).slice(0, 2)
      return { mech: 'collect', prompt: { text: 'Собери все согласные', say: 'Найди все согласные буквы', badge: 'blue' }, tokens: letterTokens(c, RU_VOWELS, 5).map((t) => ({ ...t, ring: t.ok ? 'blue' : 'red' })), hint: 'Согласные не поются: б, к, м…' }
    }),
  /** 4. заглавные: найди такую же */
  upper: () =>
    range(5).map(() => {
      const l = pick(RU)
      return { mech: 'pick', prompt: { text: 'Найди такую же букву', big: l, say: `Найди букву ${sayLetter(l)}` }, tokens: letterTokens([l], RU, 4), hint: `Ищи точно такую же, как наверху: ${sayLetter(l)}` }
    }),
  /** 5. заглавная → строчная */
  lower: () =>
    range(5).map(() => {
      const l = pick(RU.filter((x) => !'ЪЬЫ'.includes(x)))
      const tokens = letterTokens([l], RU, 4).map((t) => ({ ...t, text: t.text.toLowerCase(), id: t.id.toLowerCase() }))
      return { mech: 'pick', prompt: { text: 'Найди маленькую букву', big: l, say: `Большая ${sayLetter(l)}. Найди маленькую ${sayLetter(l)}` }, tokens, hint: 'Маленькая буква похожа на большую, только меньше' }
    }),
  /** 6. звуковой микс: слушай и найди */
  sound: () =>
    range(5).map(() => {
      const l = pick(RU)
      return { mech: 'pick', prompt: { text: 'Послушай и найди', audio: true, say: `Найди букву ${sayLetter(l)}`, replay: sayLetter(l) }, tokens: letterTokens([l], RU, 5), hint: 'Нажми на динамик, чтобы послушать ещё раз' }
    }),
  /** 7. первая буква в слове */
  first: () =>
    shuffle(WORDS).slice(0, 5).map(({ w, pic }) => ({
      mech: 'pick',
      prompt: { text: `${w[0]}${w.slice(1).toLowerCase()}`, pic, say: `${w[0]}${w.slice(1).toLowerCase()}. С какой буквы начинается?` },
      tokens: letterTokens([w[0]], RU, 4),
      hint: `${w[0]}${w.slice(1).toLowerCase()} — слушай первый звук: ${w[0].toLowerCase()}-${w[0].toLowerCase()}-${w[0].toLowerCase()}`,
    })),
  /** 8. последняя буква в слове */
  last: () =>
    shuffle(WORDS.filter((x) => !'ЬЯ'.includes(x.w.at(-1)))).slice(0, 5).map(({ w, pic }) => ({
      mech: 'pick',
      prompt: { text: `${w[0]}${w.slice(1).toLowerCase()}`, pic, say: `${w[0]}${w.slice(1).toLowerCase()}. Какая буква в конце?` },
      tokens: letterTokens([w.at(-1)], RU, 4),
      hint: 'Слушай самый последний звук в слове',
    })),
  /** 9. буквенный пазл: собери букву из частей */
  puzzle: () =>
    range(4).map(() => {
      const l = pick('АБВДЕЖКМНПТШ'.split(''))
      const n = 3
      const pieces = range(n).map((i) => ({ id: `p${i}`, text: l, kind: 'piece', piece: { n, i }, ok: true, order: i }))
      const wrongL = pick(RU.filter((x) => x !== l))
      const distractor = { id: 'x', text: wrongL, kind: 'piece', piece: { n, i: 1 }, ok: false }
      return { mech: 'collect', prompt: { text: 'Собери букву из кусочков', big: l, ghost: true, say: `Собери букву ${sayLetter(l)} из кусочков` }, tokens: shuffle([...pieces, distractor]), hint: 'Кусочки от другой буквы не подходят' }
    }),
  /** 10. найди лишнее: цифра среди букв */
  odd: () =>
    range(5).map(() => {
      const d = String(Math.floor(Math.random() * 9) + 1)
      const letters = shuffle(RU).slice(0, 4)
      return {
        mech: 'pick',
        prompt: { text: 'Что здесь лишнее?', say: 'Найди то, что не буква' },
        tokens: shuffle([...letters.map((l) => ({ id: l, text: l, ok: false, say: sayLetter(l) })), { id: 'd' + d, text: d, ok: true, kind: 'digit', say: d }]),
        hint: 'Одно из них — цифра, а не буква',
      }
    }),
  /** 11. потерянная буква: _ОТ → К */
  missing: () =>
    shuffle(WORDS3).slice(0, 5).map(({ w, pic }) => {
      const i = Math.floor(Math.random() * 3)
      const shown = w.split('').map((c, j) => (j === i ? '_' : c)).join(' ')
      return { mech: 'pick', prompt: { text: shown, pic, say: `${w[0]}${w.slice(1).toLowerCase()}. Какой буквы не хватает?` }, tokens: letterTokens([w[i]], RU, 4), hint: `${w[0]}${w.slice(1).toLowerCase()} — какой буквы не хватает?` }
    }),
  /** 12. English alphabet */
  english: () =>
    range(5).map(() => {
      const l = pick(EN)
      return { mech: 'pick', prompt: { text: 'Find the letter', audio: true, lang: 'en', say: `Find the letter ${l}`, replay: l, big: Math.random() < 0.5 ? l : undefined }, tokens: letterTokens([l], EN, 4, 'en'), hint: `The letter ${l}`, lang: 'en' }
    }),
  /** 13. простые слоги: М + А = ? */
  syllables: () =>
    range(5).map(() => {
      const c = pick(SYLLABLES.consonants)
      const v = pick(SYLLABLES.vowels)
      const target = c + v
      const wrong = shuffle(SYLLABLES.consonants.flatMap((cc) => SYLLABLES.vowels.map((vv) => cc + vv)).filter((s) => s !== target)).slice(0, 3)
      return {
        mech: 'pick',
        prompt: { text: `${c} + ${v} = ?`, say: `${sayLetter(c)} и ${v}. Какой слог получится?`, big: `${c}+${v}` },
        tokens: shuffle([{ id: target, text: target, ok: true, kind: 'syllable', say: target }, ...wrong.map((s) => ({ id: s, text: s, ok: false, kind: 'syllable', say: s }))]),
        hint: `${c.toLowerCase()}-${v.toLowerCase()}… ${target}!`,
      }
    }),
  /** 14. собери слово из 3 букв — по порядку */
  word: () =>
    shuffle(WORDS3).slice(0, 5).map(({ w, pic }) => {
      const letters = w.split('')
      const wrong = shuffle(RU.filter((l) => !letters.includes(l))).slice(0, 2)
      return {
        mech: 'sequence',
        prompt: { text: `${w[0]}${w.slice(1).toLowerCase()}`, pic, slots: letters.length, say: `Собери слово ${w[0]}${w.slice(1).toLowerCase()}` },
        tokens: shuffle([...letters.map((l, i) => ({ id: `${l}${i}`, text: l, ok: true, order: i, say: sayLetter(l) })), ...wrong.map((l) => ({ id: `w${l}`, text: l, ok: false, say: sayLetter(l) }))]),
        hint: `${w[0]}${w.slice(1).toLowerCase()}: первая буква — ${sayLetter(w[0])}`,
      }
    }),
  /** 15. подводный поиск: найди букву среди многих */
  search: () =>
    range(5).map(() => {
      const l = pick(RU)
      return { mech: 'pick', prompt: { text: 'Найди букву на дне', big: l, say: `Найди на дне букву ${sayLetter(l)}` }, tokens: letterTokens([l], RU, 8), hint: `Ищи ${sayLetter(l)} среди ракушек` }
    }),
  /** 16. ловец букв: лопай пузыри с нужной буквой */
  catch: () =>
    range(4).map(() => {
      const l = pick(RU)
      const others = shuffle(RU.filter((x) => x !== l)).slice(0, 5)
      const tokens = shuffle([...range(4).map((i) => ({ id: `t${i}`, text: l, ok: true, say: sayLetter(l) })), ...others.map((o, i) => ({ id: `o${i}`, text: o, ok: false, say: sayLetter(o) }))])
      return { mech: 'catch', need: 4, prompt: { text: 'Лопай пузыри с буквой', big: l, say: `Лопай пузыри с буквой ${sayLetter(l)}` }, tokens, hint: `Только ${sayLetter(l)}, остальные пусть плывут` }
    }),
  /** 17. лабиринт для катера: пройди буквы по алфавиту */
  maze: () =>
    range(4).map(() => {
      const start = Math.floor(Math.random() * (RU.length - 5))
      const path = RU.slice(start, start + 4)
      const wrong = shuffle(RU.filter((l) => !path.includes(l))).slice(0, 3)
      return {
        mech: 'sequence',
        prompt: { text: 'Проведи катер по алфавиту', big: `${path[0]} → ${path.at(-1)}`, slots: path.length, say: `Проведи катер от ${sayLetter(path[0])} до ${sayLetter(path.at(-1))} по алфавиту` },
        tokens: shuffle([...path.map((l, i) => ({ id: l, text: l, ok: true, order: i, say: sayLetter(l) })), ...wrong.map((l) => ({ id: l, text: l, ok: false, say: sayLetter(l) }))]),
        hint: `Сначала ${sayLetter(path[0])}, потом следующая по алфавиту`,
        path: true,
      }
    }),
}
/** 18. супер-экзамен: по одному раунду из шести разных режимов */
G.exam = () => shuffle(['alphabet', 'vowels', 'first', 'missing', 'syllables', 'word', 'search', 'catch', 'sound']).slice(0, 6).map((m) => pick(G[m]()))

// ---------------------------------------------------------------- 18 режимов: 3 экрана × 6
export const PAGES = [
  {
    id: 'pier', scene: 'pier', title: 'Причал Открытий', sub: 'Базовый уровень',
    levels: [
      { id: 'alphabet', title: 'Алфавит по порядку', sub: 'А, Б, В… какая дальше?', art: '🔤➡️', hint: 'Буквы плывут по порядку — угадай следующую!' },
      { id: 'vowels', title: 'Гласные буквы', sub: 'Красные круги', art: '🔴🅰️', hint: 'Гласные можно спеть: а-а-а!' },
      { id: 'consonants', title: 'Согласные буквы', sub: 'Синие круги', art: '🔵🅱️', hint: 'Согласные — коротко: б, к, м' },
      { id: 'upper', title: 'Заглавные буквы', sub: 'А = А', art: '🅰️🟰🅰️', hint: 'Найди такую же большую букву' },
      { id: 'lower', title: 'Заглавные и строчные', sub: 'А → а', art: '🅰️➡️ａ', hint: 'Большая и маленькая — одна буква!' },
      { id: 'sound', title: 'Звуковой микс', sub: 'Аудио-поиск', art: '🔊👂', hint: 'Слушай и ищи букву на слух' },
    ],
  },
  {
    id: 'chest', scene: 'chest', title: 'Сундук Сокровищ', sub: 'Средний уровень',
    levels: [
      { id: 'first', title: 'Первая буква', sub: '«А» для Арбуз', art: '🍉🅰️', hint: 'С какой буквы начинается слово?', requires: 'alphabet' },
      { id: 'last', title: 'Последняя буква', sub: '«Т» для Кот', art: '🐱🇹', hint: 'Какая буква в конце слова?', requires: 'alphabet' },
      { id: 'puzzle', title: 'Буквенный пазл', sub: 'Собери букву', art: '🧩🅰️', hint: 'Собери букву из кусочков!', requires: 'upper' },
      { id: 'odd', title: 'Найди лишнее', sub: 'Цифра среди букв', art: '🅰️🅱️7️⃣', hint: 'Что здесь не буква?', requires: 'upper' },
      { id: 'missing', title: 'Потерянная буква', sub: '_ОТ → К', art: '❓🐱', hint: 'Какая буква потерялась?', requires: 'first' },
      { id: 'english', title: 'English Alphabet', sub: 'A–Z basic', art: '🇬🇧🅰️', hint: "Let's find English letters!", lang: 'en', requires: 'sound' },
    ],
  },
  {
    id: 'sunken', scene: 'sunken', title: 'Затонувший Город', sub: 'Продвинутый уровень',
    levels: [
      { id: 'syllables', title: 'Простые слоги', sub: 'МА, ПА, БА', art: '🅼🅰️', hint: 'Соединим две буквы в слог!', requires: 'vowels' },
      { id: 'word', title: 'Собери слово', sub: 'Д-О-М', art: '🏠🔤', hint: 'Собери слово по буквам!', requires: 'missing' },
      { id: 'search', title: 'Подводный поиск', sub: 'Буквы на дне', art: '🐠🔍', hint: 'Ищи букву среди ракушек', requires: 'upper' },
      { id: 'catch', title: 'Ловец букв', sub: 'Лопай пузыри', art: '🫧🅰️', hint: 'Лопай только нужные пузыри!', requires: 'sound' },
      { id: 'maze', title: 'Лабиринт для катера', sub: 'По алфавиту', art: '🚤🧭', hint: 'Проведи катер по буквам!', requires: 'alphabet' },
      { id: 'exam', title: 'Супер-Экзамен', sub: 'Всё вместе', art: '🏆⭐', hint: 'Всё, чему ты научился!', requires: 'word' },
    ],
  },
]

// каждому уровню — его сцена и номер экрана (карточки страниц и плоский список — одни объекты)
PAGES.forEach((p, pi) =>
  p.levels.forEach((l) => {
    l.page = pi
    l.scene = p.scene
    l.icon = l.art
  }),
)

/** плоский список уровней (для IslandShell/прогресса) */
export const LEVELS = PAGES.flatMap((p) => p.levels)

export function makeRounds(levelId) {
  const gen = G[levelId]
  if (!gen) throw new Error(`unknown letters mode: ${levelId}`)
  return gen()
}
