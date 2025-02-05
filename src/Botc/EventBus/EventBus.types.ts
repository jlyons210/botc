import { BotcMessage } from '../index.js';
import { DiscordClient } from '../../Clients/Discord/DiscordClient.js';

/**
 * EventMap is a map of event names to their payload types
 */
export interface EventMap {
  'DiscordClient:IncomingMessage': {
    message: BotcMessage,
  };

  'DiscordClient:Ready': {
    message: string,
  };

  'MessagePipeline:IncomingMessage': {
    discordClient: DiscordClient,
    message: BotcMessage,
  };

  'MessagePipeline:Ready': {
    message: string,
  };

  'OpenAIClient:Ready': {
    message: string,
  };

  'OpenAIClient:ResponseComplete': {
    channelId: string,
    response: string,
  };

  'OpenAIClient:StartTyping': {
    channelId: string,
  };
};
