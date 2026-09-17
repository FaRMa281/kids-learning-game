# Развёртывание «Островов знаний»

Игра = статический фронт (Vite → `dist/`) + маленький API (FastAPI, `games-backend`).
Фронт в продакшене ходит в API по относительному пути `/api/kids-learning/...`
(`kids-learning-game/.env.production`), поэтому нужен прокси `/api/` → backend
на том же домене — тогда не нужны ни CORS, ни отдельные домены. Ниже три варианта.

## Локально с телефона (проверка в своей сети)

```
cd G:\Server\games\games-backend && run.bat                 # API :8001
cd G:\Server\games\kids-learning-game && npm run dev:lan    # фронт слушает 0.0.0.0:3001
```
На телефоне открыть `http://<IP компьютера>:3001` (IP — `ipconfig`). Backend в dev-режиме
разрешает CORS для любых адресов локальной сети на портах 30xx. Фронт в dev берёт API из
`.env` (`http://localhost:8001`) — для телефона поменяйте на `http://<IP>:8001/kids-learning`
или временно `VITE_API_URL=http://192.168.x.x:8001/kids-learning npm run dev:lan`.

## Вариант A — Docker (VPS, свой сервер): один контейнер nginx + один backend

```
cd G:\Server\games
docker compose -f deploy/docker-compose.yml up -d --build
```
- `kids-learning-game/Dockerfile` — multi-stage: `node:22` собирает `dist`, `nginx:alpine` раздаёт.
- `deploy/nginx.conf` — SPA-fallback, кэш `assets/` навсегда, `sw.js`/`index.html` без кэша,
  `location /api/ → http://games-backend:8001/`.
- `games-backend/Dockerfile` — uvicorn, база SQLite на томе `games-data:/data`.
- Порт 80 наружу. HTTPS (обязателен для PWA/Service Worker и fullscreen на телефоне!) —
  поставить перед compose Caddy/Traefik или `certbot` на хосте. Самый простой Caddyfile:
  ```
  game.example.com {
      reverse_proxy localhost:80
  }
  ```
- В `docker-compose.yml` замените `YOUR_DOMAIN` в `CORS_ORIGINS` (или уберите — за прокси CORS не нужен).

## Вариант B — Vercel / Netlify (фронт) + backend где угодно

1. Backend поднять отдельно (Docker из варианта A без фронта, или Fly.io/Railway/Render:
   `uvicorn app.main:app --host 0.0.0.0 --port $PORT`), задать
   `CORS_ORIGINS=https://<домен фронта>`.
2. В `kids-learning-game/vercel.json` **или** `netlify.toml` заменить `YOUR-BACKEND-HOST` —
   rewrite `/api/*` проксирует на backend, так что фронт по-прежнему ходит на свой домен.
3. Подключить репозиторий: Root Directory = `games/kids-learning-game`, Build = `npm run build`,
   Output = `dist`. Всё остальное в конфигах уже есть (SPA-rewrite, заголовки кэша для `sw.js`).

## Вариант C — GitHub Pages (только фронт)

```
VITE_BASE=/kids-learning-game/ npm run build   # base = имя репозитория
```
и опубликовать `dist/` (gh-pages branch или Actions). Прогресс сохраняться не будет, если нет
публичного backend'а: тогда `VITE_API_URL=https://<backend>/kids-learning` при сборке и
`CORS_ORIGINS=https://<user>.github.io` на backend'е. Без backend'а игра работает, а на карте
маскот скажет «не вижу сервер».

## PWA

- `vite-plugin-pwa` генерирует `manifest.webmanifest` и `sw.js` (Workbox, precache всех ассетов —
  игра открывается офлайн; шрифты Google — CacheFirst; `/progress` — NetworkFirst).
- Иконки: `public/icons/` (192, 512, maskable, apple-touch). Заменить на свои — просто перезаписать.
- «На экран Домой»: Android Chrome предложит сам (после HTTPS + manifest), iOS — Поделиться →
  «На экран Домой». Запуск из ярлыка — `display: fullscreen`, `orientation: landscape`.
- Кнопка ⛶ на карте — Fullscreen API + `screen.orientation.lock('landscape')` (в браузере; в PWA
  кнопка скрыта, там и так весь экран). iOS Safari fullscreen не даёт — только через ярлык.
- После деплоя новой версии SW обновляется автоматически (`registerType: autoUpdate`);
  чтобы обновление доехало, `sw.js` и `index.html` должны отдаваться с `Cache-Control: no-cache` —
  в nginx/vercel/netlify это уже прописано.

## Проверка перед выкладкой

```
cd kids-learning-game
npm run lint && npm run build && npm run preview      # http://<IP>:4173 — прод-сборка с SW
```
Lighthouse (Chrome DevTools → PWA) должен показать installable. Проверить на телефоне:
портрет → экран «Поверни телефон», ландшафт → игра, пинч/долгий тап ничего не делают,
кнопка ⛶ разворачивает на весь экран.
