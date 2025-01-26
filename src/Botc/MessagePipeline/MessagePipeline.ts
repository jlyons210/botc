import { EventBus, EventMap } from '../EventBus/index.js';
import { BotcMessage } from '../BotcMessage.js';
import { DiscordClient } from '../../Clients/Discord/index.js';

/**
 * The message pipeline is responsible for processing messages from the chat service and passing
 * them through the various stages of the bot's processing pipeline.
 */
export class MessagePipeline {
  private globalEvents = EventBus.attach();

  /**
   * Initialize the message pipeline
   * @param {DiscordClient} discordClient Discord client
   */
  constructor(private discordClient: DiscordClient) {
    this.registerHandlers();

    this.globalEvents.emit('MessagePipeline:Ready', {
      message: 'Message pipeline is ready.',
    });
  }

  /**
   * Summarize user behavior
   * @param {EventMap['DiscordClient:IncomingMessage']} data Incoming message
   * @returns {Promise<string>} User context
   */
  private async getServerHistoryForUser(data: EventMap['DiscordClient:IncomingMessage']): Promise<BotcMessage[]> {
    const channels = await data.message.originalMessage.guild?.channels.fetch();

    if (channels) {
      const messages = await Promise.all(channels.map(channel => channels.get(channel?.id as string))
        .filter(channel => channel?.isTextBased())
        .map(async (channel) => {
          return await this.discordClient.getChannelHistory(
            channel?.id as string,
            data.message.originalMessage.author.id,
          ).then(history =>
            history.filter(message => message.content.length > 0),
          );
        }));

      return messages.flat();
    }
    else {
      return [];
    }
  }

  /**
   * Handle incoming message
   * @param {EventMap['DiscordClient:IncomingMessage']} data Incoming message
   */
  private async handleIncomingMessage(data: EventMap['DiscordClient:IncomingMessage']): Promise<void> {
    // Ignore bot's own messages
    if (data.message.type === 'OwnMessage') return;

    const channelHistory = await this.discordClient.getChannelHistory(data.message.originalMessage.channelId);
    const serverHistory = await this.getServerHistoryForUser(data);

    this.globalEvents.emit('MessagePipeline:IncomingMessage', {
      messageHistory: channelHistory,
      serverHistory: serverHistory,
    });
  }

  /**
   * Handle response complete
   * @param {EventMap['OpenAIClient:ResponseComplete']} data Response complete
   */
  private async handleResponseComplete(data: EventMap['OpenAIClient:ResponseComplete']): Promise<void> {
    await this.discordClient.sendMessage(data.channelId, data.response);
  }

  /**
   * Register message pipeline event handlers
   */
  private registerHandlers(): void {
    this.globalEvents.on('DiscordClient:IncomingMessage', (data) => {
      this.handleIncomingMessage(data);
    });

    this.globalEvents.on('OpenAIClient:ResponseComplete', (data) => {
      this.handleResponseComplete(data);
    });
  }
}
