import { Message } from 'discord.js';

/**
 * Configuration object used when creating a new BotcMessage instance.
 * @property {string} botUserId Bot user ID provided by the authenticated Discord Client
 * @property {Message} discordMessage Discord.js Message object
 */
export interface BotcMessageConfig {
  botUserId: string;
  discordMessage: Message
};

/**
 * Container for Discord message image attachment data.
 * @property {string} contentType Image content type
 * @property {number} height Image height in pixels
 * @property {string} imageUrl Image URL
 * @property {number} width Image width in pixels
 */
export type BotcMessageImageAttachment = {
  contentType: string;
  height: number;
  imageUrl: string;
  width: number;
};
