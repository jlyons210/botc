import { EventBus, EventMap } from '../EventBus/index.js';
import { DiscordClient } from '../../Clients/Discord/index.js';

/**
 * MessagePipeline is responsible for processing messages from the chat service and passing them
 * through the various stages of the bot's processing pipeline.
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
   * Register message pipeline event handlers
   */
  private async registerHandlers(): Promise<void> {
    this.globalEvents.on('DiscordClient:IncomingMessage',
      this.handleIncomingMessage.bind(this),
    );

    this.globalEvents.on('OpenAIClient:ResponseComplete',
      this.handleResponseComplete.bind(this),
    );
  }

  /**
   * Handle incoming message
   * @param {EventMap['DiscordClient:IncomingMessage']} data Incoming message
   */
  private async handleIncomingMessage(data: EventMap['DiscordClient:IncomingMessage']): Promise<void> {
    // Re-fire the incoming message event with the message histories and Discord client
    this.globalEvents.emit('MessagePipeline:IncomingMessage', {
      discordClient: this.discordClient,
      message: data.message,
    });
  }

  /**
   * Handle response complete
   * @param {EventMap['OpenAIClient:ResponseComplete']} data Response complete
   */
  private async handleResponseComplete(data: EventMap['OpenAIClient:ResponseComplete']): Promise<void> {
    await this.discordClient.sendMessage(data.channelId, data.response);
  }
}
