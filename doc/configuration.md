# Configuration

Configuration is achieved through environment variables, which are easily configured for container deployments.

## Contents

- [Required](#required-settings)
- [Optional](#optional)
  - [Caching-specific](#optional-caching-specific)

[:arrow_left: Back to README.md](/README.md)

### Required

| Environment | Default | Description |
|---|---|---|
| `DISCORD_BOT_TOKEN` | N/A | Your [Discord Developer Portal](https://discord.com/developers/applications) bot token. |
| `OPENAI_API_KEY` | N/A | Your [OpenAI platform](https://platform.openai.com/settings/) API key. |

[:arrow_up: Back to top](#configuration)

### Optional

| Environment | Default | Description |
| --- | --- | --- |
| `DISCORD_CHANNEL_HISTORY_HOURS` | `24` | Number of hours of past messsages to ingest for conversation context. |
| `OPENAI_DESCRIBE_IMAGE_PROMPT` | [Source](https://github.com/jlyons210/botc/blob/main/src/Botc/Configuration/Configuration.defaults.ts) | Prompt used to describe attached images. |
| `OPENAI_MAX_RETRIES` | `3` | Number of OpenAI API retries on retriable errors. |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI model to use for chat completions. |
| `OPENAI_REPLY_DECISION_PROMPT` | [Source](https://github.com/jlyons210/botc/blob/main/src/Botc/Configuration/Configuration.defaults.ts) | Prompt used to reason whether or not the bot should engage in conversation. |
| `OPENAI_SYSTEM_PROMPT` | [Source](https://github.com/jlyons210/botc/blob/main/src/Botc/Configuration/Configuration.defaults.ts) | Behavioral prompt to set the overall bot behavior. |
| `OPENAI_TIMEOUT` | `15000` | Milliseconds to wait for OpenAI API response. |

[:arrow_up: Back to top](#configuration)

#### Optional: Caching-specific
| Environment | Default | Description |
| --- | --- | --- |
| `OPENAI_DESCRIBE_IMAGE_CACHE_TTL_HOURS` | `24` | Number of hours to cache image descriptions (optimizes API polling). |
| `OPENAI_CACHE_LOG_ENTRIES` | `false` | Enables logging of new cache entries. |
| `OPENAI_CACHE_LOG_HITS` | `false` | Enables logging of cache hits. |
| `OPENAI_CACHE_LOG_MISSES` | `false` | Enables logging of cache misses. |
| `OPENAI_CACHE_LOG_PURGES` | `false` | Enables logging of cache entry expiration/purging. |
| `OPENAI_PERSONA_CACHE_TTL_HOURS` | `3` | Number of hours to cache server-wide user personas (optimizes API polling). |

[:arrow_up: Back to top](#configuration)
