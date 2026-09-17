# Острова знаний — детская обучающая игра

React 19 + Vite 8 + motion. Backend: `../games-backend` (`/kids-learning/*`).

## Запуск
```
cd G:\Server\games\games-backend  && run.bat      # :8001
cd G:\Server\games\kids-learning-game && run.bat  # :3001
```
Открыть http://localhost:3001

## Структура
```
src/
  App.jsx                 переключение карта ↔ остров, загрузка сводки прогресса
  api.js                  saveProgress / getSummary
  main.jsx                точка входа; ?noanim (только dev) отключает анимации для автотестов
  styles.css              вся стилизация (крупные элементы, --tap = мин. зона клика)
  audio/
    engine.js             Web Audio: музыка (синтез, своя шина), эффекты, TTS через Web Speech API
    SoundContext.jsx      «звук вкл/выкл» (localStorage), глушение при скрытой вкладке, play()/say()
  components/             Mascot (Луми), SoundButton, BackButton, BigButton, Confetti, Stars
  screens/
    MapScreen.jsx         карта-архипелаг: DOM-острова поверх canvas-сцены, качаются по волне сцены
    map/water.js          ВОДА: WebGL-фрагментный шейдер (simplex noise): псевдо-3D перспектива,
                          градиент глубины, освещение, солнечная дорожка, каустика, дисплейсмент,
                          пена на гребнях, прибой вокруг островов (u_islands), круги от нажатия
                          (u_ripples), шторм по u_storm. Буфер 0.75×DPR.
    map/noise.js          тот же simplex noise в JS + waterHeight() — кораблики качаются по реальной
                          поверхности из шейдера (pitch по носу/корме, roll по борту)
    map/sky.js            небо (градиент + дымка горизонта + свечение вокруг солнца), солнце
                          (объёмный диск, god rays, lens flare, отражение), облака (пухлые с тенью и
                          светом, 3 слоя параллакса CLOUD_LAYERS), вспышки внутри грозовой тучи
    map/boats.js          яхта (локатор), катер, буксир (дым, кранцы), парусник, рыбацкая лодка;
                          флажки, V-кильватер, бурун от мотора
    map/rain.js           дождь — частицы: капли под углом, кольца и брызги при ударе о воду
    map/scene.js          оркестратор: погода, облака, молнии, кораблики; без WebGL — запасные волны
  components/IslandArt.jsx  остров 2.5D (SVG): тень на воде, отмель, пляж, скалы, купол в цвете
                          острова, трава и пальмы (CSS-качание, в шторм сильнее)
  islands/
    index.js              РЕЕСТР островов — позиция на карте, цвет, компонент
    common/
      IslandShell.jsx     уровни → урок → результат; LessonFrame (топбар+маскот+конфетти); OptionButton
      useLesson.js        механика раунда: answer/correct/wrong, маскот, конфетти, звёзды
      useRoundState.js    состояние, сбрасывающееся при смене раунда
      phrases.js          общие реплики (ru/en), shuffle/pick/range
    letters/              буквы RU/EN × «найди картинку» / «найди букву»
    numbers/              счёт до 5 / до 10, сложение до 5 / до 10
    colors/               учим цвета (плашки) / найди все предметы цвета, RU/EN
    pictures/             найди пару (3 / 6 пар), послушай и найди (3 / 6 вариантов)
    coloring/             раскраска по номерам (домик, рыбка) / по буквам (цветок, бабочка)
```

## Мобильные устройства и деплой
- `src/device.js` — детект тача/телефона, `useViewport()` (visualViewport, поворот), Fullscreen API +
  `orientation.lock`, `installTouchGuards()` (контекстное меню, pinch, двойной тап).
- Портрет на телефоне → `components/RotateOverlay.jsx` «Поверни телефон»; ландшафт < 480px высоты —
  компактная раскладка (медиа-запрос в конце styles.css); тач (`pointer: coarse`) — зоны нажатия 96px.
- `components/Preloader.jsx` — прогресс загрузки шрифта и ленивых чанков островов (`islands/index.js`).
- `screens/map/quality.js` — адаптивное качество по FPS (буфер воды, лимит дождя, лучи/блики/тени
  облаков); в админке можно зафиксировать уровень. Тап по кораблику — он подпрыгивает.
- PWA: `vite.config.js` (vite-plugin-pwa: manifest + Workbox precache), иконки `public/icons/`.
- Деплой: `../DEPLOY.md` (Docker+nginx, Vercel/Netlify, GitHub Pages), `npm run dev:lan` для телефона.

## Админ-панель
`Ctrl+Shift+A` или `http://localhost:3001/?admin` (запоминается в localStorage, ✕ выключает).
- Карта: «Туча заходит», «Шторм сразу», «Вентилятор», «Ясно сразу», таймер до следующей тучи.
- Урок: «Верный ответ» (засчитать раунд), «Следующий раунд», «Завершить ⭐⭐⭐/⭐⭐/⭐».
- «Сбросить прогресс» — `DELETE /kids-learning/progress`.
Код: `src/admin/` (bridge.js — мост сцена/урок ↔ панель, AdminPanel.jsx).

## Экраны острова (выбор уровня, урок, результат)
- Тема острова — `theme` в `islands/index.js` (градиент фона `bg`, `accent`, тип живого фона `fx`,
  летающие `glyphs`, реплика маскота `hello`). Через CSS-переменные `--bg-a/b/c`, `--accent`.
- `components/LevelBackdrop.jsx` — живой фон с параллаксом (letters / numbers / paint / puzzle).
- Карточки уровней: поля уровня `art` (иллюстрация), `hint` (реплика маскота при наведении/нажатии),
  `requires: '<id>'` — уровень заблокирован (замок), пока на требуемом нет ≥1 звезды. Убрать
  `requires` = открыть уровень. Звёзды — SVG с золотым градиентом и бегущим бликом (`Stars.jsx`).
- Кнопка «Назад» — деревянная табличка (`BackButton.jsx`), стрелка в цвете `--accent`.
- Кнопки «во весь экран» и «звук» — в шапке всех экранов (`TopActions` в IslandShell).

## Как добавить остров или уровень
- Новый остров: `src/islands/<имя>/data.js` (LEVELS, контент) + `<Имя>Island.jsx`:
  `Lesson` использует `useLesson` + `LessonFrame` + `OptionButton`, наружу —
  `<IslandShell modeId title levels Lesson {...props} />`. Запись в `islands/index.js`.
- Новый уровень: строка в `LEVELS` соответствующего `data.js` (id уходит в backend как `level`).
- Новая раскраска: объект в `coloring/data.js → PICTURES` (зоны = SVG-фигуры в viewBox 400×300).

## Звёзды
- по умолчанию: сколько раундов решено с первой попытки (все → 3, не более 2 ошибок → 2, иначе 1)
- «найди пару», «найди все», раскраска: по числу ошибок (`starsByMistakes([для 3, для 2])` в LEVELS)

## Замены на будущее
- Картинки сейчас emoji → поля `pic` в data.js можно заменить на пути к png/svg.
- Озвучка — Web Speech API (голос системы). Для записанных mp3 заменить `speak()` в `audio/engine.js`.
- Музыка/эффекты синтезируются; для mp3 заменить `playMusic()/sfx` там же.
