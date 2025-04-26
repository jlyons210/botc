# Botc

**Botc** is a Discord bot that currently uses the OpenAI API for prompt completions. It may be extended to support other APIs and local LLMs in the future.

**Botc** is written in TypeScript for Node.js. It runs as a Discord bot, using [Discord.js](https://github.com/discordjs/discord.js), and the [openai-node](https://github.com/openai/openai-node) SDK. I use GitHub Actions to publish new container images to GHCR on `main` branch merges.

**Botc** pulls together things I've learned over a couple of [previous Discord bot projects](#history) as well as advancements in how developers utilize LLMs, and is an ambitious attempt to make large iterations on those learnings.

Unlike [dbob](#discord-bot-ol-bootsie-dbob), which requires @-mentions, replies, or a dice roll to determine whether the bot should engage with users, **Botc** monitors conversations and uses a [decision prompt](doc/configuration.md#optional) to decide whether it would be appropriate to engage.

My intent is for **Botc** to engage with chat users in a more human-like fashion. 

![Wise, learned botc](assets/botc-profile.png)

## Contents

- [Features](#features)
- [Roadmap](#roadmap)
- [Configuration](#configuration)
- [History](#history)
- [License](#license)

## Features

- Monitors channels for active conversations, engaging automatically when a reasoning prompt determines that it would be appropriate.
- Responds to replies, @-mentions, and direct messages, and the bot will respond to replies to old messages using the expected context.
- Bot builds a guild-wide persona of users being engaged to enhance responses. Personas are cached to limit API polling.
- Examine and comprehend user image attachments and voice messages. Image descriptions and transcriptions are cached to limit API polling.
- Responds to voice messages using voice - generated using text-to-speech from ElevenLabs.
- Produce and edit images using the OpenAI `gpt-image-1` model.
- System/developer prompts and individual messages have a metadata section that enables richer bot responses.

[View Changelog](doc/CHANGELOG.md)

## Roadmap

- Follow hyperlinks and summarize pages into conversation context.
- Timer for responding if no other users are active in chat.
- Perform web research on topics before responding, responding with citations.

## Configuration

Configuration is achieved through environment variables, which are easily configured for container deployments. Detailed documentation [here](doc/configuration.md).

## History

**Botc** supercedes my prior Discord bots:

### [discord-bot-ol-bootsie](https://github.com/jlyons210/discord-bot-ol-bootsie) (dbob)

Dbob was developed in early 2023 as I was learning both TypeScript and how to interface with LLMs. It was actively developed for about 18 months, and is now in maintenance mode.

#### 💡 Trivia
> I'll point out that `botc` and `bootsie` have similar phonetics. Bootsie was one of my cats that passed away about 10 years ago. I run two instances of `dbob` using personas of my cats Boots and Manky. `dbob` was eventually containerized, and is a bot-container. Botc. There you have it :smile_cat:

### [envoy-ai](https://github.com/jlyons210/envoy-ai-interest) (incomplete proof-of-concept, archived)

Envoy-ai was a proof-of-concept project that I started in late 2023. I wanted to re-develop `dbob` using an event-based architecture. It was fairly over-engineered, but I am more proud of the code than I was with `dbob`, but it was very incomplete and abandoned after about three months.

## License

Distributed under the UNLICENSE license. See `LICENSE` for more information.

