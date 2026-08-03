### Dependencies stage
FROM dhi.io/node:24.18.1-alpine3.23-dev@sha256:ca1de8032e4522970549f0fb85d41700114e8668703da82a9bc81ee3829fdb28 AS deps

# Install dependencies for production stage
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts \
    && npm cache clean --force


### Build stage
FROM dhi.io/node:24.18.1-alpine3.23-dev@sha256:ca1de8032e4522970549f0fb85d41700114e8668703da82a9bc81ee3829fdb28 AS build

# Install prod and dev dependencies for build
WORKDIR /usr/src/app
COPY package*.json tsconfig.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY src ./src
RUN npm run build


### Production stage
FROM dhi.io/node:24.18.1-alpine3.23@sha256:28886e1b7703a58c76a63d748ed156499f20bb3cfe180a7c13bde1eb92be4a19 AS runtime
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
