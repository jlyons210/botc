### Dependencies stage
FROM node:24.14.0-alpine3.23 AS dependencies

# Install dependencies for production stage
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts \
    && npm cache clean --force
RUN apk add --no-cache tini


### Build stage
FROM node:24.14.0-alpine3.23 AS builder

# Install prod and dev dependencies for build
WORKDIR /usr/src/app
COPY package*.json tsconfig.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY src ./src
RUN npm run build


### Production stage
FROM dhi.io/node:24.14.0-alpine3.23 AS production
ENV NODE_ENV=production

LABEL org.opencontainers.image.authors="Jeremy Lyons <jlyons210@gmail.com>" \
      org.opencontainers.image.description="My most ambitious Discord bot yet." \
      org.opencontainers.image.source="https://github.com/jlyons210/botc"

# Copy production dependencies and built application
WORKDIR /app
COPY --from=dependencies /sbin/tini /sbin/tini
COPY --chown=node:node --from=dependencies /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=builder /usr/src/app/package.json .
COPY --chown=node:node --from=builder /usr/src/app/dist ./dist

# Run as non-root user
USER node
ENTRYPOINT ["tini", "--"]
CMD ["node", "dist/app.js"]
