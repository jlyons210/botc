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
   * @deprecated
   * @todo Remove this property in favor of imageUrl
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

/**
 * BotcMessage message type
 */
export type BotcMessageType =

  /**
   * Message @-mentions this bot
   */
  'AtMention'

  /**
   * Message is from another bot
   */
  | 'BotMessage'

  /**
   * Message is a Discord channel message
   */
  | 'ChannelMessage'

  /**
   * Message is a direct message to the bot
   */
  | 'DirectMessage'

  /**
   * Message is from this bot
   */
  | 'OwnMessage'

  /**
   * Message is a voice message
   */
  | 'VoiceMessage';
