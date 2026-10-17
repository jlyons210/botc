### Dependencies stage
FROM dhi.io/node:26.9.0-alpine3.23-dev@sha256:d7d4b9e020dd2e8feb873df27a49c898b85d7b2f6f59d9d7dbaa7c9070bc4db5 AS deps

# Install dependencies for production stage
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts \
    && npm cache clean --force


### Build stage
FROM dhi.io/node:26.9.0-alpine3.23-dev@sha256:d7d4b9e020dd2e8feb873df27a49c898b85d7b2f6f59d9d7dbaa7c9070bc4db5 AS build

# Install prod and dev dependencies for build
WORKDIR /usr/src/app
COPY package*.json tsconfig.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY src ./src
RUN npm run build


### Production stage
FROM dhi.io/node:26.9.0-alpine3.23@sha256:8d2c30232878a0631a01eb2f8eae51b5dac199d801766ae2da6c71fec9f7f3e7 AS runtime
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
