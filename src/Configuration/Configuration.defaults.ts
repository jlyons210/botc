import { ConfigurationOptions } from './index.js';

export const ConfigurationDefaults: ConfigurationOptions = {
  clients: {
    discord: {
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
        value: '',
        environmentVariable: 'OPENAI_API_KEY',
        secret: true,
      },
      model: {
        value: 'gpt-4o-mini',
        environmentVariable: 'OPENAI_MODEL',
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
