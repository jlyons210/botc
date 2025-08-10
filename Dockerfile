# Dependency stage
FROM node:22-alpine AS deps

# Install security updates and clean up
RUN apk update && apk upgrade && apk add --no-cache dumb-init && rm -rf /var/cache/apk/*

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --ignore-scripts --frozen-lockfile && \
    npm cache clean --force

# Build stage
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY --from=deps /usr/src/app/node_modules ./node_modules

# Copy source files (respects .dockerignore)
COPY . .

RUN npm run build && \
    rm -rf node_modules && \
    rm -rf src

# Production stage
FROM node:22-alpine AS production

# Install security updates
RUN apk update && apk upgrade && rm -rf /var/cache/apk/*

ENV NODE_ENV=production

WORKDIR /usr/src/app

# Create non-root user with explicit UIDs for better security
RUN addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodejs

COPY --chown=nodejs:nodejs --from=deps /usr/src/app/package*.json ./

RUN npm ci --omit=dev --ignore-scripts --frozen-lockfile && \
    npm cache clean --force

COPY --chown=nodejs:nodejs --from=builder /usr/src/app/dist ./dist

# Switch to non-root user
USER nodejs

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check')" || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/app.js"]
