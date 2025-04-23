# Configuration

Configuration is achieved through environment variables, which are easily configured for container deployments.

## Contents

- [Required](#required-settings)
- [Optional](#optional)
  - [Caching-specific](#optional-caching-specific)
- [Kubernetes deployment](#kubernetes-deployment)

[:arrow_left: Back to README.md](/README.md)

### Required

| Environment | Default | Description |
|---|---|---|
| `DISCORD_BOT_TOKEN` | N/A | Your [Discord Developer Portal](https://discord.com/developers/applications) bot token. |
| `OPENAI_API_KEY` | N/A | Your [OpenAI platform](https://platform.openai.com/settings/) API key. |
| `ELEVENLABS_API_KEY` | N/A | Your [ElevenLabs](https://elevenlabs.io/app/settings/api-keys) API key. |

[:arrow_up: Back to top](#configuration)

### Optional

| Environment | Default | Description |
| --- | --- | --- |
| `DEBUG_LOGGING_ENABLED` | `false` | Used to enable debug logging. |
| `DISCORD_CHANNEL_HISTORY_HOURS` | `24` | Number of hours of past messsages to ingest for conversation context. |
| `DISCORD_CHANNEL_HISTORY_MESSAGES` | `100` | Number of past messages to ingest per-channel for conversation context. |
| `DISCORD_MAX_RETRIES` | `5` | Number of times to retry Discord APIs. Retry interval is `1 second * retry count`. |
| `ELEVENLABS_MODEL_ID` | `eleven_multilingual_v2` | Speech synthesis models offered by the ElevenLabs API. |
| `ELEVENLABS_VOICE_ID` | `oR4uRy4fHDUGGISL0Rev` | ElevenLabs text-to-speech voice ID. |
| `OPENAI_DESCRIBE_IMAGE_PROMPT` | [Source](https://github.com/jlyons210/botc/blob/main/src/Botc/Configuration/Configuration.defaults.ts) | Prompt used to describe attached images. |
| `OPENAI_MAX_RETRIES` | `3` | Number of OpenAI API retries on retriable errors. |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI model to use for chat completions. |
| `OPENAI_PROMPT_BOT_BEHAVIOR` | `String` | Optional field for further customizing the bot behavior without re-writing the full system prompt. |
| `OPENAI_REPLY_DECISION_PROMPT` | [Source](https://github.com/jlyons210/botc/blob/main/src/Botc/Configuration/Configuration.defaults.ts) | Prompt used to reason whether or not the bot should engage in conversation. |
| `OPENAI_SYSTEM_PROMPT` | [Source](https://github.com/jlyons210/botc/blob/main/src/Botc/Configuration/Configuration.defaults.ts) | Behavioral prompt to set the overall bot behavior. |
| `OPENAI_TIMEOUT` | `30000` | Milliseconds to wait for OpenAI API response. |

[:arrow_up: Back to top](#configuration)

#### Optional: Caching-specific

| Environment | Default | Description |
| --- | --- | --- |
| `OPENAI_DESCRIBE_IMAGE_CACHE_TTL_HOURS` | `24` | Hours to cache image descriptions. |
| `OPENAI_CACHE_LOG_ENTRIES` | `false` | Enables logging of new cache entries. |
| `OPENAI_CACHE_LOG_HITS` | `false` | Enables logging of cache hits. |
| `OPENAI_CACHE_LOG_MISSES` | `false` | Enables logging of cache misses. |
| `OPENAI_CACHE_LOG_PURGES` | `false` | Enables logging of cache entry expiration/purging. |
| `OPENAI_PERSONA_CACHE_TTL_HOURS` | `3` | Hours to cache guild-wide user personas. |
| `OPENAI_VOICE_TRANSCRIPT_CACHE_TTL_HOURS` | `24` | Hours to cache voice message transcriptions.

[:arrow_up: Back to top](#configuration)

## Kubernetes deployment

Sample `deploy.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: botc
  namespace: discord-bots
spec:
  replicas: 1
  selector:
    matchLabels:
      app: botc
  template:
    metadata:
      labels:
        app: botc
    spec:
      restartPolicy: Always
      containers:
      - name: botc
        image: ghcr.io/jlyons210/botc:latest
        env:
        - name: DISCORD_BOT_TOKEN
          valueFrom:
            secretKeyRef:
              name: discord-bots
              key: botc-discord-token
        - name: ELEVENLABS_API_KEY
          valueFrom:
            secretKeyRef:
              name: discord-bots
              key: elevenlabs-api-key
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: discord-bots
              key: openai-api-key
        - name: OPENAI_CACHE_LOG_ENTRIES
          value: "true"
        - name: OPENAI_CACHE_LOG_MISSES
          value: "true"
        - name: OPENAI_CACHE_LOG_PURGES
          value: "true"
        - name: TZ
          value: America/Denver
```

[:arrow_up: Back to top](#configuration)
