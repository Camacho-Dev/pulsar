FROM node:20-bookworm-slim AS base
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    openssl ca-certificates python3 make g++ sqlite3 libsqlite3-dev \
  && rm -rf /var/lib/apt/lists/*

# Antes de npm ci (y antes de next build)
ENV DATABASE_URL=file:./data/pulsar.db
ENV AUTH_SECRET=build-placeholder-secret-32chars-min
ENV AUTH_URL=http://localhost:3000
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000
# NEXT_PUBLIC_MAPBOX_TOKEN: definir en Render (disponible en docker build y runtime)

# Schema Prisma debe existir si algún script corre generate en install
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma

RUN npm ci

COPY . .
RUN mkdir -p /app/data
RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
