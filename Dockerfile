### Dependencies stage
FROM dhi.io/node:26.8.2-alpine3.23-dev@sha256:34ebd987d37dba56553ee67dbe772894fdcff51f9e70169bae6a49e22ef65f22 AS deps

# Install dependencies for production stage
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts \
    && npm cache clean --force


### Build stage
FROM dhi.io/node:26.8.2-alpine3.23-dev@sha256:34ebd987d37dba56553ee67dbe772894fdcff51f9e70169bae6a49e22ef65f22 AS build

# Install prod and dev dependencies for build
WORKDIR /usr/src/app
COPY package*.json tsconfig.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY src ./src
RUN npm run build


### Production stage
FROM dhi.io/node:26.8.2-alpine3.23@sha256:6c2d623d11571160de1461e7fa13093055fb58df510e9b75ba752e7cbb4154f6 AS runtime
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
