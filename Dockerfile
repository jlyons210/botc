### Dependencies stage
FROM dhi.io/node:24.15.0-alpine3.23-dev@sha256:300f9d5d339ed99cd9412c5cd59cb9973f11cfc2d459cdbf58f3778d288f84a0 AS deps

# Install dependencies for production stage
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts \
    && npm cache clean --force


### Build stage
FROM dhi.io/node:24.15.0-alpine3.23-dev@sha256:300f9d5d339ed99cd9412c5cd59cb9973f11cfc2d459cdbf58f3778d288f84a0 AS build

# Install prod and dev dependencies for build
WORKDIR /usr/src/app
COPY package*.json tsconfig.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY src ./src
RUN npm run build


### Production stage
FROM dhi.io/node:24.15.0-alpine3.23@sha256:4da969f0940f04c0da297dd1f0474caa38f423294a9d63136ab29ecbdb84e06e AS runtime
ENV NODE_ENV=production

LABEL org.opencontainers.image.authors="Jeremy Lyons <jlyons210@gmail.com>" \
      org.opencontainers.image.description="My most ambitious Discord bot yet." \
      org.opencontainers.image.source="https://github.com/jlyons210/botc"

# Copy production dependencies and built application
WORKDIR /app
COPY --chown=node:node --from=deps /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/package.json .
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

# Run as non-root user
USER node
ENTRYPOINT ["node"]
CMD ["dist/app.js"]
