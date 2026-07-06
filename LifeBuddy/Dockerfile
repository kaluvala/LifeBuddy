# Standard Python base image
FROM python:3.11-slim

# Set secure system env overrides
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Establish gVisor / Docker sandbox working directory
WORKDIR /app

# Install system dependencies for psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install requirements
COPY src/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ /app/src/
COPY policies.yaml /app/

# Expose ports
EXPOSE 8000

# Run in sandboxed user mode
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

# Run server
CMD ["python", "src/main.py"]
