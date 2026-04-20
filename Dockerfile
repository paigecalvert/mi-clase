# Build:
#   docker build -t ghcr.io/paigecalvert/mi-clase:latest .
#
# Push:
#   docker push ghcr.io/paigecalvert/mi-clase:latest
#
# Run locally (requires postgres/redis/minio already running):
#   docker run --rm -p 3000:3000 --env-file .env ghcr.io/paigecalvert/mi-clase:latest

# Stage 1: build the React client
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: production image
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY server/ ./server/
COPY --from=client-build /app/client/dist ./client/dist

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server/index.js"]
