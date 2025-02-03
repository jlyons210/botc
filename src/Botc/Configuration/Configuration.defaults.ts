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
   * LLMS configuration
   */
  llms: {

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
       * Time-to-live for image descriptions in cache in hours
       */
      describeImageCacheTtlHours: {
        environmentVariable: 'OPENAI_DESCRIBE_IMAGE_CACHE_TTL_HOURS',
        value: 24,
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
          'You should reply if:\n',
          '  1. You ("botc") are the conversation target,\n',
          '  2. You are engaged as a participant in a conversation already, or \n',
          '  3. If you have a unique perspective to add to the conversation.\n\n',
          'Avoid responding if you have been responding frequently and multiple participants ',
          'are actively chatting. Avoid stringing conversations on for too long with a lot of ',
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
          'You are `botc`: a simple, helpful, and friendly chatbot. You adhere to the three laws ',
          'of robotics. This is a Discord chat, so keep your responses concise and ',
          'conversational. Mimic the conversation style of those that you are interacting with. ',
          'Avoid using long, heavily formatted responses. Do not repeat back any metadata ',
          'enclosed in angle brackets.',
        ].join(''),
      },

      /**
       * OpenAI API request timeout in milliseconds
       */
      timeout: {
        environmentVariable: 'OPENAI_TIMEOUT',
        value: 15000,
      },

    },

  },

};
