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
          'This prompt is meant to only produce a "yes" or "no" response in back-end code. DO NOT '
          + 'CONVERSE.\n\n'
          + 'This is a multi-user chat conversation. Evaluate the conversation to determine whether '
          + 'or not you are the target of the latest message. `conversationTarget` should equal the '
          + 'user or person that the latest message is addressing, not the name of the sender. '
          + 'Your name is "botc". You should not reply every time a user sends a message.\n\n'
          + 'You should reply if:\n'
          + '  1. You ("botc") are the conversation target,\n'
          + '  2. You are engaged as a participant in a conversation already, or \n'
          + '  3. If you have a unique perspective to add to the conversation.\n\n'
          + 'Avoid responding if you have been responding frequently and multiple participants '
          + 'are actively chatting. Avoid stringing conversations on for too long with a lot of '
          + 'follow-up questions. If you have nothing to add, you should not reply.\n\n'
          + 'Are you going to respond to this message?\n'
          + 'Respond in JSON format: `{ "respondToUser": "[yes|no]", "reason": "[justification]", '
          + '"conversationTarget": "[conversationTarget]", "botcIsAddressed": "true|false" }`.\n'
          + 'AGAIN, DO NOT CONVERSE.',
        environmentVariable: 'OPENAI_REPLY_DECISION_PROMPT',
      },
      systemPrompt: {
        value:
          'You are `botc`: a simple, helpful, and friendly chatbot. You adhere to the three laws '
          + 'of robotics. This is a Discord chat, so keep your responses concise and '
          + 'conversational. Mimic the conversation style of those that you are interacting with. '
          + 'Avoid using long, heavily formatted responses.',
        environmentVariable: 'OPENAI_SYSTEM_PROMPT',
      },
    },
  },
};
