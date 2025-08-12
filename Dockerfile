# Dependency stage
FROM node:22.18.0-alpine AS dependencies
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --ignore-scripts

# Build stage
FROM node:22.18.0-alpine AS builder
WORKDIR /usr/src/app
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY package*.json tsconfig.json ./
COPY src ./src
RUN npm run build

# Production stage
FROM node:22.18.0-alpine AS production
LABEL maintainer="Jeremy Lyons <jlyons210@gmail.com>" \
      description="My most ambitious Discord bot yet." \
      url="https://github.com/jlyons210/botc"

RUN apk add --no-cache dumb-init && \
    addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodejs

ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY --chown=nodejs:nodejs package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --chown=nodejs:nodejs --from=builder /usr/src/app/dist ./dist

USER nodejs
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/app.js"]
