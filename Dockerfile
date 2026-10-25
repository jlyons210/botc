### Dependencies stage
FROM dhi.io/node:26.12.1-alpine3.23-dev@sha256:1fb4a2757c11fc174d3118363d01d7a7cdcd2b96544083c2a372e12d175bc754 AS deps

# Install dependencies for production stage
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts


### Production stage
FROM dhi.io/node:26.12.1-alpine3.23@sha256:ed0e7626b8b1b5322a31746d7ca476cfd98bc3d3be251e5a074c63be89aa1d53 AS runtime
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
