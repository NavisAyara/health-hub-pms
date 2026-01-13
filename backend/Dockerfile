# Use official Python runtime as a parent image
FROM python:3.13-slim

# Set the working directory in the container
WORKDIR /app

# Copy the dependency file first to leverage Docker cache
COPY pyproject.toml .
COPY README.md . 

# Install system dependencies for MariaDB connector
RUN apt-get update && apt-get install -y \
    gcc \
    libmariadb-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
RUN pip install --no-cache-dir .

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Run migrations, seed the database, and start the application
CMD ["sh", "-c", "flask db upgrade && python seed.py && flask run --host=0.0.0.0"]
