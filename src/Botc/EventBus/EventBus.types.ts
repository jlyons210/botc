import { BotcMessage } from '../index.js';

/**
 * EventMap is a map of event names to their payload types
 */
export interface EventMap {

  // Client ready events

  'DiscordClient:Ready': {
    message: string,
  };

  'ElevenLabsClient:Ready': {
    message: string,
  };

  'OpenAIClient:Ready': {
    message: string,
  };

  // Application events

  'Botc:ResponseComplete': {
    channelId: string,
    content: string,
    filenames: string[],
  };

  'DiscordClient:IncomingMessage': {
    message: BotcMessage,
  };

  'DiscordClient:StartTyping': {
    channelId: string,
  };
};
