import { Message } from 'discord.js';

/**
 * Configuration object used when creating a new BotcMessage instance.
 * @param {string} botUserId Bot user ID provided by the authenticated Discord Client
 * @param {Message} discordMessage Discord.js Message object
 */
export interface BotcMessageConfig {
  botUserId: string;
  discordMessage: Message
};

/**
 * Container for Discord message image attachment data.
 * @param {string} contentType Image content type
 * @param {number} height Image height in pixels
 * @param {string} imageUrl Image URL
 * @param {number} width Image width in pixels
 */
export type BotcMessageImageAttachment = {
  contentType: string;
  height: number;
  imageUrl: string;
  width: number;
};
