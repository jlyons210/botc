import { Message } from 'discord.js';

/**
 * Configuration object used when creating a new BotcMessage instance.
 */
export interface BotcMessageConfig {
  /**
   * Discord.js Message object
   */
  message: Message

  /**
   * Bot user ID provided by the Discord Client object once authenticated.
   */
  botUserId: string;
};

/**
 * Container for Discord message image attachment data.
 */
export type BotcMessageImageAttachment = {
  /**
   * Image content type
   */
  contentType: string;

  /**
   * Image height in pixels
   */
  height: number;

  /**
   * Base64 encoded image data
   */
  imageBase64?: string;

  /**
   * Image URL
   */
  imageUrl: string;

  /**
   * Image width in pixels
   */
  width: number;
};

export type BotcMessageType =
  'AtMention'
  | 'BotMessage'
  | 'ChannelMessage'
  | 'DirectMessage'
  | 'OwnMessage';
