import { ConfigurationOptions } from './index.js';

export const ConfigurationDefaults: ConfigurationOptions = {

  /**
   * Clients configuration
   */
  clients: {

    /**
     * Discord client configuration
     */
    discord: {

      /**
       * Number of hours to look back in channel history
       * for messages to process as conversation context.
       */
      channelHistoryHours: {
        environmentVariable: 'DISCORD_CHANNEL_HISTORY_HOURS',
        value: 24,
      },

      /**
       * Number of messages to fetch from each channel
       * when processing channel history.
       */
      channelHistoryMessages: {
        environmentVariable: 'DISCORD_CHANNEL_HISTORY_MESSAGES',
        value: 100,
      },

      /**
       * Number of times to retry Discord APIs before giving up.
       * Retry interval is `1 second * retry count`.
       */
      maxDiscordRetries: {
        environmentVariable: 'DISCORD_MAX_RETRIES',
        value: 5,
      },

      /**
       * Discord bot token, used to authenticate with Discord API
       */
      token: {
        environmentVariable: 'DISCORD_BOT_TOKEN',
        secret: true,
        value: '',
      },

    },

  },

  /**
   * Debug logging configuration
   */
  debugLoggingEnabled: {
    environmentVariable: 'DEBUG_LOGGING_ENABLED',
    value: false,
  },

  /**
   * LLMS configuration
   */
  llms: {

    /**
     * ElevenLabs configuration
     */
    elevenlabs: {

      /**
       * ElevenLabs API key, used to authenticate with ElevenLabs API
       */
      apikey: {
        environmentVariable: 'ELEVENLABS_API_KEY',
        secret: true,
        value: '',
      },

      /**
       * ElevenLabs model ID, used to generate speech from text
       */
      modelId: {
        environmentVariable: 'ELEVENLABS_MODEL_ID',
        options: [
          'eleven_flash_v2_5',
          'eleven_multilingual_v2',
        ],
        value: 'eleven_multilingual_v2',
      },

      /**
       * ElevenLabs voice ID, used to generate speech
       */
      voiceId: {
        environmentVariable: 'ELEVENLABS_VOICE_ID',
        value: 'oR4uRy4fHDUGGISL0Rev',
      },

    },

    /**
     * OpenAI configuration
     */
    openai: {

      /**
       * OpenAI API key, used to authenticate with OpenAI API
       */
      apikey: {
        environmentVariable: 'OPENAI_API_KEY',
        secret: true,
        value: '',
      },

      /**
       * OpenAI cache configuration
       */
      caching: {

        /**
         * Time-to-live for image descriptions in cache in hours
         */
        describeImageCacheTtlHours: {
          environmentVariable: 'OPENAI_DESCRIBE_IMAGE_CACHE_TTL_HOURS',
          value: 24,
        },

        /**
         * OpenAI cache logging configuration
         */
        logging: {

          /**
           * Log new cache entries
           */
          logCacheEntries: {
            environmentVariable: 'OPENAI_CACHE_LOG_ENTRIES',
            value: false,
          },

          /**
           * Log cache hits
           */
          logCacheHits: {
            environmentVariable: 'OPENAI_CACHE_LOG_HITS',
            value: false,
          },

          /**
           * Log cache misses
           */
          logCacheMisses: {
            environmentVariable: 'OPENAI_CACHE_LOG_MISSES',
            value: false,
          },

          /**
           * Log cache purges
           */
          logCachePurges: {
            environmentVariable: 'OPENAI_CACHE_LOG_PURGES',
            value: false,
          },

        },

        /**
         * Time-to-live for persona cache in hours
         */
        personaCacheTtlHours: {
          environmentVariable: 'OPENAI_PERSONA_CACHE_TTL_HOURS',
          value: 3,
        },

        /**
         * Time-to-live for voice transcript cache in hours
         */
        voiceTranscriptCacheTtlHours: {
          environmentVariable: 'OPENAI_VOICE_TRANSCRIPT_CACHE_TTL_HOURS',
          value: 24,
        },

      },

      /**
       * Used in OpenAIClient to describe images
       */
      describeImagePrompt: {
        environmentVariable: 'OPENAI_DESCRIBE_IMAGE_PROMPT',
        value: [
          'Describe this image in reasonable detail. Do not use line breaks. If the image is ',
          'unclear, do your best. You are not being asked to identify individuals.',
        ].join(''),
      },

      /**
       * Maximum number of retries for OpenAI API requests
       */
      maxRetries: {
        environmentVariable: 'OPENAI_MAX_RETRIES',
        value: 3,
      },

      /**
       * OpenAI model to use for chat completions
       */
      model: {
        environmentVariable: 'OPENAI_MODEL',
        options: [
          'gpt-4o',
          'gpt-4o-mini',
        ],
        value: 'gpt-4o-mini',
      },

      promptBotBehavior: {
        environmentVariable: 'OPENAI_PROMPT_BOT_BEHAVIOR',
        value: 'Respond to users using their preferred name or playful variations. ',
      },

      /**
       * Used in OpenAIClient to determine whether or not to respond to a message
       */
      replyDecisionPrompt: {
        environmentVariable: 'OPENAI_REPLY_DECISION_PROMPT',
        value: [
          'This prompt is meant to only produce a "yes" or "no" response in back-end code. DO NOT ',
          'CONVERSE.\n\n',
          'This is a multi-user chat conversation. Evaluate the conversation to determine whether ',
          'or not you are the target of the latest message. `conversationTarget` should equal the ',
          'user or person that the latest message is addressing, not the name of the sender. ',
          'Your name is "botc". You should not reply every time a user sends a message.\n\n',
          'You SHOULD reply if:\n',
          '  1. You are addressed by your name: "botc", or\n',
          '  2. The latest responses are implicitly directed toward you, or \n',
          '  3. You are not specifically the target, but you have a unique perspective to add to ',
          '     the conversation.\n\n',
          'Avoid responding if you have been responding frequently and other participants are ',
          'actively chatting. Avoid stringing conversations on for too long with a lot of ',
          'follow-up questions. If you have nothing to add, you should not reply.\n\n',
          'Are you going to respond to this message?\n',
          'Respond in JSON format: `{ "respondToUser": "[yes|no]", "reason": "[justification]", ',
          '"conversationTarget": "[conversationTarget]", "botcIsAddressed": "true|false" }`.\n',
          'AGAIN, DO NOT CONVERSE. DO NOT USE MARKDOWN FORMATTING.',
        ].join(''),
      },

      /**
       * OpenAI system prompt to use for chat completions
       */
      systemPrompt: {
        environmentVariable: 'OPENAI_SYSTEM_PROMPT',
        value: [
          'Your name is "botc". You are a simple, helpful, and friendly chatbot.',
          'You adhere to the three laws of robotics. ',
          'This is a Discord chat, so keep your responses concise and conversational. ',
          'Mimic the conversation style of those that you are interacting with. ',
          'Avoid using long, heavily formatted responses. ',
          'Do not repeat back any metadata enclosed in angle brackets. ',
          'Do not include metadata blocks in your responses.\n\n',
          '<Behaviors>\n',
          'You may answer questions about yourself/your code - here are some details:\n',
          '  - Bot name: {{botName}}\n',
          '  - Bot version: {{botVersion}}\n',
          '  - OpenAI model: {{openAIModel}}\n',
          '  <User-defined behaviors>\n',
          '    - {{promptBotBehavior}}\n',
          '  </User-defined behaviors>\n',
          '</Behaviors>',
        ].join(''),
      },

      /**
       * OpenAI API request timeout in milliseconds
       */
      timeout: {
        environmentVariable: 'OPENAI_TIMEOUT',
        value: 600000,
      },

    },

  },

};
