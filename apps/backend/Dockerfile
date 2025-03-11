# syntax=docker/dockerfile:1
FROM alpine:3.20

# Build arguments
ARG POCKETBASE_VERSION=0.22.21
ARG TARGETOS=linux
ARG TARGETARCH=amd64

# Environment variables
ENV POCKETBASE_VERSION=${POCKETBASE_VERSION}

# Set working directory
WORKDIR /app

# Hadolint ignore=DL3018
RUN apk add --no-cache ca-certificates && \
    wget -O pocketbase.zip "https://github.com/pocketbase/pocketbase/releases/download/v${POCKETBASE_VERSION}/pocketbase_${POCKETBASE_VERSION}_${TARGETOS}_${TARGETARCH}.zip" && \
    unzip pocketbase.zip && \
    rm pocketbase.zip && \
    chmod +x pocketbase


# Copy hooks
COPY ./pb_hooks /app/pb_hooks
COPY ./pb_migrations /app/pb_migrations

# Dokku-specific: Use $PORT environment variable
ENV PORT=5000

# Start Pocketbase
CMD ["sh", "-c", "/app/pocketbase serve --http=0.0.0.0:$PORT"]