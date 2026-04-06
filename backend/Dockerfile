# Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set environment variables
ENV FLASK_APP=run.py
ENV FLASK_ENV=production
ENV FLASK_CONFIG=production

# Create directory for SQLite database
RUN mkdir -p /data && chmod 777 /data

EXPOSE 5000

# Run migrations and seed
CMD sh -c "flask db upgrade && flask seed && gunicorn -w 4 -b 0.0.0.0:5000 run:app"
