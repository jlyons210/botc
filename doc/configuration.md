# Configuration

Configuration is achieved through environment variables, which are easily configured for container deployments.

## Contents

- [Required](#required)
- [Feature gates](#feature-gates)
- [Optional](#optional)
  - [Caching-specific](#optional-caching-specific)
- [Kubernetes deployment](#kubernetes-deployment)

[:arrow_left: Back to README.md](/README.md)

### Required

| Environment | Default | Description |
| --- | --- | --- |
| `BRAVE_API_KEY` | N/A | Your [Brave](https://brave.com/search/api/) API key. Only required when `ENABLE_AI_GROUNDING` is enabled. |
| `DISCORD_BOT_TOKEN` | N/A | Your [Discord Developer Portal](https://discord.com/developers/applications) bot token. Always required. |
| `OPENAI_API_KEY` | N/A | Your [OpenAI platform](https://platform.openai.com/settings/) API key. Always required. |
| `ELEVENLABS_API_KEY` | N/A | Your [ElevenLabs](https://elevenlabs.io/app/settings/api-keys) API key. Only required when `ENABLE_VOICE_RESPONSE` is enabled. |

[:arrow_up: Back to top](#configuration)

### Feature gates

| Environment | Default | Description |
| --- | --- | --- |
| `ENABLE_AI_GROUNDING` | `true` | Allows the bot to ground responses using the Brave AI Grounding API. |
| `ENABLE_AUTO_RESPOND` | `true` | Allows the bot to respond without being explicitly tagged. |
| `ENABLE_DEBUG_LOGGING` | `false` | Enable debug logging to the console. |
| `ENABLE_IMAGE_GENERATION` | `true` | Allows the bot to generate images using the OpenAI `gpt-image-1` model. |
| `ENABLE_VOICE_RESPONSE` | `false` | Allows the bot to respond to voice responses with voice using the ElevenLabs API. |

[:arrow_up: Back to top](#configuration)

### Optional

| Environment | Default | Description |
| --- | --- | --- |
| `DISCORD_BOT_NAME` | `botc` | Should be configured to match bot's name in Discord channels. |
| `DISCORD_CHANNEL_HISTORY_HOURS` | `24` | Number of hours of past messsages to ingest for conversation context. |
| `DISCORD_CHANNEL_HISTORY_MESSAGES` | `100` | Number of past messages to ingest per-channel for conversation context. |
| `DISCORD_MAX_RETRIES` | `5` | Number of times to retry Discord APIs. Retry interval is `1 second * retry count`. |
| `ELEVENLABS_MODEL_ID` | `eleven_multilingual_v2` | Speech synthesis models offered by the ElevenLabs API. |
| `ELEVENLABS_VOICE_ID` | `oR4uRy4fHDUGGISL0Rev` | ElevenLabs text-to-speech voice ID. |
| `OPENAI_DESCRIBE_IMAGE_PROMPT` | [Source](https://github.com/jlyons210/botc/blob/main/src/Botc/Configuration/Configuration.defaults.ts) | Prompt used to describe attached images. |
| `OPENAI_GROUND_DECISION_PROMPT` | [Source](https://github.com/jlyons210/botc/blob/main/src/Botc/Configuration/Configuration.defaults.ts) | Prompt used to reason whether or not the bot should ground its response using the Brave Grounded AI API. |
| `OPENAI_MAX_RETRIES` | `3` | Number of OpenAI API retries on retriable errors. |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI model to use for chat completions. |
| `OPENAI_PROMPT_BOT_BEHAVIOR` | `String` | Optional field for further customizing the bot behavior without re-writing the full system prompt. |
| `OPENAI_REPLY_DECISION_PROMPT` | [Source](https://github.com/jlyons210/botc/blob/main/src/Botc/Configuration/Configuration.defaults.ts) | Prompt used to reason whether or not the bot should engage in conversation. |
| `OPENAI_SYSTEM_PROMPT` | [Source](https://github.com/jlyons210/botc/blob/main/src/Botc/Configuration/Configuration.defaults.ts) | Behavioral prompt to set the overall bot behavior. |
| `OPENAI_TIMEOUT` | `600000` | Milliseconds to wait for OpenAI API response. |

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

Sample `deployment.yml`

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
        imagePullPolicy: Always
        env:
        - name: BRAVE_API_KEY
          valueFrom:
            secretKeyRef:
              name: discord-bots
              key: brave-aig-api-key
        - name: DISCORD_BOT_NAME
          value: Botc
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
        - name: OPENAI_PROMPT_BOT_BEHAVIOR
          value: >
            You are a humorous British cat chatbot. You say 'meow' and make other cat sounds often
            in your responses, to remind users that you are a cat. Don't let them forget that you
            are a cat.
        - name: TZ
          value: America/Denver
```

[:arrow_up: Back to top](#configuration)
