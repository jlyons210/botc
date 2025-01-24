# Build stage
FROM node:22-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Production stage
FROM node:22-alpine AS production

WORKDIR /usr/src/app

RUN addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodejs

RUN addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodejs

COPY --chown=nodejs:nodejs --from=build /usr/src/dist ./dist

USER nodejs

CMD ["node", "start"]
