# Botc

**Botc** is a Discord bot that currently uses the OpenAI API for prompt completions. It may be extended to support other APIs and local LLMs in the future.

**Botc** is written in TypeScript for Node.js. It runs as a Discord bot, using [Discord.js](https://github.com/discordjs/discord.js), and the [openai-node](https://github.com/openai/openai-node) SDK. I use GitHub Actions to publish new container images to GHCR on `main` branch merges.

**Botc** pulls together things I've learned over a couple of [previous Discord bot projects](#history) as well as advancements in how developers utilize LLMs, and is an ambitious attempt to make large iterations on those learnings.

Unlike [dbob](#discord-bot-ol-bootsie-dbob), which requires @-mentions, replies, or a dice roll to determine whether the bot should engage with users, **Botc** monitors conversations and uses a [reasoning prompt](#optional) to decide whether it would be appropriate to engage.

My intent is for **Botc** to engage with chat users in a more human-like fashion. 

## Contents

- [Features](#features)
- [Roadmap](#roadmap)
- [Configuration](#configuration)
- [History](#history)
- [License](#license)

## Features

- Monitors channels for active conversations, engaging automatically when a reasoning prompt determines that it would be appropriate.
- Bot builds a server-wide persona of users being engaged to enhance responses. This will need caching to mitigate heavy Discord API polling.
- Examine and comprehend user images attachments.

[View Changelog](doc/CHANGELOG.md)

## Roadmap

- Timer for responding if no other users are active in chat.
- User summary/persona caching
- Examine and comprehend user attachments (audio) and crawl hyperlinks.
- Image generation using DALL-E 3.
- Perform web research on topics before responding, responding with citations.

## Configuration

Configuration is achieved through environment variables, which are also easily passed to container deployments.

### Required

| Environment | Default | Description |
|---|---|---|
|`DISCORD_BOT_TOKEN`| N/A |Your [Discord Developer Portal](https://discord.com/developers/applications) bot token.|
|`OPENAI_API_KEY`| N/A |Your [OpenAI platform](https://platform.openai.com/settings/) API key.|

### Optional

| Environment | Default | Description |
|---|---|---|
|`DISCORD_CHANNEL_HISTORY_HOURS` | `1` | Number of hours of past messsages to ingest for conversation context. |
|`OPENAI_DESCRIBE_IMAGE_PROMPT` | [Source](https://github.com/jlyons210/botc/blob/main/src/Botc/Configuration/Configuration.defaults.ts) | Prompt used to describe attached images. |
| `OPENAI_MAX_RETRIES` | `6` | Number of OpenAI API retries on retriable errors. |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI model to use for chat completions. |
| `OPENAI_REPLY_DECISION_PROMPT` | [Source](https://github.com/jlyons210/botc/blob/main/src/Botc/Configuration/Configuration.defaults.ts) | Prompt used to reason whether or not the bot should engage in conversation. |
| `OPENAI_SYSTEM_PROMPT` | [Source](https://github.com/jlyons210/botc/blob/main/src/Botc/Configuration/Configuration.defaults.ts) | Behavioral prompt to set the overall bot behavior. |
| `OPENAI_TIMEOUT` | `15000` | Milliseconds to wait for OpenAI API response. |

## History

`Botc` supercedes my prior Discord bots:

### [discord-bot-ol-bootsie](https://github.com/jlyons210/discord-bot-ol-bootsie) (dbob)

Dbob was developed in early 2023 as I was learning both TypeScript and how to interface with LLMs. It was actively developed for about 18 months, and is now in maintenance mode.

#### 💡 Trivia
> I'll point out that `botc` and `bootsie` have similar phonetics. Bootsie was one of my cats that passed away about 10 years ago. I run two instances of `dbob` using personas of my cats Boots and Manky. `dbob` was eventually containerized, and is a bot-container. Botc. There you have it :smile_cat:

### [envoy-ai](https://github.com/jlyons210/envoy-ai-interest) (incomplete proof-of-concept, archived)

Envoy-ai was a proof-of-concept project that I started in late 2023. I wanted to re-develop `dbob` using an event-based architecture. It was fairly over-engineered, but I am more proud of the code than I was with `dbob`, but it was very incomplete and abandoned after about three months.

## License

Distributed under the UNLICENSE license. See `LICENSE` for more information.

