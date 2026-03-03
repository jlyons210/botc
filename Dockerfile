### Build stage
FROM dhi.io/node:24.14.0-alpine3.23 AS builder

# Install dependencies
WORKDIR /usr/src/app
COPY package*.json tsconfig.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY src ./src
RUN npm run build

### Production stage
FROM dhi.io/node:24.14.0-alpine3.23 AS production
ENV NODE_ENV=production

LABEL maintainer="Jeremy Lyons <jlyons210@gmail.com>" \
      description="My most ambitious Discord bot yet." \
      url="https://github.com/jlyons210/botc"

# Install tini for proper signal handling
RUN apk add --no-cache tini

# Install dependencies
WORKDIR /usr/src/app
COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev --ignore-scripts \
    && npm cache clean --force

# Copy built application
COPY --chown=node:node --from=builder /usr/src/app/dist ./dist

# Run as non-root user
USER node
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/app.js"]
