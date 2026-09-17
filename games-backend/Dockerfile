FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
# база — на томе /data, чтобы переживала пересборку контейнера
ENV DATABASE_URL=sqlite:////data/games.db
VOLUME ["/data"]
EXPOSE 8001
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
