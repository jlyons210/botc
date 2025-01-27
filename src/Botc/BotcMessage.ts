import { ChannelType, Message } from 'discord.js';
import { BotcMessageType } from '../Botc/index.js';
import { EventBus } from './EventBus/index.js';

/** DiscordBotMessage */
export class BotcMessage {
  private globalEvents = EventBus.attach();

  /**
   * New DiscordBotMessage
   * @param {Message} message Message
   * @param {string} botUserId string
   */
  constructor(private message: Message, private botUserId: string) {
    console.debug(`BotcMessage: New message has attached images: ${this.hasAttachedImages}`);
    if (this.hasAttachedImages) {
      this.describeAttachedImages();
    }
  }

  /**
   * Describe attached images
   */
  private async describeAttachedImages(): Promise<void> {
    this.globalEvents.emit('BotcMessage:DescribeAttachedImages', {
      message: this,
    });
  }

  /**
   * Returns a list of URLs for all attachments in the message
   * @returns {BotcMessageImageAttachment[]} Image URLs
   * @readonly
   */
  public get attachedImages(): BotcMessageImageAttachment[] {
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
    return this.message.content;
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
      case (this.message.author.id === this.botUserId):
        return 'OwnMessage';

      case (this.message.channel.type === ChannelType.DM):
        return 'DirectMessage';

      case (this.message.author.bot):
        return 'BotMessage';

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

export type BotcMessageImageAttachment = {
  imageUrl: string;
  description: string;
};
