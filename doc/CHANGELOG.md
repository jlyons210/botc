# Changelog

## Releases

## Pre-release

- 0.4.x: [0.4.0](#040-2024-02-02)
- 0.3.x: [0.3.0](#030-2024-02-01), [0.3.1](#031-2024-02-02)
- 0.2.x: [0.2.0](#020-2024-01-26)
- 0.1.x: [0.1.0](#010-2024-01-24)

---
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