FROM python:3.11-slim

# Install Node.js for frontend build
RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Build frontend
COPY frontend/package*.json frontend/
RUN cd frontend && npm ci

COPY frontend/ frontend/
RUN cd frontend && npm run build

# Copy backend
COPY backend/ backend/
COPY run.py .

ENV PYTHONPATH=/app
EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "run:app"]
