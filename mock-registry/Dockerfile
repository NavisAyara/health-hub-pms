# Use official Python runtime as a parent image
FROM python:3.13-slim

# Set the working directory in the container
WORKDIR /app

# Copy dependency files
COPY pyproject.toml .

# Install dependencies
RUN pip install --no-cache-dir .

# Copy the rest of the application code
COPY . .

# Expose port 8080 as requested
EXPOSE 8080

# Run migrations, seed the database, and start the application
CMD ["sh", "-c", "flask db upgrade && python seed.py && flask --app main run --host=0.0.0.0 --port=8080"]
