# Dependency stage

FROM node:22-alpine AS deps

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev --ignore-scripts && \
    npm cache verify

# Build stage

FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY --from=deps /usr/src/app/node_modules ./node_modules

COPY . .

RUN npm run build && \
    rm -rf node_modules

# Production stage
FROM node:22-alpine AS production

ENV NODE_ENV=production

WORKDIR /usr/src/app

RUN addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodejs

COPY --chown=nodejs:nodejs --from=deps /usr/src/app/package*.json ./

RUN npm ci --omit=dev --ignore-scripts && \
    npm cache verify

COPY --chown=nodejs:nodejs --from=builder /usr/src/app/dist ./dist

USER nodejs

CMD ["node", "dist/app.js"]
