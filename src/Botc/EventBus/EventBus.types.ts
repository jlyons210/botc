import { AttachmentBuilder } from 'discord.js';
import { BotcMessage } from '../index.js';

/**
 * EventMap is a map of event names to their payload types
 */
export interface EventMap {
  'DiscordClient:Ready': {
    message: string,
  };

  'ElevenLabsClient:Ready': {
    message: string,
  };

  'OpenAIClient:Ready': {
    message: string,
  };

  'Botc:ResponseComplete': {
    channelId: string,
    content: string,
    attachments: AttachmentBuilder[],
  };

  'DiscordClient:IncomingMessage': {
    message: BotcMessage,
  };

  'DiscordClient:StartTyping': {
    channelId: string,
  };
};
