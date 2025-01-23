import { BotcMessage } from '../index.js';

/**
 * EventMap is a map of event names to their payload types
 */
export interface EventMap {
  'DiscordClient:Ready': {
    message: string,
  };

  'DiscordClient:IncomingMessage': {
    message: BotcMessage,
  };

  'MessagePipeline:IncomingMessage': {
    messageHistory: BotcMessage[],
  };

  'OpenAIClient:ResponseComplete': {
    channelId: string,
    response: string,
  };
};
