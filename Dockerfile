# Build stage
FROM node:24.12.0-alpine3.23 AS builder
WORKDIR /usr/src/app

# Copy package files and install all dependencies
COPY package*.json tsconfig.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY src ./src
RUN npm run build

# Production stage
FROM node:24.12.0-alpine3.23 AS production
LABEL maintainer="Jeremy Lyons <jlyons210@gmail.com>" \
      description="My most ambitious Discord bot yet." \
      url="https://github.com/jlyons210/botc"

# Install runtime dependencies and create non-root user
RUN apk add --no-cache dumb-init && \
    addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodejs

ENV NODE_ENV=production
WORKDIR /usr/src/app

# Copy package files and install production dependencies
COPY --chown=nodejs:nodejs package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy build application
COPY --chown=nodejs:nodejs --from=builder /usr/src/app/dist ./dist

USER nodejs
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/app.js"]
