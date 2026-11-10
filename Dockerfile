### Dependencies stage
FROM dhi.io/node:26.13.0-alpine3.23-dev@sha256:c6d2bda057e0576fea8fd95c5e8c8d2a86a48d9d5944716835bfcb9651ac53d9 AS deps

# Install dependencies for production stage
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts


### Production stage
FROM dhi.io/node:26.13.0-alpine3.23@sha256:70cce99a217e33fe3943492824c6bae963013913c389564278350ced8bcc3492 AS runtime
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
