import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent  # /games-backend

# DATABASE_URL можно переопределить (в Docker — том /data)
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{BASE_DIR / 'games.db'}")

# Откуда разрешаем запросы. Dev: фронты игр на 3001, 3002, … + телефон в локальной сети.
# Prod: CORS_ORIGINS="https://game.example.com,https://www.example.com" (или "*" за прокси на том же домене).
_env_origins = os.environ.get("CORS_ORIGINS")
if _env_origins:
    CORS_ORIGINS = [o.strip() for o in _env_origins.split(",") if o.strip()]
    CORS_ORIGIN_REGEX = None
else:
    CORS_ORIGINS = ["http://localhost:3001", "http://127.0.0.1:3001"]
    # любой хост локальной сети на dev-портах — чтобы открывать с телефона по IP компьютера
    CORS_ORIGIN_REGEX = r"^http://(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|localhost|127\.0\.0\.1):30\d\d$"
