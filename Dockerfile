### Dependencies stage
FROM dhi.io/node:26.13.1-alpine3.23-dev@sha256:b2b88fa53022f8973733c0dffefc0154614c86f0779a63ef31b4ce2195c4e604 AS deps

# Install dependencies for production stage
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts


### Production stage
FROM dhi.io/node:26.13.1-alpine3.23@sha256:9810cc00c2c7662a61c491d374065121f991222cedd2b8f7c5bb39cd658f429c AS runtime
ENV NODE_ENV=production

LABEL org.opencontainers.image.authors="Jeremy Lyons <jlyons210@gmail.com>" \
      org.opencontainers.image.description="My most ambitious Discord bot yet." \
      org.opencontainers.image.source="https://github.com/jlyons210/botc"

# Copy production dependencies and TypeScript source
WORKDIR /app
COPY --chown=node:node --from=deps /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=deps /usr/src/app/package.json .
COPY --chown=node:node src ./src

# Run as non-root user
USER node
ENTRYPOINT ["node"]
CMD ["src/app.ts"]
