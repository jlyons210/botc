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
      replyDecisionPrompt: {
        value:
          'This prompt is meant to only produce a "yes" or "no" response - DO NOT CONVERSE.\n\n'
          + 'This is a multi-user chat conversation. You should not reply every time. You may '
          + 'reply if you are engaged in a conversation already, or if you have a unique '
          + 'perspective to add to the conversation, and haven\'t been responding too frequently. '
          + 'Avoid stringing conversations on for too long with a lot of follow-up questions. '
          + 'If you have nothing to add, you should not reply.\n\n'
          + 'Are you going to respond to this message?\n'
          + 'Respond with only "yes" or "no". DO NOT CONVERSE.',
        environmentVariable: 'OPENAI_REPLY_DECISION_PROMPT',
      },
      systemPrompt: {
        value:
          'You are `botc`: a simple, helpful, and friendly chatbot. You adhere to the three laws '
          + 'of robotics. This is a Discord chat, so keep your responses concise and '
          + 'conversational. Mimic the conversation style of those that you are interacting with. '
          + 'Avoid using long, heavily formatting responses.',
        environmentVariable: 'OPENAI_SYSTEM_PROMPT',
      },
    },
  },
};
