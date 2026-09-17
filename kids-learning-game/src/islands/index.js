import { lazy } from 'react'

/**
 * Реестр островов. Порядок = порядок на карте.
 * Компоненты грузятся ленивыми чанками (прелоадер подтягивает их заранее — см. App.jsx / load()).
 * pos — положение на карте в % (x, y), color — цвет острова.
 */
const loaders = {
  letters: () => import('./letters/LettersIsland'),
  numbers: () => import('./numbers/NumbersIsland'),
  coloring: () => import('./coloring/ColoringIsland'),
  colors: () => import('./colors/ColorsIsland'),
  pictures: () => import('./pictures/PicturesIsland'),
}

/**
 * theme — оформление экранов острова: фон (градиент), акцент, тип живого фона (LevelBackdrop):
 *   letters — парящие объёмные буквы; numbers — цифры с глазками и падающие звёзды;
 *   paint — радуга, бабочки, капли краски; puzzle — кусочки пазла, которые сходятся и расходятся
 * glyphs — что летает на фоне; hello — реплика маскота на экране выбора уровня
 */
export const ISLANDS = [
  {
    id: 'letters', title: 'Остров букв', icon: '🔤', pos: { x: 16, y: 48 }, color: '#FFB703',
    theme: { bg: ['#fff3c4', '#ffd166', '#f4a261'], accent: '#e76f51', fx: 'letters', glyphs: ['А', 'Б', 'В', 'A', 'B', 'C', 'Д', 'D', 'Ж', 'E'], hello: 'Давай учить буквы!' },
  },
  {
    id: 'numbers', title: 'Остров цифр', icon: '🔢', pos: { x: 50, y: 45 }, color: '#8AC926',
    theme: { bg: ['#e9ffd6', '#a8e063', '#56ab2f'], accent: '#2d6a4f', fx: 'numbers', glyphs: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], hello: 'Считаем вместе!' },
  },
  {
    id: 'coloring', title: 'Остров раскрасок', icon: '🎨', pos: { x: 84, y: 48 }, color: '#FF7B9C',
    theme: { bg: ['#ffe5ec', '#ffb3c6', '#ff8fab'], accent: '#c9184a', fx: 'paint', glyphs: ['🖌️', '🎨', '🖍️'], hello: 'Раскрасим картинку?' },
  },
  {
    id: 'colors', title: 'Остров цветов', icon: '🌈', pos: { x: 33, y: 68 }, color: '#6A4C93',
    theme: { bg: ['#f3e8ff', '#c8b6ff', '#9b8cff'], accent: '#5a189a', fx: 'paint', glyphs: ['🦋', '🌈', '🎈'], hello: 'Найдём все цвета!' },
  },
  {
    id: 'pictures', title: 'Остров картинок', icon: '🧩', pos: { x: 68, y: 70 }, color: '#1982C4',
    theme: { bg: ['#dff6ff', '#8ecae6', '#219ebc'], accent: '#023e8a', fx: 'puzzle', glyphs: ['🧩', '🐱', '🚗', '🌸'], hello: 'Выбери классную игру!' },
  },
].map((isl) => ({ ...isl, component: lazy(loaders[isl.id]), load: loaders[isl.id] }))
