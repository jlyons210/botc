import {
  BotcMessageConfig,
  BotcMessageImageAttachment,
  BotcMessageType,
} from '../Botc/index.js';

import { ChannelType, Message } from 'discord.js';
import { EventBus } from './EventBus/index.js';

/**
 * A wrapper for Discord.js Message objects that provides additional properties and methods for
 * interacting with the message.
 */
export class BotcMessage {
  private globalEvents = EventBus.attach();
  private readonly message: Message;
  private readonly botUserId: string;
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
   * Get the content of the message for the OpenAI prompt
   * @returns {string} Prompt content
   */
  private getPromptContent(): string {
    const imageDescriptions = this.hasAttachedImages
      ? `Image descriptions:\n${this.imageDescriptions.join('\n---\n')}`
      : undefined;

    const createTimestampLocal = new Date(this.createdTimestamp).toLocaleString('en-US', {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    const promptContent = [
      this.content,
      `<Message Metadata>`,
      `Preferred name: ${this.displayName}`,
      `Message timestamp: ${createTimestampLocal}`,
      imageDescriptions,
      `</Message Metadata>`,
    ].join('\n');

    return promptContent;
  }

  /**
   * Populates a collection of image attachments with metadata from the message
   * @returns {BotcMessageImageAttachment[]} Collection of image attachments
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
   */
  public get channelId(): string {
    return this.message.channel.id;
  }

  /**
   * Message content
   * @returns {string} string
   */
  public get content(): string {
    return this.message.content;
  }

  /**
   * Message created timestamp
   * @returns {number} number
   */
  public get createdTimestamp(): number {
    return this.message.createdTimestamp;
  }

  /**
   * Message author display name. Falls back to username if no display name is available.
   * @returns {string} Display name or username
   */
  public get displayName(): string {
    return this.message.member?.displayName || this.username;
  }

  /**
   * Returns true if the message has any attachments
   * @returns {boolean} boolean
   */
  public get hasAttachedImages(): boolean {
    return this.attachedImages.length > 0 || this.originalMessage.attachments.size > 0;
  }

  /**
   * Descriptions of images attached to the message
   * @returns {string[]} Image descriptions
   */
  public get imageDescriptions(): string[] {
    return this._imageDescriptions;
  }

  /**
   * Original Discord message
   * @returns {Message} Original Discord.js Message object
   */
  public get originalMessage(): Message {
    return this.message;
  }

  /**
   * Message content used by the OpenAI prompt content field.
   * @returns {string} Prompt content
   */
  public get promptContent(): string {
    return this.getPromptContent();
  }

  /**
   * Message role used by the OpenAI prompt role field.
   * @returns {string} Prompt role
   */
  public get promptRole(): string {
    return (this.botUserId === this.message.author.id)
      ? 'assistant'
      : 'user';
  }

  /**
   * Message author username (sanitized) used by the OpenAI prompt username field.
   * @returns {string} Prompt username
   */
  public get promptUsername(): string {
    if (!this._nameSanitized) {
      this._nameSanitized = this.message.author.username.replace(/[^a-zA-Z0-9_-]/g, '-');
    }
    return this._nameSanitized;
  }

  /**
   * Discord message type
   * @returns {BotcMessageType} Type of message being processed
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
   */
  public get username(): string {
    return this.message.author.username;
  }
}
