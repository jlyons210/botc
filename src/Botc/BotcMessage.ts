import {
  BotcMessageConfig,
  BotcMessageImageAttachment,
  BotcMessageType,
} from '../Botc/index.js';

import { ChannelType, Message } from 'discord.js';
import { EventBus } from './EventBus/index.js';

/**
 * **BotcMessage** A wrapper for Discord.js Message objects that provides additional properties and
 * methods for interacting with the message.
 * @class
 * @todo
 * - The `content` getter should only ever return the original message content.
 * - Other message metadata should be appended to `content`, and stored in appropriate arrays.
 *   - `createdTimestamp` should be appended to `content` as metadata.
 *   - `imageDescriptions` should be appended to `content` as metadata.
 * - A `getPromptContent` function could be added to return `content` with appended metadata.
 */
export class BotcMessage {
  // Private objects
  private globalEvents = EventBus.attach();

  // Private properties
  private readonly message: Message;
  private readonly botUserId: string;

  // Private backing variables
  private _attachedImages: BotcMessageImageAttachment[] = [];
  private _imageDescriptions: string[] = [];
  private _nameSanitized!: string;

  /**
   * New BotcMessage
   * @param {BotcMessageConfig} config BotcMessageConfig object
   */
  constructor(config: BotcMessageConfig) {
    this.message = config.message;
    this.botUserId = config.botUserId;
  }

  /**
   * Add a description for an image attached to the message
   * @param {string} description Image description
   */
  public addImageDescription(description: string): void {
    this._imageDescriptions.push(description);
  }

  /**
   * Populates a collection of image attachments with metadata from the message
   * @returns {BotcMessageImageAttachment[]} Collection of image attachments
   * @readonly
   */
  public get attachedImages(): BotcMessageImageAttachment[] {
    if (this._attachedImages.length === 0) {
      /**
       * Allowed content types for image attachments per the OpanAI API
       * [Vision FAQ](https://platform.openai.com/docs/guides/vision#faq)
       */
      const allowedContentTypes = [
        'image/gif',
        'image/jpeg',
        'image/png',
        'image/webp',
      ];

      // Assign any image attachments to the backing variable
      this._attachedImages = this.message.attachments

        // Filter for allowed content types
        .filter(attachment =>
          attachment.contentType && allowedContentTypes.includes(attachment.contentType),
        )

        // Map matches to backing variable
        .map(attachment => ({
          contentType: attachment.contentType as string,
          height: attachment.height as number,
          imageUrl: attachment.url,
          width: attachment.width as number,
        }));
    }

    return this._attachedImages;
  }

  /**
   * Message channel ID
   * @returns {string} Channel ID
   * @readonly
   */
  public get channelId(): string {
    return this.message.channel.id;
  }

  /**
   * Message content
   * @returns {string} string
   * @readonly
   */
  public get content(): string {
    return (this.imageDescriptions)
      ? `${this.message.content}\n${this.imageDescriptions}`
      : this.message.content;
  }

  /**
   * Message created timestamp
   * @returns {number} number
   * @readonly
   */
  public get createdTimestamp(): number {
    return this.message.createdTimestamp;
  }

  /**
   * Message author display name. Falls back to username if no display name is available.
   * @returns {string} Display name or username
   * @readonly
   */
  public get displayName(): string {
    return this.message.member?.displayName || this.username;
  }

  /**
   * Returns true if the message has any attachments
   * @returns {boolean} boolean
   * @readonly
   */
  public get hasAttachedImages(): boolean {
    return this.attachedImages.length > 0 || this.originalMessage.attachments.size > 0;
  }

  /**
   * Description of the images attached to the message
   * @returns {string} Joined image descriptions
   * @readonly
   */
  public get imageDescriptions(): string {
    if (this._imageDescriptions.length) {
      return [
        'Description of attached images:',
        ...this._imageDescriptions,
      ].join('\n');
    }
    else {
      return '';
    }
  }

  /**
   * Message author username (sanitized) used by the OpenAI prompt username field.
   * @returns {string} string
   * @readonly
   * @todo Rename to `promptUsername`
   */
  public get nameSanitized(): string {
    if (!this._nameSanitized) {
      this._nameSanitized = this.message.author.username.replace(/[^a-zA-Z0-9_-]/g, '-');
    }
    return this._nameSanitized;
  }

  /**
   * Original Discord message
   * @returns {Message} Original Discord.js Message object
   */
  public get originalMessage(): Message {
    return this.message;
  }

  /**
   * Message role used by the OpenAI prompt role field.
   * @returns {string} string
   * @readonly
   * @todo Rename to `promptRole`
   */
  public get role(): string {
    return (this.botUserId === this.message.author.id)
      ? 'assistant'
      : 'user';
  }

  /**
   * Discord message type
   * @returns {BotcMessageType} Type of message being processed
   * @readonly
   */
  public get type(): BotcMessageType {
    switch (true) {
      // Incoming message from this bot
      case (this.message.author.id === this.botUserId):
        return 'OwnMessage';

      // Incoming direct message
      case (this.message.channel.type === ChannelType.DM):
        return 'DirectMessage';

      // Incoming message from another bot
      case (this.message.author.bot):
        return 'BotMessage';

      // Any other channel message
      default:
        return 'ChannelMessage';
    }
  }

  /**
   * Message author username
   * @returns {string} Username (not displayname)
   * @readonly
   */
  public get username(): string {
    return this.message.author.username;
  }
}
