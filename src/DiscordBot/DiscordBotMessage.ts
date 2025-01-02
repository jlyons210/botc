import {
  ChannelType,
  Message,
} from 'discord.js';

import { DiscordMessageTypes } from './DiscordBot.types.js';

/** DiscordBotMessage */
export class DiscordBotMessage {
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
   * @returns {DiscordMessageTypes} DiscordMessageTypes
   */
  public get type(): DiscordMessageTypes {
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
