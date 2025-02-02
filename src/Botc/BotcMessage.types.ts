import { Message } from 'discord.js';

/**
 * BotcMessageConfig:
 * Configuration object used when creating a new BotcMessage instance.
 * @interface
 * @property {Message} message Discord.js Message object
 * @property {string} botUserId Bot user ID provided by the Discord Client object once authenticated.
 */
export interface BotcMessageConfig {
  message: Message
  botUserId: string;
};

export type BotcMessageImageAttachment = {
  contentType: string;
  height: number;
  imageBase64?: string;
  imageUrl: string;
  width: number;
};

export type BotcMessageType = 'BotMessage' | 'ChannelMessage' | 'DirectMessage' | 'OwnMessage';
