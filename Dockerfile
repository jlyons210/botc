### Dependencies stage
FROM dhi.io/node:24.19.0-alpine3.23-dev@sha256:f318309c4bb66f3844c3b1b17dddf7dff2476e20b0ec1446d9db23cd32e49bd8 AS deps

# Install dependencies for production stage
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts \
    && npm cache clean --force


### Build stage
FROM dhi.io/node:24.19.0-alpine3.23-dev@sha256:f318309c4bb66f3844c3b1b17dddf7dff2476e20b0ec1446d9db23cd32e49bd8 AS build

# Install prod and dev dependencies for build
WORKDIR /usr/src/app
COPY package*.json tsconfig.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY src ./src
RUN npm run build


### Production stage
FROM dhi.io/node:24.19.0-alpine3.23@sha256:eccb6bbba003874e6ee6254db212cad1d38f74a8bbbc6ae1f05721f95dd27be3 AS runtime
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
