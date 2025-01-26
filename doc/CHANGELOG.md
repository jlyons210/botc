# Changelog

## Releases

## Pre-release

- 0.2.x: [0.2.0](#020-2024-01-26)
- 0.1.x: [0.1.0](#010-2024-01-24)

---

## 0.2.0 (2024-01-26)

- Added server-wide user summary/persona for enhanced bot responses.
  - When bot decides it will engage, it polls all server channels and performs an LLM summary of the user's server-wide behavior. This is used to enrich the system prompt for the channel reply.

[:arrow_up: Back to top](#changelog)

## 0.1.0 (2024-01-24)

- Initial release with very basic chatbot functionality. Bot uses LLM reasoning to determine whether or not a reply is appropriate.

[:arrow_up: Back to top](#changelog)