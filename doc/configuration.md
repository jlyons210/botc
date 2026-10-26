# Configuration

Configure botc through environment variables. Start with the prerequisites and required credentials, then review optional features and settings before choosing a Docker or Kubernetes deployment below.

## Contents

- [Prerequisites](#prerequisites)
- [Settings](#settings)
  - [Required](#required)
  - [Feature gates](#feature-gates)
  - [Optional](#optional)
    - [Caching-specific](#optional-caching-specific)
- [Deployment](#deployment)
  - [Docker](#docker)
  - [Kubernetes](#kubernetes)

[:arrow_left: Back to README.md](/README.md)

## Prerequisites

- **Discord:** Create a Discord application with a bot, add it to your server, enable the `Message Content` and `Server Members` privileged intents, and grant it permission to view channels, read message history, and send messages. See the [Discord Developer Portal](https://discord.com/developers/applications), [Gateway intents](https://discord.com/developers/docs/topics/gateway#privileged-intents), and [permissions](https://discord.com/developers/docs/topics/permissions).
- **OpenAI:** An API key is required for chat responses and the bot's image and audio processing. Create one in the [OpenAI API dashboard](https://platform.openai.com/api-keys).
- **Optional providers:** [Brave Search](https://brave.com/search/api/) is needed only when AI grounding is enabled; [ElevenLabs](https://elevenlabs.io/app/settings/api-keys) is needed only when voice responses are enabled.

[:arrow_up: Back to top](#configuration)

## Settings

### Required

| Environment          | Default | Description                                                                                                                    |
| -------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `DISCORD_BOT_TOKEN`  | N/A     | Your [Discord Developer Portal](https://discord.com/developers/applications) bot token. Always required.                       |
| `OPENAI_API_KEY`     | N/A     | Your [OpenAI platform](https://platform.openai.com/settings/) API key. Always required.                                        |
| `BRAVE_API_KEY`      | N/A     | Your [Brave](https://brave.com/search/api/) API key. Only required when `ENABLE_AI_GROUNDING` is enabled.                      |
| `ELEVENLABS_API_KEY` | N/A     | Your [ElevenLabs](https://elevenlabs.io/app/settings/api-keys) API key. Only required when `ENABLE_VOICE_RESPONSE` is enabled. |

[:arrow_up: Back to top](#configuration)

### Feature gates

| Environment               | Default | Description                                                                                                      |
| ------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------- |
| `ENABLE_AI_GROUNDING`     | `false` | Allows the bot to ground responses using the Brave AI Grounding API. Requires `BRAVE_API_KEY`.                   |
| `ENABLE_AUTO_RESPOND`     | `true`  | Allows the bot to respond without being explicitly tagged.                                                       |
| `ENABLE_DEBUG_LOGGING`    | `false` | Enable debug logging to the console.                                                                             |
| `ENABLE_IMAGE_GENERATION` | `true`  | Allows the bot to generate and edit images using `OPENAI_IMAGE_MODEL`.                                           |
| `ENABLE_VOICE_RESPONSE`   | `false` | Allows the bot to respond to voice responses with voice using the ElevenLabs API. Requires `ELEVENLABS_API_KEY`. |

[:arrow_up: Back to top](#configuration)

### Optional

| Environment                        | Default                                                                                                | Description                                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `DISCORD_BOT_NAME`                 | `botc`                                                                                                 | Should be configured to match bot's name in Discord channels.                                            |
| `DISCORD_CHANNEL_HISTORY_HOURS`    | `24`                                                                                                   | Number of hours of past messsages to ingest for conversation context.                                    |
| `DISCORD_CHANNEL_HISTORY_MESSAGES` | `100`                                                                                                  | Number of past messages to ingest per-channel for conversation context.                                  |
| `DISCORD_MAX_RETRIES`              | `5`                                                                                                    | Number of times to retry Discord APIs. Retry interval is `1 second * retry count`.                       |
| `ELEVENLABS_MODEL_ID`              | `eleven_multilingual_v2`                                                                               | Speech synthesis models offered by the ElevenLabs API.                                                   |
| `ELEVENLABS_VOICE_ID`              | `oR4uRy4fHDUGGISL0Rev`                                                                                 | ElevenLabs text-to-speech voice ID.                                                                      |
| `OPENAI_DESCRIBE_IMAGE_PROMPT`     | [Source](https://github.com/jlyons210/botc/blob/main/src/Botc/Configuration/Configuration.defaults.ts) | Prompt used to describe attached images.                                                                 |
| `OPENAI_GROUND_DECISION_PROMPT`    | [Source](https://github.com/jlyons210/botc/blob/main/src/Botc/Configuration/Configuration.defaults.ts) | Prompt used to reason whether or not the bot should ground its response using the Brave Grounded AI API. |
| `OPENAI_IMAGE_MAX_SIDE`            | `4096`                                                                                                 | Maximum image side in pixels before resizing for image-description requests.                             |
| `OPENAI_IMAGE_MODEL`               | `gpt-image-2.5-sunburst`                                                                               | OpenAI model to use for image generations and edits.                                                     |
| `OPENAI_MAX_RETRIES`               | `3`                                                                                                    | Number of OpenAI API retries on retriable errors.                                                        |
| `OPENAI_MODEL`                     | `gpt-6-luna`                                                                                           | OpenAI model to use for chat responses.                                                                  |
| `OPENAI_MODEL_REASONING_EFFORT`    | `none`                                                                                                 | Reasoning effort the OpenAI model will use.                                                              |
| `OPENAI_PROMPT_BOT_BEHAVIOR`       | `String`                                                                                               | Optional field for further customizing the bot behavior without re-writing the full system prompt.       |
| `OPENAI_REPLY_DECISION_PROMPT`     | [Source](https://github.com/jlyons210/botc/blob/main/src/Botc/Configuration/Configuration.defaults.ts) | Prompt used to reason whether or not the bot should engage in conversation.                              |
| `OPENAI_SYSTEM_PROMPT`             | [Source](https://github.com/jlyons210/botc/blob/main/src/Botc/Configuration/Configuration.defaults.ts) | Behavioral prompt to set the overall bot behavior.                                                       |
| `OPENAI_TIMEOUT`                   | `600000`                                                                                               | Milliseconds to wait for OpenAI API response.                                                            |

#### Channel topic behavior

Channel topics can adjust behavior per channel. Put each tag on its own line; multiple tags are supported.

| Tag                 | Applies to       | Effect                                   |
| ------------------- | ---------------- | ---------------------------------------- |
| `#botc: text`       | All bots         | Appended to `OPENAI_PROMPT_BOT_BEHAVIOR` |
| `#botc_name: text`  | Bot named `name` | Appended to `OPENAI_PROMPT_BOT_BEHAVIOR` |
| `#botc!: text`      | All bots         | Replaces `OPENAI_PROMPT_BOT_BEHAVIOR`    |
| `#botc!_name: text` | Bot named `name` | Replaces `OPENAI_PROMPT_BOT_BEHAVIOR`    |

Bot names are matched case-insensitively against `DISCORD_BOT_NAME`. When several override tags apply, they replace the base behavior together; append tags are then added after.

[:arrow_up: Back to top](#configuration)

#### Optional: Caching-specific

| Environment                               | Default | Description                                        |
| ----------------------------------------- | ------- | -------------------------------------------------- |
| `OPENAI_CACHE_LOG_ENTRIES`                | `false` | Enables logging of new cache entries.              |
| `OPENAI_CACHE_LOG_HITS`                   | `false` | Enables logging of cache hits.                     |
| `OPENAI_CACHE_LOG_MISSES`                 | `false` | Enables logging of cache misses.                   |
| `OPENAI_CACHE_LOG_PURGES`                 | `false` | Enables logging of cache entry expiration/purging. |
| `OPENAI_CACHE_MAX_ENTRIES`                | `1000`  | Maximum entries retained in each cache instance.   |
| `OPENAI_DESCRIBE_IMAGE_CACHE_TTL_HOURS`   | `24`    | Hours to cache image descriptions.                 |
| `OPENAI_PERSONA_CACHE_TTL_HOURS`          | `3`     | Hours to cache guild-wide user personas.           |
| `OPENAI_VOICE_TRANSCRIPT_CACHE_TTL_HOURS` | `24`    | Hours to cache voice message transcriptions.       |

[:arrow_up: Back to top](#configuration)

## Deployment

The published image supports `amd64` and `arm64` and is available from [GitHub Container Registry](https://github.com/jlyons210/botc/pkgs/container/botc). The examples pin version `0.26.0`; change the tag when upgrading.

### Docker

Create a local `botc.env` file with the required credentials and any optional settings. Keep it out of source control:

```dotenv
DISCORD_BOT_TOKEN=your-discord-bot-token
OPENAI_API_KEY=your-openai-api-key
OPENAI_PROMPT_BOT_BEHAVIOR=You are a humorous British cat chatbot. Use occasional cat sounds to add personality.
```

Start the container with:

```sh
docker run --detach \
  --name botc \
  --restart unless-stopped \
  --env-file ./botc.env \
  ghcr.io/jlyons210/botc:0.26.0
```

Docker pulls the image automatically when it is not already available locally.

### Kubernetes

Create a namespace and a Kubernetes Secret for the required credentials. Keep credential files out of source control:

```sh
kubectl create namespace discord-bots
kubectl create secret generic botc \
  --namespace discord-bots \
  --from-file=DISCORD_BOT_TOKEN=./discord-bot-token \
  --from-file=OPENAI_API_KEY=./openai-api-key
```

Add `BRAVE_API_KEY` or `ELEVENLABS_API_KEY` to the Secret only when enabling the corresponding optional feature. The `ENABLE_AI_GROUNDING` and `ENABLE_VOICE_RESPONSE` settings can also be set there.

Run one replica. The `Recreate` strategy prevents the old and new pods from handling messages at the same time during an update.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: botc
  namespace: discord-bots
spec:
  replicas: 1
  strategy:
    type: Recreate
  selector:
    matchLabels:
      app: botc
  template:
    metadata:
      labels:
        app: botc
    spec:
      containers:
        - name: botc
          image: ghcr.io/jlyons210/botc:0.26.0
          imagePullPolicy: IfNotPresent
          envFrom:
            - secretRef:
                name: botc
          env:
            - name: OPENAI_PROMPT_BOT_BEHAVIOR
              value: >
                You are a humorous British cat chatbot. You say 'meow' and make other cat sounds often
                in your responses, to remind users that you are a cat. Don't let them forget that you
                are a cat.
```

Apply the manifest with `kubectl apply -f deployment.yml`.

[:arrow_up: Back to top](#configuration)
