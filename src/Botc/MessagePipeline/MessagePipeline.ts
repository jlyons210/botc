import { EventBus, EventMap } from '../EventBus/index.js';
import { BotcMessage } from '../index.js';
import { DiscordClient } from '../../Clients/Discord/index.js';

/**
 * The message pipeline is responsible for processing messages from the chat service and passing
 * them through the various stages of the bot's processing pipeline.
 */
export class MessagePipeline<T extends EventMap> {
  private globalEvents = EventBus.attach();
  /**
   * Initialize the message pipeline
   * @param {DiscordClient} discordClient Discord client
   */
  constructor(private discordClient: DiscordClient) {
    this.registerHandlers();
  }

  /**
   * Handle incoming message
   * @template T EventMap
   * @param {T['DiscordClient:IncomingMessage']} data Incoming message
   */
  private async handleIncomingMessage(data: T['DiscordClient:IncomingMessage']): Promise<void> {
    // If the incoming message is from this bot, ignore it
    if (data.message.type === 'OwnMessage') return;

    const channelHistory = await this.getChannelHistory(data.message.originalMessage.channelId);
    this.globalEvents.emit('MessagePipeline:IncomingMessage', {
      messageHistory: channelHistory,
    });
  }

  /**
   * Handle response complete
   * @template T EventMap
   * @param {T['OpenAIClient:ResponseComplete']} data Response complete
   */
  private async handleResponseComplete(data: T['OpenAIClient:ResponseComplete']): Promise<void> {
    await this.discordClient.sendMessage(data.channelId, data.response);
  }

  /**
   * Get channel history
   * @param {string} channelId Channel ID
   * @returns {Promise<BotcMessage[]>} Channel message history
   */
  private async getChannelHistory(channelId: string): Promise<BotcMessage[]> {
    return await this.discordClient.getChannelHistory(channelId);
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
