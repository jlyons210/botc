import { BotcMessageImageAttachment, BotcMessageType } from '../Botc/index.js';
import { ChannelType, Message } from 'discord.js';
import { EventBus } from './EventBus/index.js';

/** DiscordBotMessage */
export class BotcMessage {
  private globalEvents = EventBus.attach();

  /**
   * New DiscordBotMessage
   * @param {Message} message Message
   * @param {string} botUserId string
   */
  constructor(private message: Message, private botUserId: string) { }

  /**
   * Add a description for an image attached to the message
   * @param {string} description Image description
   */
  public addImageDescription(description: string): void {
    this._imageDescriptions.push(description);
  }

  /**
   * Returns a list of URLs for all attachments in the message
   * @returns {BotcMessageImageAttachment[]} Image URLs
   * @readonly
   */
  public get attachedImages(): BotcMessageImageAttachment[] {
    if (this._attachedImages.length === 0) {
      const allowedContentTypes = [
        'image/gif',
        'image/jpeg',
        'image/png',
        'image/webp',
      ];

      this._attachedImages = this.message.attachments
        .filter(attachment =>
          attachment.contentType && allowedContentTypes.includes(attachment.contentType),
        ).map(attachment =>
          ({
            contentType: attachment.contentType as string,
            height: attachment.height as number,
            imageUrl: attachment.url,
            width: attachment.width as number,
          }),
        );
    }

    return this._attachedImages;
  }

  private _attachedImages: BotcMessageImageAttachment[] = [];

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
   * Message author display name
   * @returns {string} string
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
   * @returns {string} string
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

  private _imageDescriptions: string[] = [];

  /**
   * Message author username (sanitized). The OpenAI API requires usernames to be alphanumeric with
   * only hyphens and underscores allowed.
   * @returns {string} string
   * @readonly
   */
  public get nameSanitized(): string {
    if (!this._nameSanitized) {
      this._nameSanitized = this.message.author.username.replace(/[^a-zA-Z0-9_-]/g, '-');
    }
    return this._nameSanitized;
  }

  private _nameSanitized!: string;

  /**
   * Original Discord message
   * @returns {Message} Message
   */
  public get originalMessage(): Message {
    return this.message;
  }

  /**
   * Message role
   * @returns {string} string
   * @readonly
   */
  public get role(): string {
    return (this.botUserId === this.message.author.id)
      ? 'assistant'
      : 'user';
  }

  /**
   * Message type
   * @returns {BotcMessageType} BotcMessageType
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
   * @returns {string} string
   * @readonly
   */
  public get username(): string {
    return this.message.author.username;
  }
}
