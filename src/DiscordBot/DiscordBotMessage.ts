import {
  ChannelType,
  Message,
} from 'discord.js';

import { DiscordMessageTypes } from './DiscordBot.types';

/** DiscordBotMessage */
export class DiscordBotMessage {

  /**
   * New DiscordBotMessage
   * @param message Message
   * @param botUserId string
   */
  constructor(private message: Message, private botUserId: string) {
    // no-op
  }

  /**
   * Original Discord message
   * @returns Message
   */
  public get originalMessage(): Message {
    return this.message;
  }

  /**
   * Message type
   * @returns DiscordMessageTypes
   */
  public get type(): DiscordMessageTypes {
    switch (true) {
      case (this.message.channel.type === ChannelType.DM):
        return DiscordMessageTypes.DirectMessage;

      case (this.message.author.id === this.botUserId):
        return DiscordMessageTypes.OwnMessage;

      case (this.message.author.bot):
        return DiscordMessageTypes.BotMessage;

      default:
        return DiscordMessageTypes.ChannelMessage;
    }
  }
}