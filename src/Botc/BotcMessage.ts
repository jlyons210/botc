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
   * Original Discord message
   * @returns {Message} Message
   */
  public get originalMessage(): Message {
    return this.message;
  }

  /**
   * Message type
   * @returns {BotcMessageType} BotcMessageType
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
}
