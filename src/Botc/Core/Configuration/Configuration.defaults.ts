import { ConfigurationOptions } from './index.js';

export const ConfigurationDefaults: ConfigurationOptions = {
  clients: {
    discord: {
      channelHistoryHours: {
        value: 1,
        environmentVariable: 'DISCORD_CHANNEL_HISTORY_HOURS',
      },
      token: {
        value: '',
        environmentVariable: 'DISCORD_BOT_TOKEN',
        secret: true,
      },
    },
  },
  llms: {
    openai: {
      apikey: {
        environmentVariable: 'OPENAI_API_KEY',
        secret: true,
        value: '',
      },
      model: {
        environmentVariable: 'OPENAI_MODEL',
        options: [
          'gpt-4o',
          'gpt-4o-mini',
        ],
        value: 'gpt-4o-mini',
      },
      systemPrompt: {
        value:
          'You are a simple, helpful, and friendly chatbot. You adhere to the three laws of '
          + 'robotics.',
        environmentVariable: 'OPENAI_SYSTEM_PROMPT',
      },
    },
  },
};
