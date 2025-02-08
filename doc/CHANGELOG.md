# Changelog

## Releases

## Pre-release

- 0.12.x: [0.12.0](#0120-2024-02-07)
- 0.11.x: [0.11.0](#0110-2024-02-07), [0.11.1](#0111-2024-02-07)
- 0.10.x: [0.10.0](#0100-2024-02-07)
- 0.9.x: [0.9.0](#090-2024-02-06)
- 0.8.x:
    [0.8.0](#080-2024-02-04),
    [0.8.1](#081-2024-02-05),
    [0.8.2](#082-2024-02-05),
    [0.8.3](#083-2024-02-06),
    [0.8.4](#084-2024-02-06),
    [0.8.5](#085-2024-02-06)
- 0.7.x: [0.7.0](#070-2024-02-04)
- 0.6.x: [0.6.0](#060-2024-02-03)
- 0.5.x: [0.5.0](#050-2024-02-03)
- 0.4.x: [0.4.0](#040-2024-02-02)
- 0.3.x:
    [0.3.0](#030-2024-02-01),
    [0.3.1](#031-2024-02-02)
- 0.2.x: [0.2.0](#020-2024-01-26)
- 0.1.x: [0.1.0](#010-2024-01-24)

---
## 0.12.0 (2024-02-07)
- Added voice response support using ElevenLabs text-to-speech API, as an MP3 attachment.
  - I would like to create a native voice response using Ogg/Opus, but the Discord API requires a hacky solution, and I'm not sure that Discord.js supports it.

[:arrow_up: Back to top](#changelog)

## 0.11.1 (2024-02-07)
- Added `OPENAI_VOICE_TRANSCRIPT_CACHE_TTL_HOURS` configuration setting.
- Fixed an error in ObjectCache class resulting in only one TTL setting being used.

[:arrow_up: Back to top](#changelog)

## 0.11.0 (2024-02-07)
- Bot can now comprehend voice messages (via transcription).

[:arrow_up: Back to top](#changelog)

## 0.10.0 (2024-02-07)
- Added `DISCORD_CHANNEL_HISTORY_MESSAGES` configuration setting.
- Resolve @-mention tags in message content to display names (if available) or usernames.
- Added Kubernetes deployment yaml example to configuration documentation.

[:arrow_up: Back to top](#changelog)

## 0.9.0 (2024-02-06)
- Bot intelligently handles replies to its messages. Replies, @-mentions, and direct messages will always get a bot response.

[:arrow_up: Back to top](#changelog)

## 0.8.5 (2024-02-06)
- Pre-fetch attached image descriptions as soon as they hit the channel.

[:arrow_up: Back to top](#changelog)

## 0.8.4 (2024-02-06)
- Fixed a fatal error handling DM conversations.
- Tuned system prompt to mitigate rare responses that include metadata blocks.

[:arrow_up: Back to top](#changelog)

## 0.8.3 (2024-02-06)
- Fixed a fatal error fetching messages from private channels that the bot is not a member of.

[:arrow_up: Back to top](#changelog)

## 0.8.2 (2024-02-05)
- Fixed ObjectCache configuration handling. Configuration of "false" (string) evaluated to true.

[:arrow_up: Back to top](#changelog)

## 0.8.1 (2024-02-05)
- Cleanup and performance tuning.

[:arrow_up: Back to top](#changelog)

## 0.8.0 (2024-02-04)
- Implemented an image resizer for images that are too large for Vision descriptions.

[:arrow_up: Back to top](#changelog)

## 0.7.0 (2024-02-04)
- Implemented a generic key-value cache.
- Deleted nearly-identical persona and image description cache implementations.
- Added configuration options for cache logging.

[:arrow_up: Back to top](#changelog)

## 0.6.0 (2024-02-03)
- Added "Preferred name: (Discord display name)" to message metadata for more personalized responses.
- Implemented a server-wide persona generation cache with TTL and automatic pruning.

[:arrow_up: Back to top](#changelog)

## 0.5.0 (2024-02-03)
- Implemented an image description cache with TTL and automatic pruning.

[:arrow_up: Back to top](#changelog)

## 0.4.0 (2024-02-02)
- Added metadata sections to system/developer prompt and chat messages provided to the chat API to enable passing of even more context, enabling more enriched responses.

[:arrow_up: Back to top](#changelog)

## 0.3.1 (2024-02-02)
- Refactor and cleanup

[:arrow_up: Back to top](#changelog)

## 0.3.0 (2024-02-01)
- Added attached image comprehension. It's still in early form with very rough caching that will eventually be a memory leak.

[:arrow_up: Back to top](#changelog)

## 0.2.0 (2024-01-26)

- Added server-wide user summary/persona for enhanced bot responses.
  - When bot decides it will engage, it polls all server channels and performs an LLM summary of the user's server-wide behavior. This is used to enrich the system prompt for the channel reply.

[:arrow_up: Back to top](#changelog)

## 0.1.0 (2024-01-24)

- Initial release with very basic chatbot functionality. Bot uses LLM reasoning to determine whether or not a reply is appropriate.

[:arrow_up: Back to top](#changelog)