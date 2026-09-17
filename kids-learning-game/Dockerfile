# Контекст сборки — папка games/ (см. deploy/docker-compose.yml):
#   docker build -f kids-learning-game/Dockerfile -t kids-learning-game .
FROM node:22-alpine AS build
WORKDIR /app
COPY kids-learning-game/package.json kids-learning-game/package-lock.json ./
RUN npm ci
COPY kids-learning-game/ .
# VITE_API_URL берётся из .env.production (= /api/kids-learning)
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
