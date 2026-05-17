FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV FLASK_APP=run.py
ENV FLASK_ENV=production
ENV FLASK_CONFIG=production

EXPOSE ${BACKEND_PORT}

CMD sh -c "flask db upgrade && gunicorn -w 4 -b 0.0.0.0:${BACKEND_PORT} run:app"
