FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home appuser
USER appuser

EXPOSE 8000

# Run both MCP server and REST API via uvicorn
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000", "--log-level", "info"]
