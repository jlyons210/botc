import { ChannelType, Message } from 'discord.js';
import { BotcMessageType } from '../Botc/index.js';

/** DiscordBotMessage */
export class BotcMessage {
  /**
   * New DiscordBotMessage
   * @param {Message} message Message
   * @param {string} botUserId string
   */
  constructor(private message: Message, private botUserId: string) { }

  /**
   * Message channel ID
   * @returns {string} string
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
   * Message author username (sanitized)
   * The OpenAI API requires usernames to be alphanumeric with only hyphens and underscores.
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
